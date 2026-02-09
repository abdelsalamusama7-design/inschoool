import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ScratchCodingLab from '@/components/dashboard/ScratchCodingLab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code2, Play, CheckCircle, BookOpen, Loader2 } from 'lucide-react';

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
        // Get enrolled courses
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user!.id);
        courseIds = enrollments?.map(e => e.course_id) || [];
      } else if (role === 'instructor') {
        // Get instructor's courses
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

      // Fetch scratch-enabled lessons with course info
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

      // Fetch completions for student
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-200">
          <Code2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Scratch Lab</h1>
          <p className="text-muted-foreground">
            Build interactive stories, games, and animations using Scratch visual programming.
          </p>
        </div>
      </div>

      {/* Stats */}
      {role === 'student' && lessons.length > 0 && (
        <div className="flex gap-4">
          <Card className="flex-1">
            <CardContent className="p-4 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{lessons.length}</p>
                <p className="text-xs text-muted-foreground">Available Projects</p>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{completedIds.size}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && lessons.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-4 rounded-full bg-muted">
              <Code2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No Scratch Projects Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {role === 'student'
                  ? 'There are no Scratch activities available in your enrolled courses yet. Check back later!'
                  : 'Add Scratch activities to your course lessons to see them here.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project cards */}
      {!loading && lessons.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => {
            const isCompleted = completedIds.has(lesson.id);
            return (
              <Card
                key={lesson.id}
                className="group hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
                onClick={() => setActiveLesson(lesson)}
              >
                {/* Orange accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-500" />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{lesson.title}</CardTitle>
                    {isCompleted && (
                      <Badge className="bg-green-500/10 text-green-600 border-green-200 shrink-0 gap-1">
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
      )}
    </div>
  );
};

export default ScratchLabPage;
