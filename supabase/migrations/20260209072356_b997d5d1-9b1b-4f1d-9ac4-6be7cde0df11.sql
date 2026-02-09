
-- Create a security definer function to look up a student by email for linking
-- This avoids RLS issues since parents can't see unlinked student profiles
CREATE OR REPLACE FUNCTION public.find_student_by_email(_email text)
RETURNS TABLE(student_user_id uuid, student_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE p.email = _email
    AND ur.role = 'student'
  LIMIT 1;
$$;
