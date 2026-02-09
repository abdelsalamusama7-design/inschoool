import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, CheckCircle, Circle, Clock, GraduationCap, Trophy } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
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

const StudentProgress = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
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

      const courseData = enrollments
        ?.map((e: any) => e.courses)
        .filter(Boolean) || [];
      setCourses(courseData);

      if (courseData.length > 0) {
        const courseIds = courseData.map((c: Course) => c.id);

        // Fetch all lessons for enrolled courses
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('id, title, description, course_id, order_index')
          .in('course_id', courseIds)
          .order('order_index', { ascending: true });

        if (lessonsData) {
          setLessons(lessonsData);
        }
      }

      // Fetch progress
      const { data: progressData } = await supabase
        .from('progress')
        .select('lesson_id, completed, completed_at')
        .eq('user_id', user!.id);

      if (progressData) {
        setProgress(progressData.map((p: any) => ({
          lesson_id: p.lesson_id,
          completed: p.completed,
          completed_at: p.completed_at,
        })));
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user) return;

    const existing = progress.find(p => p.lesson_id === lessonId);

    if (existing) {
      const newCompleted = !existing.completed;
      await supabase
        .from('progress')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId);

      setProgress(prev =>
        prev.map(p =>
          p.lesson_id === lessonId
            ? { ...p, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
            : p
        )
      );
    } else {
      await supabase
        .from('progress')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        });

      setProgress(prev => [
        ...prev,
        { lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() },
      ]);
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

  const totalLessons = lessons.length;
  const completedLessons = progress.filter(p => p.completed).length;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Progress</h1>
        <p className="text-muted-foreground">Track your learning journey</p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedLessons}</div>
            <p className="text-xs text-muted-foreground">out of {totalLessons} lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLessons - completedLessons}</div>
            <p className="text-xs text-muted-foreground">lessons remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Course-by-Course Progress */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You haven't enrolled in any courses yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={courses[0]?.id} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            {courses.map(course => (
              <TabsTrigger key={course.id} value={course.id} className="text-xs sm:text-sm">
                {course.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {courses.map(course => {
            const courseLessons = getCourseLessons(course.id);
            const courseProgress = getCourseProgress(course.id);
            const courseCompleted = courseLessons.filter(l =>
              progress.find(p => p.lesson_id === l.id && p.completed)
            ).length;

            return (
              <TabsContent key={course.id} value={course.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{course.age_group}</Badge>
                        <Badge variant={courseProgress === 100 ? 'default' : 'outline'}>
                          {courseCompleted}/{courseLessons.length} lessons
                        </Badge>
                      </div>
                    </div>
                    <Progress value={courseProgress} className="mt-3" />
                  </CardHeader>
                  <CardContent>
                    {courseLessons.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No lessons added to this course yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {courseLessons.map((lesson, index) => {
                          const lessonProgress = progress.find(p => p.lesson_id === lesson.id);
                          const isCompleted = lessonProgress?.completed ?? false;

                          return (
                            <div
                              key={lesson.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                isCompleted
                                  ? 'bg-primary/5 border-primary/20'
                                  : 'hover:bg-muted/50'
                              }`}
                              onClick={() => markLessonComplete(lesson.id)}
                            >
                              <div className="flex-shrink-0">
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                  {index + 1}. {lesson.title}
                                </p>
                                {lesson.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                              {isCompleted && lessonProgress?.completed_at && (
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {new Date(lessonProgress.completed_at).toLocaleDateString('ar-EG')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
};

export default StudentProgress;
