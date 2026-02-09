-- Add student/group name column to schedules
ALTER TABLE public.schedules
ADD COLUMN student_or_group text;