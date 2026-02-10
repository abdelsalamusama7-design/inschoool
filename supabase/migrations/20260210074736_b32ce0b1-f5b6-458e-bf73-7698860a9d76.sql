
-- Points log: tracks every point-earning action
CREATE TABLE public.student_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  lab_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own points" ON public.student_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own points" ON public.student_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Instructors can view all points" ON public.student_points
  FOR SELECT USING (has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Parents can view linked student points" ON public.student_points
  FOR SELECT USING (
    has_role(auth.uid(), 'parent'::app_role) AND EXISTS (
      SELECT 1 FROM student_parent_links
      WHERE parent_id = auth.uid() AND student_id = student_points.user_id
    )
  );

-- Badges earned by students
CREATE TABLE public.student_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL DEFAULT '🏆',
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own badges" ON public.student_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own badges" ON public.student_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Instructors can view all badges" ON public.student_badges
  FOR SELECT USING (has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Parents can view linked student badges" ON public.student_badges
  FOR SELECT USING (
    has_role(auth.uid(), 'parent'::app_role) AND EXISTS (
      SELECT 1 FROM student_parent_links
      WHERE parent_id = auth.uid() AND student_id = student_badges.user_id
    )
  );

-- Index for fast lookups
CREATE INDEX idx_student_points_user ON public.student_points(user_id);
CREATE INDEX idx_student_badges_user ON public.student_badges(user_id);
