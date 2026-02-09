import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users } from 'lucide-react';

interface ScheduleItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  student_or_group: string | null;
  course_title: string;
  course_age_group: string;
}

const DAYS = [
  { value: 0, label: 'Sunday', labelAr: 'الأحد' },
  { value: 1, label: 'Monday', labelAr: 'الاثنين' },
  { value: 2, label: 'Tuesday', labelAr: 'الثلاثاء' },
  { value: 3, label: 'Wednesday', labelAr: 'الأربعاء' },
  { value: 4, label: 'Thursday', labelAr: 'الخميس' },
  { value: 5, label: 'Friday', labelAr: 'الجمعة' },
  { value: 6, label: 'Saturday', labelAr: 'السبت' },
];

interface WeeklyScheduleViewProps {
  courseIds: string[];
  title?: string;
  description?: string;
}

const WeeklyScheduleView = ({
  courseIds,
  title = 'الجدول الأسبوعي',
  description = 'مواعيد الحصص الأسبوعية',
}: WeeklyScheduleViewProps) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseIds.length > 0) {
      fetchSchedules();
    } else {
      setLoading(false);
    }
  }, [courseIds]);

  const fetchSchedules = async () => {
    try {
      const { data } = await supabase
        .from('schedules')
        .select('*, courses!inner(title, age_group)')
        .in('course_id', courseIds)
        .order('day_of_week')
        .order('start_time');

      if (data) {
        setSchedules(
          data.map((s: any) => ({
            id: s.id,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            student_or_group: s.student_or_group,
            course_title: s.courses.title,
            course_age_group: s.courses.age_group,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const groupedByDay = DAYS.map((day) => ({
    ...day,
    schedules: schedules.filter((s) => s.day_of_week === day.value),
  })).filter((d) => d.schedules.length > 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          جاري التحميل...
        </CardContent>
      </Card>
    );
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">لا توجد مواعيد حصص حالياً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>
          {description} — {schedules.length} {schedules.length === 1 ? 'حصة' : 'حصص'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {groupedByDay.map((day) => (
          <div key={day.value}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-sm px-3 py-1">
                {day.labelAr}
              </Badge>
              <span className="text-sm text-muted-foreground">{day.label}</span>
            </div>
            <div className="space-y-2 ml-2">
              {day.schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{schedule.course_title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {formatTime(schedule.start_time)} – {formatTime(schedule.end_time)}
                        </span>
                        {schedule.student_or_group && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {schedule.student_or_group}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {schedule.course_age_group}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default WeeklyScheduleView;
