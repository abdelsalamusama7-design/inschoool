import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, FileText, Trash2, Lock, Crown } from 'lucide-react';
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
  order_index: number;
}

const CourseDetail = () => {
  const { id } = useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [maxLessons, setMaxLessons] = useState<number | null>(null);
  
  // New lesson form
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [savingLesson, setSavingLesson] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourse();
      if (role === 'student' && user) {
        checkSubscription();
      } else {
        setHasActiveSubscription(true); // instructors/parents always have access
      }
    }
  }, [id, user, role]);

  const checkSubscription = async () => {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select(`status, subscription_plans (max_lessons)`)
        .eq('user_id', user!.id)
        .in('status', ['active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setHasActiveSubscription(true);
        setMaxLessons((data as any).subscription_plans?.max_lessons || null);
      }
    } catch {
      setHasActiveSubscription(false);
    }
  };

  const fetchCourse = async () => {
    try {
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseData) {
        setCourse(courseData);

        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', id)
          .order('order_index', { ascending: true });

        if (lessonsData) {
          setLessons(lessonsData);
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async () => {
    if (!lessonTitle.trim()) {
      toast.error('Please enter a lesson title');
      return;
    }

    setSavingLesson(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .insert({
          course_id: id,
          title: lessonTitle,
          description: lessonDescription || null,
          content: lessonContent || null,
          video_url: lessonVideoUrl || null,
          order_index: lessons.length,
        });

      if (error) throw error;

      toast.success('Lesson added successfully!');
      setLessonTitle('');
      setLessonDescription('');
      setLessonContent('');
      setLessonVideoUrl('');
      setDialogOpen(false);
      fetchCourse();
    } catch (error) {
      console.error('Error adding lesson:', error);
      toast.error('Failed to add lesson');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      toast.success('Lesson deleted');
      fetchCourse();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!course) {
    return <div className="text-center py-8">Course not found</div>;
  }

  const isInstructor = role === 'instructor' && course;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <Badge variant="secondary">{course.age_group}</Badge>
          </div>
          <p className="text-muted-foreground">{course.description || 'No description'}</p>
        </div>
        {isInstructor && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Lesson</DialogTitle>
                <DialogDescription>Create a new lesson for this course</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-title">Title *</Label>
                  <Input
                    id="lesson-title"
                    placeholder="Lesson title"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-description">Description</Label>
                  <Input
                    id="lesson-description"
                    placeholder="Brief description"
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-content">Content</Label>
                  <Textarea
                    id="lesson-content"
                    placeholder="Lesson content..."
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-video">Video URL (optional)</Label>
                  <Input
                    id="lesson-video"
                    placeholder="https://youtube.com/..."
                    value={lessonVideoUrl}
                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddLesson} disabled={savingLesson} className="w-full">
                  {savingLesson ? 'Adding...' : 'Add Lesson'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
          <CardDescription>{lessons.length} lessons in this course</CardDescription>
        </CardHeader>
        <CardContent>
          {lessons.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Lessons Yet</h3>
              <p className="text-muted-foreground">
                {isInstructor ? 'Add your first lesson to get started' : 'No lessons available yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {!hasActiveSubscription && role === 'student' && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">اشترك للوصول لجميع الدروس</p>
                      <p className="text-sm text-yellow-600">بعض الدروس مقفلة. اشترك لفتحها.</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => navigate('/dashboard/subscription')}>
                    اشترك الآن
                  </Button>
                </div>
              )}
              {lessons.map((lesson, index) => {
                const isLocked = role === 'student' && !hasActiveSubscription && index >= 1;
                const isLimitReached = role === 'student' && maxLessons !== null && index >= maxLessons;
                const locked = isLocked || isLimitReached;

                return (
                  <div
                    key={lesson.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${locked ? 'bg-muted/30 opacity-60' : 'bg-muted/50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${locked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                        {locked ? <Lock className="w-4 h-4" /> : index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{lesson.title}</h4>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground">{lesson.description}</p>
                        )}
                        {locked && (
                          <p className="text-xs text-muted-foreground mt-1">🔒 يتطلب اشتراك</p>
                        )}
                      </div>
                    </div>
                    {isInstructor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteLesson(lesson.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseDetail;
