CREATE OR REPLACE FUNCTION public.verify_certificate_by_number(_cert_number TEXT)
RETURNS TABLE(
  student_name TEXT,
  course_title TEXT,
  score INTEGER,
  total_points INTEGER,
  certificate_number TEXT,
  issued_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT student_name, course_title, score, total_points, certificate_number, issued_at
  FROM public.certificates
  WHERE certificate_number = _cert_number
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate_by_number(TEXT) TO anon, authenticated;