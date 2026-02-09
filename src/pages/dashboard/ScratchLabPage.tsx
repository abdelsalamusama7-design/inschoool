import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ScratchCodingLab from '@/components/dashboard/ScratchCodingLab';
import ScratchFreePlay from '@/components/dashboard/ScratchFreePlay';
import InstructorScratchTracker from '@/components/dashboard/InstructorScratchTracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code2, Play, CheckCircle, BookOpen, Loader2, Rocket, Blocks } from 'lucide-react';

interface ScratchLesson {
  id: string;
  title: string;
  description: string | null;
  scratch_url: string | null;
  scratch_instructions: string | null;
  course_title: string;
  course_id: string;
}

const ScratchLabPage = () => {
  const { user, role } = useAuth();
  const [lessons, setLessons] = useState<ScratchLesson[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<ScratchLesson | null>(null);
  const [showFreePlay, setShowFreePlay] = useState(false);

  useEffect(() => {
    if (user) {
      fetchScratchLessons();
    }
  }, [user, role]);

  const fetchScratchLessons = async () => {
    setLoading(true);
    try {
      let courseIds: string[] = [];

      if (role === 'student') {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user!.id);
        courseIds = enrollments?.map(e => e.course_id) || [];
      } else if (role === 'instructor') {
        const { data: courses } = await supabase
          .from('courses')
          .select('id')
          .eq('instructor_id', user!.id);
        courseIds = courses?.map(c => c.id) || [];
      }

      if (courseIds.length === 0) {
        setLessons([]);
        setLoading(false);
        return;
      }

      const { data: scratchLessons } = await supabase
        .from('lessons')
        .select('id, title, description, scratch_url, scratch_instructions, course_id, courses(title)')
        .eq('scratch_enabled', true)
        .in('course_id', courseIds)
        .order('order_index', { ascending: true });

      const mapped: ScratchLesson[] = (scratchLessons || []).map((l: any) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        scratch_url: l.scratch_url,
        scratch_instructions: l.scratch_instructions,
        course_title: l.courses?.title || 'Unknown Course',
        course_id: l.course_id,
      }));

      setLessons(mapped);

      if (role === 'student' && mapped.length > 0) {
        const { data: logs } = await supabase
          .from('scratch_activity_logs')
          .select('lesson_id')
          .eq('user_id', user!.id)
          .in('lesson_id', mapped.map(l => l.id));

        setCompletedIds(new Set(logs?.map(l => l.lesson_id) || []));
      }
    } catch (error) {
      console.error('Error fetching scratch lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render active lesson lab
  if (activeLesson) {
    return (
      <ScratchCodingLab
        scratchUrl={activeLesson.scratch_url || 'https://scratch.mit.edu/projects/editor/'}
        instructions={activeLesson.scratch_instructions}
        lessonTitle={activeLesson.title}
        lessonId={activeLesson.id}
        onClose={() => setActiveLesson(null)}
        onComplete={() => {
          setCompletedIds(prev => new Set([...prev, activeLesson.id]));
        }}
      />
    );
  }

  // Render free play mode
  if (showFreePlay) {
    return <ScratchFreePlay onClose={() => setShowFreePlay(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg">
          <Code2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Scratch Lab 🧩</h1>
          <p className="text-muted-foreground">
            Build interactive stories, games, and animations using visual programming blocks!
          </p>
        </div>
      </div>

      {/* Free Play CTA + Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Free Play Card */}
        <Card
          className="group cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/60 hover:shadow-lg transition-all duration-300 sm:col-span-1"
          onClick={() => setShowFreePlay(true)}
        >
          <div className="h-1.5 bg-gradient-to-r from-primary to-blue-400" />
          <CardContent className="p-5 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Free Play Mode 🚀</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Open the Scratch editor and build anything you want!
              </p>
            </div>
            <Button size="sm" className="gap-2 w-full">
              <Play className="h-4 w-4" />
              Start Creating
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        {role === 'student' && (
          <>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                  <Blocks className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lessons.length}</p>
                  <p className="text-xs text-muted-foreground">Available Projects</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedIds.size}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Course Projects Section */}
      {!loading && lessons.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Course Projects
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson) => {
              const isCompleted = completedIds.has(lesson.id);
              return (
                <Card
                  key={lesson.id}
                  className="group hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
                  onClick={() => setActiveLesson(lesson)}
                >
                  <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-500" />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{lesson.title}</CardTitle>
                      {isCompleted && (
                        <Badge className="bg-secondary/10 text-secondary border-secondary/20 shrink-0 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Done
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="w-fit text-xs">
                      {lesson.course_title}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{lesson.description}</p>
                    )}
                    <Button
                      size="sm"
                      className="w-full gap-2 group-hover:bg-primary/90"
                      variant={isCompleted ? 'outline' : 'default'}
                    >
                      <Play className="h-4 w-4" />
                      {isCompleted ? 'Open Again' : 'Start Project'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for course projects */}
      {!loading && lessons.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="p-4 rounded-full bg-muted">
              <Code2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No Course Projects Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {role === 'student'
                  ? 'No Scratch activities in your courses yet. Try Free Play mode above!'
                  : 'Add Scratch activities to your course lessons to see them here.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructor: Student usage tracker */}
      {role === 'instructor' && <InstructorScratchTracker />}
    </div>
  );
};

export default ScratchLabPage;
