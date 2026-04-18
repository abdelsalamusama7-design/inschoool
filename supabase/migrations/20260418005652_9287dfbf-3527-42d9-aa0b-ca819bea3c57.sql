-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_id_unread ON public.notifications(user_id) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can manage all notifications"
ON public.notifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- System (security definer functions) inserts notifications
CREATE POLICY "Allow system inserts"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- ====== TRIGGERS ======

-- 1. Notify enrolled students when an exam is published
CREATE OR REPLACE FUNCTION public.notify_students_on_exam_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_id_val UUID;
  course_title_val TEXT;
BEGIN
  -- Only fire when becoming published
  IF (TG_OP = 'INSERT' AND NEW.is_published = true)
     OR (TG_OP = 'UPDATE' AND NEW.is_published = true AND COALESCE(OLD.is_published, false) = false) THEN

    -- Resolve course id (direct or via lesson)
    course_id_val := NEW.course_id;
    IF course_id_val IS NULL AND NEW.lesson_id IS NOT NULL THEN
      SELECT course_id INTO course_id_val FROM public.lessons WHERE id = NEW.lesson_id;
    END IF;

    IF course_id_val IS NOT NULL THEN
      SELECT title INTO course_title_val FROM public.courses WHERE id = course_id_val;

      INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
      SELECT
        e.user_id,
        'exam_published',
        'امتحان جديد متاح',
        'تم فتح امتحان "' || NEW.title || '"' || COALESCE(' في دورة ' || course_title_val, ''),
        '/dashboard/exams/' || NEW.id || '/take',
        jsonb_build_object('exam_id', NEW.id, 'course_id', course_id_val, 'exam_type', NEW.exam_type)
      FROM public.enrollments e
      WHERE e.course_id = course_id_val;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_exam_published
AFTER INSERT OR UPDATE OF is_published ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.notify_students_on_exam_published();

-- 2. Notify student when their payment request is reviewed
CREATE OR REPLACE FUNCTION public.notify_student_on_payment_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_name_val TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status <> COALESCE(OLD.status, '') AND NEW.status IN ('approved', 'rejected') THEN
    SELECT name_ar INTO plan_name_val FROM public.subscription_plans WHERE id = NEW.plan_id;

    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
      VALUES (
        NEW.user_id,
        'payment_approved',
        'تمت الموافقة على اشتراكك ✅',
        'تم قبول طلب اشتراكك في باقة "' || COALESCE(plan_name_val, 'باقة') || '". يمكنك الآن الاستفادة من جميع المميزات.',
        '/dashboard/subscription',
        jsonb_build_object('payment_request_id', NEW.id, 'status', NEW.status)
      );
    ELSE
      INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
      VALUES (
        NEW.user_id,
        'payment_rejected',
        'تم رفض طلب الاشتراك',
        'للأسف تم رفض طلب اشتراكك في باقة "' || COALESCE(plan_name_val, 'باقة') || '"' || COALESCE('. السبب: ' || NEW.admin_notes, '') || '. يرجى التواصل مع الإدارة.',
        '/dashboard/subscription',
        jsonb_build_object('payment_request_id', NEW.id, 'status', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_payment_review
AFTER UPDATE OF status ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_student_on_payment_review();
