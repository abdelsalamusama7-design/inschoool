
-- Leaderboard function: returns top students by total points with their badges
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_points BIGINT,
  badges_json JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sp.user_id,
    p.full_name,
    p.avatar_url,
    SUM(sp.points)::BIGINT AS total_points,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('badge_key', sb.badge_key, 'badge_name', sb.badge_name, 'badge_icon', sb.badge_icon))
       FROM public.student_badges sb WHERE sb.user_id = sp.user_id),
      '[]'::jsonb
    ) AS badges_json
  FROM public.student_points sp
  INNER JOIN public.profiles p ON p.user_id = sp.user_id
  GROUP BY sp.user_id, p.full_name, p.avatar_url
  ORDER BY total_points DESC
  LIMIT limit_count;
$$;
