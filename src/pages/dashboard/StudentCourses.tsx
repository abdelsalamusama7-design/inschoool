import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, CheckCircle, Play, ChevronLeft, Video, FileText, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import ScratchCodingLab from '@/components/dashboard/ScratchCodingLab';

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
  scratch_enabled: boolean;
  scratch_url: string | null;
  scratch_instructions: string | null;
}

const StudentCourses = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Map<string, Lesson[]>>(new Map());
  const [progress, setProgress] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);
  const [activeScratchLesson, setActiveScratchLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: allCourses } = await supabase
        .from('courses')
        .select('*');

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user!.id);

      const enrolledIds = new Set(enrollments?.map(e => e.course_id) || []);
      
      if (allCourses) {
        setEnrolledCourses(allCourses.filter(c => enrolledIds.has(c.id)));
        setAvailableCourses(allCourses.filter(c => !enrolledIds.has(c.id)));

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

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return url;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  // Scratch lab full screen
  if (activeScratchLesson) {
    return (
      <ScratchCodingLab
        scratchUrl={activeScratchLesson.scratch_url || 'https://scratch.mit.edu/projects/editor/'}
        instructions={activeScratchLesson.scratch_instructions}
        lessonTitle={activeScratchLesson.title}
        lessonId={activeScratchLesson.id}
        onClose={() => setActiveScratchLesson(null)}
        onComplete={() => {}}
      />
    );
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
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:border-primary/50 ${
                                isCompleted ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                              }`}
                              onClick={() => setOpenLesson(lesson)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isCompleted ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                                }`}>
                                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{lesson.title}</p>
                                  {lesson.description && (
                                    <p className="text-sm text-muted-foreground">{lesson.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    {lesson.video_url && (
                                      <Badge variant="outline" className="text-xs gap-1">
                                        <Video className="w-3 h-3" /> فيديو
                                      </Badge>
                                    )}
                                    {lesson.content && (
                                      <Badge variant="outline" className="text-xs gap-1">
                                        <FileText className="w-3 h-3" /> محتوى
                                      </Badge>
                                    )}
                                    {lesson.scratch_enabled && (
                                      <Badge variant="outline" className="text-xs gap-1">
                                        <Code2 className="w-3 h-3" /> Scratch
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant={isCompleted ? "outline" : "default"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLessonComplete(lesson.id, isCompleted);
                                }}
                              >
                                {isCompleted ? 'مكتمل ✓' : 'إكمال'}
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

      {/* Lesson Detail Dialog */}
      <Dialog open={!!openLesson} onOpenChange={(open) => !open && setOpenLesson(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {openLesson && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl">{openLesson.title}</DialogTitle>
                  {progress.get(openLesson.id) && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">مكتمل ✓</Badge>
                  )}
                </div>
                {openLesson.description && (
                  <p className="text-muted-foreground mt-1">{openLesson.description}</p>
                )}
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Video */}
                {openLesson.video_url && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Video className="w-4 h-4 text-primary" /> الفيديو
                    </h3>
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe
                        src={getEmbedUrl(openLesson.video_url) || openLesson.video_url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Content */}
                {openLesson.content && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> المحتوى
                    </h3>
                    <div className="prose prose-sm max-w-none p-4 rounded-lg bg-muted/30 border whitespace-pre-wrap">
                      {openLesson.content}
                    </div>
                  </div>
                )}

                {/* Scratch Lab */}
                {openLesson.scratch_enabled && openLesson.scratch_url && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-primary" /> معمل Scratch
                    </h3>
                    {openLesson.scratch_instructions && (
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                        {openLesson.scratch_instructions}
                      </p>
                    )}
                    <Button
                      onClick={() => {
                        setOpenLesson(null);
                        setActiveScratchLesson(openLesson);
                      }}
                      className="w-full"
                    >
                      <Code2 className="w-4 h-4 mr-2" />
                      فتح معمل Scratch
                    </Button>
                  </div>
                )}

                {/* No content message */}
                {!openLesson.video_url && !openLesson.content && !openLesson.scratch_enabled && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>لا يوجد محتوى لهذا الدرس بعد</p>
                  </div>
                )}

                {/* Mark Complete Button */}
                <Button
                  variant={progress.get(openLesson.id) ? "outline" : "default"}
                  className="w-full"
                  onClick={() => toggleLessonComplete(openLesson.id, progress.get(openLesson.id) || false)}
                >
                  {progress.get(openLesson.id) ? 'تم الإكمال ✓ - اضغط للتراجع' : 'تحديد كمكتمل'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentCourses;
