import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, CheckCircle, Clock, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import WeeklyScheduleView from '@/components/dashboard/WeeklyScheduleView';

interface LinkedStudent {
  id: string;
  full_name: string;
  email: string;
}

interface StudentProgress {
  lesson_id: string;
  completed: boolean;
  lesson: {
    title: string;
    course_id: string;
  };
}

const ParentDashboard = () => {
  const { user, profile } = useAuth();
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [studentProgress, setStudentProgress] = useState<Map<string, StudentProgress[]>>(new Map());
  const [studentCourseIds, setStudentCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentEmail, setStudentEmail] = useState('');
  const [linkingStudent, setLinkingStudent] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLinkedStudents();
    }
  }, [user]);

  const fetchLinkedStudents = async () => {
    try {
      const { data: links } = await supabase
        .from('student_parent_links')
        .select('student_id')
        .eq('parent_id', user!.id);

      if (links && links.length > 0) {
        const studentIds = links.map(l => l.student_id);
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', studentIds);

        if (profiles) {
          setLinkedStudents(profiles.map(p => ({
            id: p.user_id,
            full_name: p.full_name,
            email: p.email
          })));

          // Fetch progress for each student
          const progressMap = new Map<string, StudentProgress[]>();
          for (const studentId of studentIds) {
            const { data: progress } = await supabase
              .from('progress')
              .select(`
                lesson_id,
                completed,
                lessons (
                  title,
                  course_id
                )
              `)
              .eq('user_id', studentId);

            if (progress) {
              progressMap.set(studentId, progress.map((p: any) => ({
                lesson_id: p.lesson_id,
                completed: p.completed,
                lesson: p.lessons
              })));
            }
          }
          setStudentProgress(progressMap);
        }

        // Fetch enrolled course IDs for all linked students
        const allCourseIds = new Set<string>();
        for (const studentId of studentIds) {
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('user_id', studentId);

          if (enrollments) {
            enrollments.forEach((e) => allCourseIds.add(e.course_id));
          }
        }
        setStudentCourseIds(Array.from(allCourseIds));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const linkStudent = async () => {
    if (!studentEmail.trim()) {
      toast.error('Please enter a student email');
      return;
    }

    setLinkingStudent(true);
    try {
      // Find student by email
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', studentEmail.trim())
        .single();

      if (!studentProfile) {
        toast.error('No student found with that email');
        return;
      }

      // Check if student has student role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', studentProfile.user_id)
        .single();

      if (!roleData || roleData.role !== 'student') {
        toast.error('This user is not a student');
        return;
      }

      // Create link
      const { error } = await supabase
        .from('student_parent_links')
        .insert({
          parent_id: user!.id,
          student_id: studentProfile.user_id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This student is already linked');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Student linked successfully!');
      setStudentEmail('');
      setDialogOpen(false);
      fetchLinkedStudents();
    } catch (error) {
      console.error('Error linking student:', error);
      toast.error('Failed to link student');
    } finally {
      setLinkingStudent(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {profile?.full_name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">Monitor your children's learning progress</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Link Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link a Student</DialogTitle>
              <DialogDescription>
                Enter the email address of the student you want to link to your account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-email">Student Email</Label>
                <Input
                  id="student-email"
                  type="email"
                  placeholder="student@example.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                />
              </div>
              <Button onClick={linkStudent} disabled={linkingStudent} className="w-full">
                {linkingStudent ? 'Linking...' : 'Link Student'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {linkedStudents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Students Linked</h3>
            <p className="text-muted-foreground text-center mb-4">
              Link your child's account to monitor their progress
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Link Student
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {linkedStudents.map((student) => {
            const progress = studentProgress.get(student.id) || [];
            const completedLessons = progress.filter(p => p.completed).length;
            const totalLessons = progress.length;
            const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

            return (
              <Card key={student.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {student.full_name}
                  </CardTitle>
                  <CardDescription>{student.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{completedLessons}</div>
                        <p className="text-xs text-muted-foreground">lessons</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalLessons - completedLessons}</div>
                        <p className="text-xs text-muted-foreground">lessons</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                        <BookOpen className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{Math.round(progressPercent)}%</div>
                        <Progress value={progressPercent} className="mt-2" />
                      </CardContent>
                    </Card>
                  </div>

                  {progress.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Recent Lessons</h4>
                      <div className="space-y-2">
                        {progress.slice(0, 5).map((p) => (
                          <div
                            key={p.lesson_id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <span>{p.lesson?.title || 'Lesson'}</span>
                            <Badge variant={p.completed ? 'default' : 'secondary'}>
                              {p.completed ? 'Completed' : 'In Progress'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Weekly Schedule for linked students */}
      {linkedStudents.length > 0 && (
        <WeeklyScheduleView
          courseIds={studentCourseIds}
          title="جدول الحصص الأسبوعي"
          description="مواعيد حصص أبنائك"
        />
      )}
    </div>
  );
};

export default ParentDashboard;
