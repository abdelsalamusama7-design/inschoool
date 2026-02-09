-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', true);

-- Allow anyone to view course materials (public bucket)
CREATE POLICY "Anyone can view course materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-materials');

-- Instructors can upload course materials
CREATE POLICY "Instructors can upload course materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-materials' 
  AND public.has_role(auth.uid(), 'instructor'::public.app_role)
);

-- Instructors can update their course materials
CREATE POLICY "Instructors can update course materials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-materials' 
  AND public.has_role(auth.uid(), 'instructor'::public.app_role)
);

-- Instructors can delete their course materials
CREATE POLICY "Instructors can delete course materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-materials' 
  AND public.has_role(auth.uid(), 'instructor'::public.app_role)
);

-- Add thumbnail_url and materials columns to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Create course_materials table for file attachments
CREATE TABLE public.course_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Anyone can view materials for courses they can see
CREATE POLICY "Anyone can view course materials records"
ON public.course_materials FOR SELECT
USING (true);

-- Instructors can insert materials for their own courses
CREATE POLICY "Instructors can add course materials"
ON public.course_materials FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'instructor'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = course_materials.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

-- Instructors can delete materials for their own courses
CREATE POLICY "Instructors can delete course materials"
ON public.course_materials FOR DELETE
USING (
  public.has_role(auth.uid(), 'instructor'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = course_materials.course_id 
    AND courses.instructor_id = auth.uid()
  )
);