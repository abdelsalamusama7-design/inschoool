
-- Create live sessions table
CREATE TABLE public.live_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  meeting_url text NOT NULL,
  meeting_platform text NOT NULL DEFAULT 'zoom',
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'scheduled',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can view sessions (students need to see them)
CREATE POLICY "Anyone can view live sessions"
ON public.live_sessions
FOR SELECT
USING (true);

-- Instructors can manage their own sessions
CREATE POLICY "Instructors can manage live sessions"
ON public.live_sessions
FOR ALL
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1 FROM courses WHERE courses.id = live_sessions.course_id AND courses.instructor_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_live_sessions_updated_at
BEFORE UPDATE ON public.live_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
