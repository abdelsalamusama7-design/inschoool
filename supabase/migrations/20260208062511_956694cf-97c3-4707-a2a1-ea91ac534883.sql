
-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text NOT NULL,
  price decimal NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EGP',
  duration_days integer NOT NULL DEFAULT 30,
  max_lessons integer, -- null = unlimited
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Instructors can manage plans"
ON public.subscription_plans FOR ALL
USING (has_role(auth.uid(), 'instructor'::app_role));

-- User subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired', 'cancelled')),
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can create subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Instructors can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Instructors can update subscriptions"
ON public.subscriptions FOR UPDATE
USING (has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Parents can view linked student subscriptions"
ON public.subscriptions FOR SELECT
USING (
  has_role(auth.uid(), 'parent'::app_role) AND
  EXISTS (
    SELECT 1 FROM student_parent_links
    WHERE parent_id = auth.uid() AND student_id = subscriptions.user_id
  )
);

-- Payment requests table
CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id),
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  payment_method text NOT NULL CHECK (payment_method IN ('vodafone_cash', 'instapay', 'fawry')),
  amount decimal NOT NULL,
  screenshot_url text,
  reference_number text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
ON public.payment_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment requests"
ON public.payment_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Instructors can view all payments"
ON public.payment_requests FOR SELECT
USING (has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Instructors can update payments"
ON public.payment_requests FOR UPDATE
USING (has_role(auth.uid(), 'instructor'::app_role));

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', false);

CREATE POLICY "Users can upload own screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Instructors can view all screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-screenshots' AND has_role(auth.uid(), 'instructor'::app_role));

-- Trigger for updating subscriptions timestamp
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default subscription plans
INSERT INTO public.subscription_plans (name, name_ar, price, duration_days, max_lessons, features) VALUES
('Free', 'مجاني', 0, 365, 3, '["3 دروس مجانية", "الوصول للمحتوى الأساسي"]'::jsonb),
('Basic Monthly', 'الباقة الأساسية', 200, 30, null, '["دروس غير محدودة", "دعم عبر الواتساب", "شهادة إتمام"]'::jsonb),
('Premium Monthly', 'الباقة المميزة', 350, 30, null, '["دروس غير محدودة", "جلسات خاصة", "دعم أولوية", "شهادة إتمام", "تقارير تفصيلية"]'::jsonb);
