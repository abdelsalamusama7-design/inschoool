
-- Create exam type enum
CREATE TYPE public.exam_type AS ENUM ('midterm', 'final');

-- Add exam_type column
ALTER TABLE public.exams ADD COLUMN exam_type public.exam_type NOT NULL DEFAULT 'midterm';

-- Add course_id column
ALTER TABLE public.exams ADD COLUMN course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;

-- Make lesson_id nullable
ALTER TABLE public.exams ALTER COLUMN lesson_id DROP NOT NULL;

-- Populate course_id from existing lesson relationships
UPDATE public.exams SET course_id = (SELECT course_id FROM public.lessons WHERE id = exams.lesson_id) WHERE lesson_id IS NOT NULL;
