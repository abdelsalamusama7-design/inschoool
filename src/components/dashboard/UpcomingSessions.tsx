import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, ExternalLink } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UpcomingSessionsProps {
  courseIds: string[];
}

const UpcomingSessions = ({ courseIds }: UpcomingSessionsProps) => {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['upcoming-sessions', courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*, courses(title)')
        .in('course_id', courseIds)
        .gte('scheduled_at', new Date().toISOString())
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: courseIds.length > 0,
  });

  if (isLoading) return null;
  if (!sessions || sessions.length === 0) return null;

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'اليوم';
    if (isTomorrow(date)) return 'غداً';
    return format(date, 'EEEE d MMMM', { locale: ar });
  };

  const isLive = (scheduledAt: string, durationMin: number) => {
    const now = new Date();
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + durationMin * 60000);
    return now >= start && now <= end;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          المحاضرات القادمة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session: any) => {
            const live = isLive(session.scheduled_at, session.duration_minutes);
            return (
              <div key={session.id} className={`p-3 rounded-lg border ${live ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'bg-muted/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{session.title}</h4>
                      {live && <Badge className="bg-green-600 hover:bg-green-700 text-xs">🔴 جارية الآن</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{session.courses?.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {getDateLabel(new Date(session.scheduled_at))}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(session.scheduled_at), 'hh:mm a')}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => window.open(session.meeting_url, '_blank')} className={live ? 'bg-green-600 hover:bg-green-700' : ''}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    {live ? 'انضم الآن' : 'فتح الرابط'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingSessions;
