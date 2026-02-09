import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, CheckCircle, Code2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  student_name: string;
  lesson_title: string;
  course_title: string;
  completed_at: string;
  notes: string | null;
}

const InstructorScratchTracker = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchUsageData();
  }, [user]);

  const fetchUsageData = async () => {
    try {
      // Get instructor's course IDs
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', user!.id);

      const courseIds = courses?.map(c => c.id) || [];
      if (courseIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get scratch lessons in those courses
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, course_id, courses(title)')
        .eq('scratch_enabled', true)
        .in('course_id', courseIds);

      const lessonIds = lessons?.map(l => l.id) || [];
      if (lessonIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get activity logs for those lessons
      const { data: activityLogs } = await supabase
        .from('scratch_activity_logs')
        .select('id, user_id, lesson_id, completed_at, notes')
        .in('lesson_id', lessonIds)
        .order('completed_at', { ascending: false })
        .limit(50);

      if (activityLogs && activityLogs.length > 0) {
        // Get unique student IDs
        const studentIds = [...new Set(activityLogs.map(l => l.user_id))];
        setTotalStudents(studentIds.length);

        // Fetch student profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', studentIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        const lessonMap = new Map(lessons?.map((l: any) => [l.id, { title: l.title, courseTitle: l.courses?.title || '' }]) || []);

        const mapped: ActivityLog[] = activityLogs.map(log => {
          const lessonInfo = lessonMap.get(log.lesson_id);
          return {
            id: log.id,
            student_name: profileMap.get(log.user_id) || 'Unknown Student',
            lesson_title: lessonInfo?.title || 'Unknown Lesson',
            course_title: lessonInfo?.courseTitle || '',
            completed_at: log.completed_at,
            notes: log.notes,
          };
        });

        setLogs(mapped);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        Student Scratch Usage
      </h2>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Active Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logs.length}</p>
              <p className="text-xs text-muted-foreground">Total Submissions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity log table */}
      {logs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="p-3 rounded-full bg-muted">
              <Code2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No student submissions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Submissions</CardTitle>
            <CardDescription>Latest Scratch activity completions from your students</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.student_name}</TableCell>
                    <TableCell>{log.lesson_title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{log.course_title}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.completed_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {log.notes || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InstructorScratchTracker;
