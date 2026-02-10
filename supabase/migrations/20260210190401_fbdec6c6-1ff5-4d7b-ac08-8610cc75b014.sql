
-- Create tutorial_videos table for instructor-managed videos
CREATE TABLE public.tutorial_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_type TEXT NOT NULL CHECK (lab_type IN ('scratch', 'python', 'roblox', 'minecraft')),
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_index INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.tutorial_videos ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view
CREATE POLICY "Anyone can view tutorial videos"
ON public.tutorial_videos FOR SELECT
USING (true);

-- Instructors can manage
CREATE POLICY "Instructors can insert tutorial videos"
ON public.tutorial_videos FOR INSERT
WITH CHECK (has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Instructors can update tutorial videos"
ON public.tutorial_videos FOR UPDATE
USING (has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Instructors can delete tutorial videos"
ON public.tutorial_videos FOR DELETE
USING (has_role(auth.uid(), 'instructor'::app_role));
