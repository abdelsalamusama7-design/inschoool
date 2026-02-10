import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  Crown,
  AlertCircle,
  UserPlus,
  Users,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import WeeklyScheduleView from '@/components/dashboard/WeeklyScheduleView';
import UpcomingSessions from '@/components/dashboard/UpcomingSessions';

interface LinkedStudent {
  id: string;
  full_name: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  age_group: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  course_id: string;
  order_index: number | null;
}

interface ProgressRecord {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

interface StudentSubscription {
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  plan_name_ar: string;
  plan_name: string;
  price: number;
  max_lessons: number | null;
}

interface StudentData {
  courses: Course[];
  lessons: Lesson[];
  progress: ProgressRecord[];
  subscription: StudentSubscription | null;
  courseIds: string[];
}

const ParentDashboard = () => {
  const { user, profile } = useAuth();
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [studentDataMap, setStudentDataMap] = useState<Map<string, StudentData>>(new Map());
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

      if (!links || links.length === 0) {
        setLoading(false);
        return;
      }

      const studentIds = links.map(l => l.student_id);

      // Fetch student profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', studentIds);

      if (profiles) {
        setLinkedStudents(profiles.map(p => ({
          id: p.user_id,
          full_name: p.full_name,
          email: p.email,
        })));
      }

      // Fetch full data for each student
      const dataMap = new Map<string, StudentData>();

      for (const studentId of studentIds) {
        // Enrollments & courses
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select(`course_id, courses (id, title, description, age_group)`)
          .eq('user_id', studentId);

        const courses: Course[] = enrollments?.map((e: any) => e.courses).filter(Boolean) || [];
        const courseIds = courses.map(c => c.id);

        // Lessons for enrolled courses
        let lessons: Lesson[] = [];
        if (courseIds.length > 0) {
          const { data: lessonsData } = await supabase
            .from('lessons')
            .select('id, title, description, course_id, order_index')
            .in('course_id', courseIds)
            .order('order_index', { ascending: true });
          lessons = lessonsData || [];
        }

        // Progress
        const { data: progressData } = await supabase
          .from('progress')
          .select('lesson_id, completed, completed_at')
          .eq('user_id', studentId);

        const progress: ProgressRecord[] = progressData?.map((p: any) => ({
          lesson_id: p.lesson_id,
          completed: p.completed,
          completed_at: p.completed_at,
        })) || [];

        // Subscription
        let subscription: StudentSubscription | null = null;
        const { data: subData } = await supabase
          .from('subscriptions')
          .select(`
            status, starts_at, expires_at,
            subscription_plans (name, name_ar, price, max_lessons)
          `)
          .eq('user_id', studentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subData) {
          const plan = subData.subscription_plans as any;
          subscription = {
            status: subData.status,
            starts_at: subData.starts_at,
            expires_at: subData.expires_at,
            plan_name_ar: plan?.name_ar || '',
            plan_name: plan?.name || '',
            price: plan?.price || 0,
            max_lessons: plan?.max_lessons || null,
          };
        }

        dataMap.set(studentId, { courses, lessons, progress, subscription, courseIds });
      }

      setStudentDataMap(dataMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const linkStudent = async () => {
    if (!studentEmail.trim()) {
      toast.error('أدخل إيميل الطالب');
      return;
    }

    setLinkingStudent(true);
    try {
      // Use security definer function to find student by email (bypasses RLS)
      const { data: result, error: lookupError } = await supabase
        .rpc('find_student_by_email', { _email: studentEmail.trim() });

      if (lookupError || !result || result.length === 0) {
        toast.error('لا يوجد طالب بهذا الإيميل');
        return;
      }

      const studentUserId = result[0].student_user_id;

      const { error } = await supabase
        .from('student_parent_links')
        .insert({
          parent_id: user!.id,
          student_id: studentUserId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('هذا الطالب مرتبط بالفعل');
        } else {
          throw error;
        }
        return;
      }

      toast.success('تم ربط الطالب بنجاح!');
      setStudentEmail('');
      setDialogOpen(false);
      fetchLinkedStudents();
    } catch (error) {
      console.error('Error linking student:', error);
      toast.error('حدث خطأ أثناء الربط');
    } finally {
      setLinkingStudent(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">أهلاً، {profile?.full_name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">تابع تقدم أبنائك الدراسي</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              ربط طالب
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ربط طالب</DialogTitle>
              <DialogDescription>أدخل البريد الإلكتروني للطالب لربطه بحسابك.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-email">إيميل الطالب</Label>
                <Input
                  id="student-email"
                  type="email"
                  placeholder="student@example.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                />
              </div>
              <Button onClick={linkStudent} disabled={linkingStudent} className="w-full">
                {linkingStudent ? 'جاري الربط...' : 'ربط الطالب'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {linkedStudents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا يوجد طلاب مرتبطين</h3>
            <p className="text-muted-foreground text-center mb-4">اربط حساب ابنك لمتابعة تقدمه</p>
            <Button onClick={() => setDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              ربط طالب
            </Button>
          </CardContent>
        </Card>
      ) : linkedStudents.length === 1 ? (
        <StudentFullView
          student={linkedStudents[0]}
          data={studentDataMap.get(linkedStudents[0].id)}
        />
      ) : (
        <Tabs defaultValue={linkedStudents[0]?.id} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            {linkedStudents.map(student => (
              <TabsTrigger key={student.id} value={student.id}>
                {student.full_name}
              </TabsTrigger>
            ))}
          </TabsList>
          {linkedStudents.map(student => (
            <TabsContent key={student.id} value={student.id}>
              <StudentFullView
                student={student}
                data={studentDataMap.get(student.id)}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

// ===== Sub-component: Full view for a single student =====

interface StudentFullViewProps {
  student: LinkedStudent;
  data?: StudentData;
}

const StudentFullView = ({ student, data }: StudentFullViewProps) => {
  if (!data) return null;

  const { courses, lessons, progress, subscription, courseIds } = data;
  const totalLessons = lessons.length;
  const completedLessons = progress.filter(p => p.completed).length;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const daysRemaining = subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> نشط</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" /> قيد المراجعة</Badge>;
      case 'expired':
        return <Badge variant="destructive">منتهي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCourseLessons = (courseId: string) =>
    lessons.filter(l => l.course_id === courseId);

  const getCourseProgress = (courseId: string) => {
    const courseLessons = getCourseLessons(courseId);
    if (courseLessons.length === 0) return 0;
    const completed = courseLessons.filter(l =>
      progress.find(p => p.lesson_id === l.id && p.completed)
    ).length;
    return Math.round((completed / courseLessons.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Student Info Header */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>{student.full_name}</CardTitle>
            <CardDescription>{student.email}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Subscription */}
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Crown className="h-4 w-4 text-primary" /> الاشتراك
            </CardTitle>
            {subscription && getStatusBadge(subscription.status)}
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div>
                <div className="text-xl font-bold">{subscription.plan_name_ar}</div>
                {subscription.price > 0 && (
                  <p className="text-xs text-muted-foreground">{subscription.price} جنيه</p>
                )}
                {daysRemaining !== null && subscription.status === 'active' && (
                  <p className="text-xs text-muted-foreground mt-1">متبقي {daysRemaining} يوم</p>
                )}
                {subscription.max_lessons && (
                  <p className="text-xs text-muted-foreground">الحد: {subscription.max_lessons} حصة</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا يوجد اشتراك</p>
            )}
          </CardContent>
        </Card>

        {/* Enrolled Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الكورسات</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">كورس مسجل</p>
          </CardContent>
        </Card>

        {/* Completed Lessons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مكتمل</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedLessons}</div>
            <p className="text-xs text-muted-foreground">من {totalLessons} درس</p>
          </CardContent>
        </Card>

        {/* Overall Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">التقدم العام</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Courses with lessons & progress */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">الطالب غير مسجل في أي كورس بعد</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              الكورسات والدروس
            </CardTitle>
            <CardDescription>تقدم الطالب في كل كورس</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {courses.map(course => {
              const courseLessons = getCourseLessons(course.id);
              const courseProgress = getCourseProgress(course.id);
              const courseCompleted = courseLessons.filter(l =>
                progress.find(p => p.lesson_id === l.id && p.completed)
              ).length;

              return (
                <div key={course.id} className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-semibold">{course.title}</h4>
                      {course.description && (
                        <p className="text-xs text-muted-foreground">{course.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{course.age_group}</Badge>
                      <Badge variant={courseProgress === 100 ? 'default' : 'outline'}>
                        {courseCompleted}/{courseLessons.length}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={courseProgress} className="h-2" />

                  {courseLessons.length > 0 && (
                    <div className="space-y-1 ml-2">
                      {courseLessons.map((lesson, idx) => {
                        const lessonProg = progress.find(p => p.lesson_id === lesson.id);
                        const isCompleted = lessonProg?.completed ?? false;

                        return (
                          <div
                            key={lesson.id}
                            className={`flex items-center gap-3 p-2 rounded-md text-sm ${
                              isCompleted ? 'bg-primary/5' : ''
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                              {idx + 1}. {lesson.title}
                            </span>
                            {isCompleted && lessonProg?.completed_at && (
                              <span className="text-xs text-muted-foreground mr-auto">
                                {new Date(lessonProg.completed_at).toLocaleDateString('ar-EG')}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Live Sessions */}
      <UpcomingSessions courseIds={courseIds} />

      {/* Weekly Schedule */}
      <WeeklyScheduleView
        courseIds={courseIds}
        title="جدول الحصص"
        description={`مواعيد حصص ${student.full_name}`}
      />
    </div>
  );
};

export default ParentDashboard;
