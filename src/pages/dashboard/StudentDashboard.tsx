import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, Clock, GraduationCap } from 'lucide-react';
import SubscriptionStatus from '@/components/dashboard/SubscriptionStatus';
import WeeklyScheduleView from '@/components/dashboard/WeeklyScheduleView';
import CodingLabsSection from '@/components/dashboard/CodingLabsSection';
import GamificationPanel from '@/components/dashboard/GamificationPanel';
import UpcomingSessions from '@/components/dashboard/UpcomingSessions';
import StudentExamsAndRequests from '@/components/dashboard/StudentExamsAndRequests';
import StudentCertificatesPanel from '@/components/dashboard/StudentCertificatesPanel';

interface Course {
  id: string;
  title: string;
  description: string;
  age_group: string;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
  lesson: {
    title: string;
    course_id: string;
  };
}

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          courses (
            id,
            title,
            description,
            age_group
          )
        `)
        .eq('user_id', user!.id);

      if (enrollments) {
        const courseData = enrollments
          .map((e: any) => e.courses)
          .filter(Boolean);
        setCourses(courseData);
        setEnrolledCourseIds(courseData.map((c: Course) => c.id));
      }

      // Fetch progress
      const { data: progressData } = await supabase
        .from('progress')
        .select(`
          lesson_id,
          completed,
          lessons (
            title,
            course_id
          )
        `)
        .eq('user_id', user!.id);

      if (progressData) {
        setProgress(progressData.map((p: any) => ({
          lesson_id: p.lesson_id,
          completed: p.completed,
          lesson: p.lessons
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedLessons = progress.filter(p => p.completed).length;
  const totalLessons = progress.length;
  const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's your learning progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SubscriptionStatus />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedLessons}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLessons - completedLessons}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(progressPercent)}%</div>
            <Progress value={progressPercent} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Coding Labs + Gamification */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <CodingLabsSection />
        <GamificationPanel />
      </div>

      {/* Enrolled Courses */}
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>Courses you're currently enrolled in</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              You haven't enrolled in any courses yet.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const courseLessons = progress.filter(p => p.lesson?.course_id === course.id);
                const courseCompleted = courseLessons.filter(p => p.completed).length;
                const courseTotal = courseLessons.length;
                const courseProgress = courseTotal > 0 ? (courseCompleted / courseTotal) * 100 : 0;

                return (
                  <Card key={course.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <Badge variant="secondary">{course.age_group}</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{courseCompleted}/{courseTotal} lessons</span>
                        </div>
                        <Progress value={courseProgress} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earned Certificates */}
      <StudentCertificatesPanel />

      {/* Available Exams + Payment Requests */}
      <StudentExamsAndRequests />

      {/* Upcoming Live Sessions */}
      <UpcomingSessions courseIds={enrolledCourseIds} />

      {/* Weekly Schedule */}
      <WeeklyScheduleView courseIds={enrolledCourseIds} />
    </div>
  );
};

export default StudentDashboard;
