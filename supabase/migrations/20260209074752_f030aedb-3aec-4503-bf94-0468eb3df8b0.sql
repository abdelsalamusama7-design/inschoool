
-- Create table for tracking Scratch activity completions
CREATE TABLE public.scratch_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint so a student can only complete a lesson's scratch activity once
ALTER TABLE public.scratch_activity_logs
  ADD CONSTRAINT scratch_activity_logs_user_lesson_unique UNIQUE (user_id, lesson_id);

-- Enable RLS
ALTER TABLE public.scratch_activity_logs ENABLE ROW LEVEL SECURITY;

-- Students can view their own logs
CREATE POLICY "Users can view own scratch logs"
  ON public.scratch_activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Students can insert their own logs
CREATE POLICY "Users can insert own scratch logs"
  ON public.scratch_activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Instructors can view all scratch logs
CREATE POLICY "Instructors can view all scratch logs"
  ON public.scratch_activity_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'instructor'::app_role));

-- Parents can view linked student scratch logs
CREATE POLICY "Parents can view linked student scratch logs"
  ON public.scratch_activity_logs
  FOR SELECT
  USING (
    has_role(auth.uid(), 'parent'::app_role)
    AND EXISTS (
      SELECT 1 FROM student_parent_links
      WHERE student_parent_links.parent_id = auth.uid()
        AND student_parent_links.student_id = scratch_activity_logs.user_id
    )
  );
