import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown, Star, Users } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
  badges_json: { badge_key: string; badge_name: string; badge_icon: string }[];
}

const rankStyles = [
  { icon: Crown, bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-300', label: '🥇' },
  { icon: Medal, bg: 'bg-slate-300/20', text: 'text-slate-500', border: 'border-slate-300', label: '🥈' },
  { icon: Medal, bg: 'bg-orange-400/10', text: 'text-orange-500', border: 'border-orange-300', label: '🥉' },
];

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: 50 });
    if (data && !error) {
      setEntries(data.map((d: any) => ({
        ...d,
        badges_json: Array.isArray(d.badges_json) ? d.badges_json : [],
      })));
    }
    setLoading(false);
  };

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?';

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading leaderboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Leaderboard 🏆</h1>
          <p className="text-muted-foreground">Top coders ranked by points</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-4 rounded-full bg-muted">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No entries yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Start coding in the labs to earn points and appear on the leaderboard!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Top 3 podium */}
          {entries.length >= 1 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {entries.slice(0, 3).map((entry, index) => {
                const style = rankStyles[index];
                const isCurrentUser = entry.user_id === user?.id;
                return (
                  <Card
                    key={entry.user_id}
                    className={`overflow-hidden transition-all ${isCurrentUser ? 'ring-2 ring-primary' : ''} ${index === 0 ? 'sm:order-2' : index === 1 ? 'sm:order-1' : 'sm:order-3'}`}
                  >
                    <div className={`h-2 bg-gradient-to-r ${index === 0 ? 'from-amber-400 to-yellow-400' : index === 1 ? 'from-slate-300 to-slate-400' : 'from-orange-300 to-orange-400'}`} />
                    <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                      <div className="text-3xl">{style.label}</div>
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className={`${style.bg} ${style.text} text-lg font-bold`}>
                          {getInitials(entry.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-base">{entry.full_name}</h3>
                        <p className={`text-lg font-bold ${style.text}`}>{entry.total_points} pts</p>
                      </div>
                      {entry.badges_json.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {entry.badges_json.slice(0, 4).map((b) => (
                            <span key={b.badge_key} className="text-lg" title={b.badge_name}>
                              {b.badge_icon}
                            </span>
                          ))}
                          {entry.badges_json.length > 4 && (
                            <Badge variant="secondary" className="text-[10px]">+{entry.badges_json.length - 4}</Badge>
                          )}
                        </div>
                      )}
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Rest of the list */}
          {entries.length > 3 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {entries.slice(3).map((entry, index) => {
                    const rank = index + 4;
                    const isCurrentUser = entry.user_id === user?.id;
                    return (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-4 px-4 py-3 ${isCurrentUser ? 'bg-primary/5' : ''}`}
                      >
                        <span className="text-sm font-bold text-muted-foreground w-8 text-center">
                          #{rank}
                        </span>
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs font-medium">
                            {getInitials(entry.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {entry.full_name}
                            {isCurrentUser && <Badge variant="outline" className="ml-2 text-[10px]">You</Badge>}
                          </p>
                          {entry.badges_json.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                              {entry.badges_json.slice(0, 3).map((b) => (
                                <span key={b.badge_key} className="text-sm" title={b.badge_name}>{b.badge_icon}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-bold text-amber-600">{entry.total_points} pts</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
