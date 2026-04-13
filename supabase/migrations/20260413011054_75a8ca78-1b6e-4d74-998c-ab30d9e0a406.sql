
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  certificate_number TEXT NOT NULL UNIQUE DEFAULT 'CERT-' || substr(gen_random_uuid()::text, 1, 8),
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own certificates"
ON public.certificates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own certificates"
ON public.certificates FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Admins can manage all certificates"
ON public.certificates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can view all certificates"
ON public.certificates FOR SELECT
USING (has_role(auth.uid(), 'instructor'::app_role));

CREATE UNIQUE INDEX idx_certificates_user_exam ON public.certificates(user_id, exam_id);
