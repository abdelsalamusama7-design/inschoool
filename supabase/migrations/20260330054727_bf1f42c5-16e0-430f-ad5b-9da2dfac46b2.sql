
-- Allow admins to view all user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert user_roles (for creating admin accounts)
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert profiles
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all courses
CREATE POLICY "Admins can manage all courses"
ON public.courses
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all subscriptions
CREATE POLICY "Admins can manage subscriptions"
ON public.subscriptions
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all enrollments
CREATE POLICY "Admins can view all enrollments"
ON public.enrollments
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage lessons
CREATE POLICY "Admins can manage all lessons"
ON public.lessons
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage schedules
CREATE POLICY "Admins can manage all schedules"
ON public.schedules
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage live sessions
CREATE POLICY "Admins can manage all live sessions"
ON public.live_sessions
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all payment requests
CREATE POLICY "Admins can manage payment requests"
ON public.payment_requests
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage subscription plans
CREATE POLICY "Admins can manage all plans"
ON public.subscription_plans
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all student points
CREATE POLICY "Admins can view all student points"
ON public.student_points
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all student badges
CREATE POLICY "Admins can view all badges"
ON public.student_badges
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all progress
CREATE POLICY "Admins can view all progress"
ON public.progress
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage tutorial videos
CREATE POLICY "Admins can manage tutorial videos"
ON public.tutorial_videos
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage course materials
CREATE POLICY "Admins can manage course materials"
ON public.course_materials
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all scratch activity logs
CREATE POLICY "Admins can view all scratch logs"
ON public.scratch_activity_logs
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));
