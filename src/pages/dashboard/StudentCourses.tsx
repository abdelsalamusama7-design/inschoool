import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, CheckCircle, Play } from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string;
  age_group: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  course_id: string;
}

const StudentCourses = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Map<string, Lesson[]>>(new Map());
  const [progress, setProgress] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch all courses
      const { data: allCourses } = await supabase
        .from('courses')
        .select('*');

      // Fetch user enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user!.id);

      const enrolledIds = new Set(enrollments?.map(e => e.course_id) || []);
      
      if (allCourses) {
        setEnrolledCourses(allCourses.filter(c => enrolledIds.has(c.id)));
        setAvailableCourses(allCourses.filter(c => !enrolledIds.has(c.id)));

        // Fetch lessons for enrolled courses
        const lessonMap = new Map<string, Lesson[]>();
        for (const course of allCourses.filter(c => enrolledIds.has(c.id))) {
          const { data: courseLessons } = await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', course.id)
            .order('order_index', { ascending: true });
          
          if (courseLessons) {
            lessonMap.set(course.id, courseLessons);
          }
        }
        setLessons(lessonMap);
      }

      // Fetch progress
      const { data: progressData } = await supabase
        .from('progress')
        .select('lesson_id, completed')
        .eq('user_id', user!.id);

      if (progressData) {
        const progressMap = new Map<string, boolean>();
        progressData.forEach(p => progressMap.set(p.lesson_id, p.completed));
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user!.id,
          course_id: courseId,
        });

      if (error) throw error;

      toast.success('Enrolled successfully!');
      fetchData();
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error('Failed to enroll');
    }
  };

  const toggleLessonComplete = async (lessonId: string, currentStatus: boolean) => {
    try {
      const { data: existing } = await supabase
        .from('progress')
        .select('id')
        .eq('user_id', user!.id)
        .eq('lesson_id', lessonId)
        .single();

      if (existing) {
        await supabase
          .from('progress')
          .update({
            completed: !currentStatus,
            completed_at: !currentStatus ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('progress')
          .insert({
            user_id: user!.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
          });
      }

      // Update local state
      setProgress(prev => {
        const newMap = new Map(prev);
        newMap.set(lessonId, !currentStatus);
        return newMap;
      });

      toast.success(currentStatus ? 'Marked as incomplete' : 'Marked as complete!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">Browse and manage your courses</p>
      </div>

      <Tabs defaultValue="enrolled">
        <TabsList>
          <TabsTrigger value="enrolled">Enrolled ({enrolledCourses.length})</TabsTrigger>
          <TabsTrigger value="available">Available ({availableCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="mt-6">
          {enrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
                <p className="text-muted-foreground">Enroll in a course to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {enrolledCourses.map((course) => {
                const courseLessons = lessons.get(course.id) || [];
                const completedCount = courseLessons.filter(l => progress.get(l.id)).length;
                const progressPercent = courseLessons.length > 0 
                  ? (completedCount / courseLessons.length) * 100 
                  : 0;

                return (
                  <Card key={course.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{course.title}</CardTitle>
                          <CardDescription>{course.description}</CardDescription>
                        </div>
                        <Badge variant="secondary">{course.age_group}</Badge>
                      </div>
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{completedCount}/{courseLessons.length} lessons</span>
                        </div>
                        <Progress value={progressPercent} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {courseLessons.map((lesson, index) => {
                          const isCompleted = progress.get(lesson.id) || false;
                          return (
                            <div
                              key={lesson.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isCompleted ? 'bg-green-50 border-green-200' : 'bg-muted/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isCompleted ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
                                }`}>
                                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{lesson.title}</p>
                                  {lesson.description && (
                                    <p className="text-sm text-muted-foreground">{lesson.description}</p>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant={isCompleted ? "outline" : "default"}
                                size="sm"
                                onClick={() => toggleLessonComplete(lesson.id, isCompleted)}
                              >
                                {isCompleted ? 'Completed' : 'Mark Complete'}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-6">
          {availableCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No More Courses</h3>
                <p className="text-muted-foreground">You've enrolled in all available courses!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge variant="secondary">{course.age_group}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => handleEnroll(course.id)}>
                      <Play className="w-4 h-4 mr-2" />
                      Enroll Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentCourses;
