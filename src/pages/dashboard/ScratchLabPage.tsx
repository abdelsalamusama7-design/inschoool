import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ScratchCodingLab from '@/components/dashboard/ScratchCodingLab';
import ScratchFreePlay from '@/components/dashboard/ScratchFreePlay';
import InstructorScratchTracker from '@/components/dashboard/InstructorScratchTracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code2, Play, CheckCircle, BookOpen, Loader2, Rocket, Blocks } from 'lucide-react';
import TutorialVideos from '@/components/dashboard/TutorialVideos';

const scratchVideos = [
  { videoId: 'VIpmkeqJhmQ', title: 'Scratch Programming for Kids', description: 'Learn the basics of Scratch coding' },
  { videoId: 'OAx_6-wdslM', title: 'Make a Game in Scratch', description: 'Build your first Scratch game step by step' },
  { videoId: 'jXL5ACK0lBs', title: 'Scratch Animation Tutorial', description: 'Create fun animations with Scratch' },
];

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

  if (showFreePlay) {
    return <ScratchFreePlay onClose={() => setShowFreePlay(false)} />;
  }

  return (
    <div className="space-y-5">
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
        {role === 'student' && (
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Blocks className="h-3 w-3" /> {lessons.length} Projects
            </Badge>
            <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
              <CheckCircle className="h-3 w-3" /> {completedIds.size} Done
            </Badge>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Left: Main Content */}
        <div className="space-y-4">
          {/* Free Play CTA */}
          <Card className="overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary/60 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => setShowFreePlay(true)}>
            <div className="h-1.5 bg-gradient-to-r from-primary to-blue-400" />
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-md">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Free Play Mode 🚀</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Open the Scratch editor and build anything you want!
                </p>
              </div>
              <Button size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Start Creating
              </Button>
            </CardContent>
          </Card>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty state */}
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

          {/* Instructor tracker */}
          {role === 'instructor' && <InstructorScratchTracker />}
        </div>

        {/* Right: Lessons Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-500" />
                Course Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-3 space-y-2">
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!loading && lessons.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">No projects available yet</p>
                  )}
                  {lessons.map((lesson) => {
                    const isCompleted = completedIds.has(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className="w-full text-left p-3 rounded-lg border transition-colors hover:bg-muted/80 border-transparent"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{lesson.title}</span>
                          {isCompleted && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-200">
                              Done
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {lesson.description || lesson.course_title}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tutorial Videos */}
      <TutorialVideos videos={scratchVideos} accentColor="text-orange-500" />
    </div>
  );
};

export default ScratchLabPage;
