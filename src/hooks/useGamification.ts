import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Badge {
  badge_key: string;
  badge_name: string;
  badge_icon: string;
  earned_at: string;
}

// Badge definitions
const BADGE_DEFINITIONS: Record<string, { name: string; icon: string; description: string; requirement: (totalPoints: number, labCounts: Record<string, number>) => boolean }> = {
  first_code: { name: 'First Code', icon: '🌟', description: 'Run your first code', requirement: (pts) => pts >= 10 },
  explorer: { name: 'Explorer', icon: '🧭', description: 'Earn 50 points', requirement: (pts) => pts >= 50 },
  coder: { name: 'Coder', icon: '💻', description: 'Earn 100 points', requirement: (pts) => pts >= 100 },
  hacker: { name: 'Hacker', icon: '🚀', description: 'Earn 250 points', requirement: (pts) => pts >= 250 },
  master: { name: 'Master', icon: '👑', description: 'Earn 500 points', requirement: (pts) => pts >= 500 },
  python_fan: { name: 'Python Fan', icon: '🐍', description: 'Complete 3 Python challenges', requirement: (_, labs) => (labs['python'] || 0) >= 3 },
  scratch_fan: { name: 'Scratch Fan', icon: '🎨', description: 'Complete 3 Scratch activities', requirement: (_, labs) => (labs['scratch'] || 0) >= 3 },
  multi_lab: { name: 'Multi-Lab', icon: '🔬', description: 'Use 2+ different labs', requirement: (_, labs) => Object.keys(labs).length >= 2 },
};

export const POINTS_CONFIG = {
  python_challenge: 15,
  python_run: 5,
  scratch_activity: 10,
  roblox_visit: 5,
  minecraft_visit: 5,
};

export function useGamification() {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [labCounts, setLabCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [pointsRes, badgesRes] = await Promise.all([
      supabase.from('student_points').select('points, lab_type').eq('user_id', user.id),
      supabase.from('student_badges').select('badge_key, badge_name, badge_icon, earned_at').eq('user_id', user.id),
    ]);

    if (pointsRes.data) {
      const total = pointsRes.data.reduce((sum, p) => sum + p.points, 0);
      setTotalPoints(total);

      const counts: Record<string, number> = {};
      pointsRes.data.forEach((p) => {
        counts[p.lab_type] = (counts[p.lab_type] || 0) + 1;
      });
      setLabCounts(counts);
    }

    if (badgesRes.data) {
      setBadges(badgesRes.data);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const awardPoints = useCallback(async (points: number, reason: string, labType: string) => {
    if (!user) return;

    const { error } = await supabase.from('student_points').insert({
      user_id: user.id,
      points,
      reason,
      lab_type: labType,
    });

    if (!error) {
      const newTotal = totalPoints + points;
      setTotalPoints(newTotal);
      setLabCounts((prev) => ({ ...prev, [labType]: (prev[labType] || 0) + 1 }));
      toast.success(`+${points} points! ⭐`, { description: reason });

      // Check for new badges
      const updatedCounts = { ...labCounts, [labType]: (labCounts[labType] || 0) + 1 };
      await checkAndAwardBadges(newTotal, updatedCounts);
    }
  }, [user, totalPoints, labCounts]);

  const checkAndAwardBadges = async (pts: number, counts: Record<string, number>) => {
    if (!user) return;

    const earnedKeys = new Set(badges.map((b) => b.badge_key));

    for (const [key, def] of Object.entries(BADGE_DEFINITIONS)) {
      if (earnedKeys.has(key)) continue;
      if (!def.requirement(pts, counts)) continue;

      const { error } = await supabase.from('student_badges').insert({
        user_id: user.id,
        badge_key: key,
        badge_name: def.name,
        badge_icon: def.icon,
      });

      if (!error) {
        const newBadge = { badge_key: key, badge_name: def.name, badge_icon: def.icon, earned_at: new Date().toISOString() };
        setBadges((prev) => [...prev, newBadge]);
        toast.success(`New Badge: ${def.icon} ${def.name}!`, { description: def.description });
      }
    }
  };

  return { totalPoints, badges, loading, awardPoints, allBadges: BADGE_DEFINITIONS, labCounts, refetch: fetchData };
}
