
-- Add Scratch coding workspace fields to lessons table
ALTER TABLE public.lessons
ADD COLUMN scratch_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN scratch_url text DEFAULT NULL,
ADD COLUMN scratch_instructions text DEFAULT NULL;
