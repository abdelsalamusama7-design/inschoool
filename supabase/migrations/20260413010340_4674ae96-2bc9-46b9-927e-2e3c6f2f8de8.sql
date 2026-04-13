
-- Create exam question type enum
CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'true_false');

-- Create exams table
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam questions table
CREATE TABLE public.exam_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type public.question_type NOT NULL DEFAULT 'multiple_choice',
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam submissions table
CREATE TABLE public.exam_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER,
  total_points INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint: one submission per student per exam
ALTER TABLE public.exam_submissions ADD CONSTRAINT unique_student_exam UNIQUE (exam_id, user_id);

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

-- EXAMS policies
CREATE POLICY "Admins can manage all exams" ON public.exams FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can manage exams for their lessons" ON public.exams FOR ALL USING (
  has_role(auth.uid(), 'instructor'::app_role) AND EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.courses c ON c.id = l.course_id
    WHERE l.id = exams.lesson_id AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Students can view published exams" ON public.exams FOR SELECT USING (
  is_published = true AND has_role(auth.uid(), 'student'::app_role)
);

-- EXAM QUESTIONS policies
CREATE POLICY "Admins can manage all questions" ON public.exam_questions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can manage questions for their exams" ON public.exam_questions FOR ALL USING (
  has_role(auth.uid(), 'instructor'::app_role) AND EXISTS (
    SELECT 1 FROM public.exams e
    JOIN public.lessons l ON l.id = e.lesson_id
    JOIN public.courses c ON c.id = l.course_id
    WHERE e.id = exam_questions.exam_id AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Students can view questions of published exams" ON public.exam_questions FOR SELECT USING (
  has_role(auth.uid(), 'student'::app_role) AND EXISTS (
    SELECT 1 FROM public.exams e WHERE e.id = exam_questions.exam_id AND e.is_published = true
  )
);

-- EXAM SUBMISSIONS policies
CREATE POLICY "Admins can view all submissions" ON public.exam_submissions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can view submissions for their exams" ON public.exam_submissions FOR SELECT USING (
  has_role(auth.uid(), 'instructor'::app_role) AND EXISTS (
    SELECT 1 FROM public.exams e
    JOIN public.lessons l ON l.id = e.lesson_id
    JOIN public.courses c ON c.id = l.course_id
    WHERE e.id = exam_submissions.exam_id AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Students can submit their own answers" ON public.exam_submissions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND has_role(auth.uid(), 'student'::app_role)
);

CREATE POLICY "Students can view their own submissions" ON public.exam_submissions FOR SELECT USING (
  auth.uid() = user_id
);

-- Trigger for updated_at on exams
CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
