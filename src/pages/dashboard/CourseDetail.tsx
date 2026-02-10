import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ScratchCodingLab from '@/components/dashboard/ScratchCodingLab';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, FileText, Trash2, Lock, Crown, Upload, Download, Loader2, Pencil, Image, Code2, Users, CheckCircle, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';


interface Course {
  id: string;
  title: string;
  description: string;
  age_group: string;
  thumbnail_url: string | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  order_index: number;
  scratch_enabled: boolean;
  scratch_url: string | null;
  scratch_instructions: string | null;
  python_enabled: boolean;
  python_url: string | null;
  python_instructions: string | null;
  roblox_enabled: boolean;
  roblox_url: string | null;
  roblox_instructions: string | null;
  minecraft_enabled: boolean;
  minecraft_url: string | null;
  minecraft_instructions: string | null;
}
interface CourseMaterial {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

const CourseDetail = () => {
  const { id } = useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [maxLessons, setMaxLessons] = useState<number | null>(null);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  
  // Edit course state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAgeGroup, setEditAgeGroup] = useState('');
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // New lesson form
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonScratchEnabled, setLessonScratchEnabled] = useState(false);
  const [lessonScratchUrl, setLessonScratchUrl] = useState('');
  const [lessonScratchInstructions, setLessonScratchInstructions] = useState('');
  const [lessonPythonEnabled, setLessonPythonEnabled] = useState(false);
  const [lessonPythonUrl, setLessonPythonUrl] = useState('');
  const [lessonPythonInstructions, setLessonPythonInstructions] = useState('');
  const [lessonRobloxEnabled, setLessonRobloxEnabled] = useState(false);
  const [lessonRobloxUrl, setLessonRobloxUrl] = useState('');
  const [lessonRobloxInstructions, setLessonRobloxInstructions] = useState('');
  const [lessonMinecraftEnabled, setLessonMinecraftEnabled] = useState(false);
  const [lessonMinecraftUrl, setLessonMinecraftUrl] = useState('');
  const [lessonMinecraftInstructions, setLessonMinecraftInstructions] = useState('');
  const [savingLesson, setSavingLesson] = useState(false);

  // AI Generate lessons state
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateTopic, setGenerateTopic] = useState('');
  const [generateCount, setGenerateCount] = useState('5');
  const [generating, setGenerating] = useState(false);
  const [generatedLessons, setGeneratedLessons] = useState<{ title: string; description: string; content: string }[]>([]);

  // Edit lesson state
  const [editLessonDialogOpen, setEditLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonDescription, setEditLessonDescription] = useState('');
  const [editLessonContent, setEditLessonContent] = useState('');
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState('');
  const [editLessonScratchEnabled, setEditLessonScratchEnabled] = useState(false);
  const [editLessonScratchUrl, setEditLessonScratchUrl] = useState('');
  const [editLessonScratchInstructions, setEditLessonScratchInstructions] = useState('');
  const [editLessonPythonEnabled, setEditLessonPythonEnabled] = useState(false);
  const [editLessonPythonUrl, setEditLessonPythonUrl] = useState('');
  const [editLessonPythonInstructions, setEditLessonPythonInstructions] = useState('');
  const [editLessonRobloxEnabled, setEditLessonRobloxEnabled] = useState(false);
  const [editLessonRobloxUrl, setEditLessonRobloxUrl] = useState('');
  const [editLessonRobloxInstructions, setEditLessonRobloxInstructions] = useState('');
  const [editLessonMinecraftEnabled, setEditLessonMinecraftEnabled] = useState(false);
  const [editLessonMinecraftUrl, setEditLessonMinecraftUrl] = useState('');
  const [editLessonMinecraftInstructions, setEditLessonMinecraftInstructions] = useState('');
  const [savingEditLesson, setSavingEditLesson] = useState(false);

  // Scratch lab state
  const [activeScratchLesson, setActiveScratchLesson] = useState<Lesson | null>(null);
  const [scratchCompletions, setScratchCompletions] = useState<Map<string, { count: number; students: { name: string; notes: string | null; completed_at: string }[] }>>(new Map());

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

  const fetchScratchCompletions = async (lessonsList?: typeof lessons) => {
    const targetLessons = lessonsList || lessons;
    const scratchLessonIds = targetLessons
      .filter(l => l.scratch_enabled)
      .map(l => l.id);

    if (scratchLessonIds.length === 0) return;

    const { data } = await supabase
      .from('scratch_activity_logs')
      .select('lesson_id, user_id, notes, completed_at')
      .in('lesson_id', scratchLessonIds);

    if (!data) return;

    // Fetch student names for the completions
    const studentIds = [...new Set(data.map(d => d.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', studentIds);

    const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

    const completionMap = new Map<string, { count: number; students: { name: string; notes: string | null; completed_at: string }[] }>();

    for (const lessonId of scratchLessonIds) {
      const lessonLogs = data.filter(d => d.lesson_id === lessonId);
      completionMap.set(lessonId, {
        count: lessonLogs.length,
        students: lessonLogs.map(l => ({
          name: nameMap.get(l.user_id) || 'Unknown',
          notes: l.notes,
          completed_at: l.completed_at,
        })),
      });
    }

    setScratchCompletions(completionMap);
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

        const [lessonsRes, materialsRes] = await Promise.all([
          supabase
            .from('lessons')
            .select('*')
            .eq('course_id', id!)
            .order('order_index', { ascending: true }),
          supabase
            .from('course_materials')
            .select('*')
            .eq('course_id', id!)
            .order('created_at', { ascending: false }),
        ]);

        if (lessonsRes.data) {
          setLessons(lessonsRes.data);
          // Fetch scratch completions for instructor view
          if (role === 'instructor') {
            fetchScratchCompletions(lessonsRes.data);
          }
        }
        if (materialsRes.data) setMaterials(materialsRes.data);
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
          scratch_enabled: lessonScratchEnabled,
          scratch_url: lessonScratchEnabled ? (lessonScratchUrl || null) : null,
          scratch_instructions: lessonScratchEnabled ? (lessonScratchInstructions || null) : null,
          python_enabled: lessonPythonEnabled,
          python_url: lessonPythonEnabled ? (lessonPythonUrl || null) : null,
          python_instructions: lessonPythonEnabled ? (lessonPythonInstructions || null) : null,
          roblox_enabled: lessonRobloxEnabled,
          roblox_url: lessonRobloxEnabled ? (lessonRobloxUrl || null) : null,
          roblox_instructions: lessonRobloxEnabled ? (lessonRobloxInstructions || null) : null,
          minecraft_enabled: lessonMinecraftEnabled,
          minecraft_url: lessonMinecraftEnabled ? (lessonMinecraftUrl || null) : null,
          minecraft_instructions: lessonMinecraftEnabled ? (lessonMinecraftInstructions || null) : null,
        });

      if (error) throw error;

      toast.success('Lesson added successfully!');
      setLessonTitle('');
      setLessonDescription('');
      setLessonContent('');
      setLessonVideoUrl('');
      setLessonScratchEnabled(false);
      setLessonScratchUrl('');
      setLessonScratchInstructions('');
      setLessonPythonEnabled(false);
      setLessonPythonUrl('');
      setLessonPythonInstructions('');
      setLessonRobloxEnabled(false);
      setLessonRobloxUrl('');
      setLessonRobloxInstructions('');
      setLessonMinecraftEnabled(false);
      setLessonMinecraftUrl('');
      setLessonMinecraftInstructions('');
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

  const openEditLessonDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditLessonTitle(lesson.title);
    setEditLessonDescription(lesson.description || '');
    setEditLessonContent(lesson.content || '');
    setEditLessonVideoUrl(lesson.video_url || '');
    setEditLessonScratchEnabled(lesson.scratch_enabled);
    setEditLessonScratchUrl(lesson.scratch_url || '');
    setEditLessonScratchInstructions(lesson.scratch_instructions || '');
    setEditLessonPythonEnabled(lesson.python_enabled);
    setEditLessonPythonUrl(lesson.python_url || '');
    setEditLessonPythonInstructions(lesson.python_instructions || '');
    setEditLessonRobloxEnabled(lesson.roblox_enabled);
    setEditLessonRobloxUrl(lesson.roblox_url || '');
    setEditLessonRobloxInstructions(lesson.roblox_instructions || '');
    setEditLessonMinecraftEnabled(lesson.minecraft_enabled);
    setEditLessonMinecraftUrl(lesson.minecraft_url || '');
    setEditLessonMinecraftInstructions(lesson.minecraft_instructions || '');
    setEditLessonDialogOpen(true);
  };

  const handleSaveEditLesson = async () => {
    if (!editingLesson || !editLessonTitle.trim()) return;
    setSavingEditLesson(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          title: editLessonTitle,
          description: editLessonDescription || null,
          content: editLessonContent || null,
          video_url: editLessonVideoUrl || null,
          scratch_enabled: editLessonScratchEnabled,
          scratch_url: editLessonScratchEnabled ? (editLessonScratchUrl || null) : null,
          scratch_instructions: editLessonScratchEnabled ? (editLessonScratchInstructions || null) : null,
          python_enabled: editLessonPythonEnabled,
          python_url: editLessonPythonEnabled ? (editLessonPythonUrl || null) : null,
          python_instructions: editLessonPythonEnabled ? (editLessonPythonInstructions || null) : null,
          roblox_enabled: editLessonRobloxEnabled,
          roblox_url: editLessonRobloxEnabled ? (editLessonRobloxUrl || null) : null,
          roblox_instructions: editLessonRobloxEnabled ? (editLessonRobloxInstructions || null) : null,
          minecraft_enabled: editLessonMinecraftEnabled,
          minecraft_url: editLessonMinecraftEnabled ? (editLessonMinecraftUrl || null) : null,
          minecraft_instructions: editLessonMinecraftEnabled ? (editLessonMinecraftInstructions || null) : null,
        })
        .eq('id', editingLesson.id);

      if (error) throw error;
      toast.success('تم تحديث الدرس بنجاح!');
      setEditLessonDialogOpen(false);
      fetchCourse();
    } catch (error: any) {
      toast.error('فشل في تحديث الدرس');
    } finally {
      setSavingEditLesson(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    if (!confirm('هل أنت متأكد من حذف هذا الكورس وجميع دروسه؟')) return;
    try {
      const { error } = await supabase.from('courses').delete().eq('id', course.id);
      if (error) throw error;
      toast.success('تم حذف الكورس');
      navigate('/dashboard/courses');
    } catch (error: any) {
      toast.error('فشل في حذف الكورس');
    }
  };

  const handleUploadMaterial = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !id) return;

    setUploadingMaterial(true);
    try {
      for (const file of Array.from(files)) {
        const filePath = `materials/${id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('course-materials')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('course-materials')
          .getPublicUrl(filePath);

        await supabase.from('course_materials').insert({
          course_id: id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        });
      }

      toast.success('Materials uploaded!');
      fetchCourse();
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase.from('course_materials').delete().eq('id', materialId);
      if (error) throw error;
      toast.success('Material deleted');
      fetchCourse();
    } catch (error: any) {
      toast.error('Failed to delete material');
    }
  };

  const handleGenerateLessons = async () => {
    if (!course) return;
    setGenerating(true);
    setGeneratedLessons([]);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lessons', {
        body: {
          courseTitle: course.title,
          courseDescription: course.description,
          ageGroup: course.age_group,
          topic: generateTopic,
          lessonsCount: parseInt(generateCount) || 5,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedLessons(data.lessons || []);
      toast.success(`تم توليد ${data.lessons?.length || 0} دروس بنجاح!`);
    } catch (error: any) {
      console.error('Error generating lessons:', error);
      toast.error(error.message || 'فشل في توليد الدروس');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGeneratedLessons = async () => {
    if (!id || generatedLessons.length === 0) return;
    setSavingLesson(true);
    try {
      const startIndex = lessons.length;
      const inserts = generatedLessons.map((lesson, i) => ({
        course_id: id,
        title: lesson.title,
        description: lesson.description || null,
        content: lesson.content || null,
        video_url: null,
        order_index: startIndex + i,
        scratch_enabled: false,
      }));

      const { error } = await supabase.from('lessons').insert(inserts);
      if (error) throw error;

      toast.success(`تم حفظ ${generatedLessons.length} دروس!`);
      setGeneratedLessons([]);
      setGenerateDialogOpen(false);
      setGenerateTopic('');
      fetchCourse();
    } catch (error: any) {
      toast.error('فشل في حفظ الدروس');
    } finally {
      setSavingLesson(false);
    }
  };

  const openEditDialog = () => {
    if (!course) return;
    setEditTitle(course.title);
    setEditDescription(course.description || '');
    setEditAgeGroup(course.age_group);
    setEditThumbnailPreview(course.thumbnail_url || null);
    setEditThumbnail(null);
    setEditDialogOpen(true);
  };

  const handleEditThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    if (!course || !user || !editTitle.trim() || !editAgeGroup) return;

    setSavingEdit(true);
    try {
      let thumbnailUrl = course.thumbnail_url;

      // Upload new thumbnail if provided
      if (editThumbnail) {
        const ext = editThumbnail.name.split('.').pop();
        const filePath = `thumbnails/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('course-materials')
          .upload(filePath, editThumbnail);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('course-materials')
          .getPublicUrl(filePath);

        thumbnailUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('courses')
        .update({
          title: editTitle,
          description: editDescription || null,
          age_group: editAgeGroup as any,
          thumbnail_url: thumbnailUrl,
        })
        .eq('id', course.id);

      if (error) throw error;

      toast.success('Course updated successfully!');
      setEditDialogOpen(false);
      fetchCourse();
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemoveEditThumbnail = () => {
    setEditThumbnail(null);
    setEditThumbnailPreview(null);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!course) {
    return <div className="text-center py-8">Course not found</div>;
  }

  const isInstructor = role === 'instructor' && course;

  // If Scratch lab is open, show it
  if (activeScratchLesson) {
    return (
      <ScratchCodingLab
        scratchUrl={activeScratchLesson.scratch_url || 'https://scratch.mit.edu/projects/editor/'}
        instructions={activeScratchLesson.scratch_instructions}
        lessonTitle={activeScratchLesson.title}
        lessonId={activeScratchLesson.id}
        onClose={() => setActiveScratchLesson(null)}
        onComplete={() => fetchScratchCompletions()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Thumbnail Banner */}
      {course.thumbnail_url && (
        <div className="h-48 rounded-lg overflow-hidden">
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/courses')}>
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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openEditDialog}>
              <Pencil className="w-4 h-4 mr-2" />
              تعديل الكورس
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteCourse}>
              <Trash2 className="w-4 h-4 mr-2" />
              حذف الكورس
            </Button>
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

                  {/* Lab Selection */}
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Code2 className="h-4 w-4 text-primary" />
                      <Label className="font-medium">تفعيل المعامل البرمجية</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-2 rounded-md border bg-background">
                        <Label htmlFor="scratch-toggle" className="text-sm cursor-pointer">Scratch</Label>
                        <Switch id="scratch-toggle" checked={lessonScratchEnabled} onCheckedChange={setLessonScratchEnabled} />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md border bg-background">
                        <Label htmlFor="python-toggle" className="text-sm cursor-pointer">Python</Label>
                        <Switch id="python-toggle" checked={lessonPythonEnabled} onCheckedChange={setLessonPythonEnabled} />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md border bg-background">
                        <Label htmlFor="roblox-toggle" className="text-sm cursor-pointer">Roblox</Label>
                        <Switch id="roblox-toggle" checked={lessonRobloxEnabled} onCheckedChange={setLessonRobloxEnabled} />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md border bg-background">
                        <Label htmlFor="minecraft-toggle" className="text-sm cursor-pointer">Minecraft</Label>
                        <Switch id="minecraft-toggle" checked={lessonMinecraftEnabled} onCheckedChange={setLessonMinecraftEnabled} />
                      </div>
                    </div>
                    {lessonScratchEnabled && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="space-y-2">
                          <Label>رابط مشروع Scratch</Label>
                          <Input placeholder="https://scratch.mit.edu/projects/..." value={lessonScratchUrl} onChange={(e) => setLessonScratchUrl(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>تعليمات النشاط</Label>
                          <Textarea placeholder="تعليمات للطلاب..." value={lessonScratchInstructions} onChange={(e) => setLessonScratchInstructions(e.target.value)} rows={3} />
                        </div>
                      </div>
                    )}
                    {lessonPythonEnabled && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="space-y-2">
                          <Label>رابط مشروع Python</Label>
                          <Input placeholder="رابط المشروع أو المحرر..." value={lessonPythonUrl} onChange={(e) => setLessonPythonUrl(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>تعليمات Python</Label>
                          <Textarea placeholder="تعليمات للطلاب..." value={lessonPythonInstructions} onChange={(e) => setLessonPythonInstructions(e.target.value)} rows={3} />
                        </div>
                      </div>
                    )}
                    {lessonRobloxEnabled && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="space-y-2">
                          <Label>رابط مشروع Roblox</Label>
                          <Input placeholder="رابط المشروع..." value={lessonRobloxUrl} onChange={(e) => setLessonRobloxUrl(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>تعليمات Roblox</Label>
                          <Textarea placeholder="تعليمات للطلاب..." value={lessonRobloxInstructions} onChange={(e) => setLessonRobloxInstructions(e.target.value)} rows={3} />
                        </div>
                      </div>
                    )}
                    {lessonMinecraftEnabled && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="space-y-2">
                          <Label>رابط مشروع Minecraft</Label>
                          <Input placeholder="رابط المشروع..." value={lessonMinecraftUrl} onChange={(e) => setLessonMinecraftUrl(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>تعليمات Minecraft</Label>
                          <Textarea placeholder="تعليمات للطلاب..." value={lessonMinecraftInstructions} onChange={(e) => setLessonMinecraftInstructions(e.target.value)} rows={3} />
                        </div>
                      </div>
                    )}
                  </div>

                  <Button onClick={handleAddLesson} disabled={savingLesson} className="w-full">
                    {savingLesson ? 'Adding...' : 'Add Lesson'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              توليد بالذكاء الاصطناعي
            </Button>
          </div>
        )}
      </div>

      {/* AI Generate Lessons Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={(open) => {
        setGenerateDialogOpen(open);
        if (!open) { setGeneratedLessons([]); setGenerateTopic(''); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              توليد الدروس بالذكاء الاصطناعي
            </DialogTitle>
            <DialogDescription>
              سيتم توليد دروس تلقائياً بناءً على عنوان الكورس والفئة العمرية
            </DialogDescription>
          </DialogHeader>

          {generatedLessons.length === 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>موضوع محدد (اختياري)</Label>
                <Input
                  placeholder="مثال: الحلقات والتكرار في البرمجة..."
                  value={generateTopic}
                  onChange={(e) => setGenerateTopic(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>عدد الدروس</Label>
                <Select value={generateCount} onValueChange={setGenerateCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 7, 10].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} دروس</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p><strong>الكورس:</strong> {course?.title}</p>
                <p><strong>الفئة العمرية:</strong> {course?.age_group} سنوات</p>
              </div>
              <Button onClick={handleGenerateLessons} disabled={generating} className="w-full">
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    توليد الدروس
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">تم توليد {generatedLessons.length} دروس. راجعها ثم اضغط حفظ.</p>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {generatedLessons.map((lesson, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <h4 className="font-medium text-sm">{lesson.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">{lesson.description}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setGeneratedLessons([])}>
                  إعادة التوليد
                </Button>
                <Button className="flex-1" onClick={handleSaveGeneratedLessons} disabled={savingLesson}>
                  {savingLesson ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    `حفظ ${generatedLessons.length} دروس`
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{lesson.title}</h4>
                          {lesson.scratch_enabled && (
                             <Badge variant="outline" className="text-xs gap-1">
                               <Code2 className="w-3 h-3" /> Scratch
                             </Badge>
                           )}
                           {lesson.python_enabled && (
                             <Badge variant="outline" className="text-xs gap-1">
                               <Code2 className="w-3 h-3" /> Python
                             </Badge>
                           )}
                           {lesson.roblox_enabled && (
                             <Badge variant="outline" className="text-xs gap-1">
                               <Code2 className="w-3 h-3" /> Roblox
                             </Badge>
                           )}
                           {lesson.minecraft_enabled && (
                             <Badge variant="outline" className="text-xs gap-1">
                               <Code2 className="w-3 h-3" /> Minecraft
                             </Badge>
                           )}
                          {isInstructor && lesson.scratch_enabled && scratchCompletions.has(lesson.id) && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Badge variant="secondary" className="text-xs gap-1 cursor-pointer">
                                  <Users className="w-3 h-3" />
                                  {scratchCompletions.get(lesson.id)!.count} completed
                                </Badge>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 p-3">
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                  Students who completed
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {scratchCompletions.get(lesson.id)!.students.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/50 text-sm">
                                      <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="font-medium truncate">{s.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(s.completed_at).toLocaleDateString('ar-EG')}
                                        </p>
                                        {s.notes && (
                                          <p className="text-xs text-muted-foreground mt-1 italic">"{s.notes}"</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground">{lesson.description}</p>
                        )}
                        {locked && (
                          <p className="text-xs text-muted-foreground mt-1">🔒 يتطلب اشتراك</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!locked && lesson.scratch_enabled && lesson.scratch_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => setActiveScratchLesson(lesson)}
                        >
                          <Code2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Open Scratch Lab</span>
                        </Button>
                      )}
                      {isInstructor && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditLessonDialog(lesson)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteLesson(lesson.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Materials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Course Materials</CardTitle>
              <CardDescription>{materials.length} files uploaded</CardDescription>
            </div>
            {isInstructor && (
              <div>
                <input
                  id="material-upload-detail"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
                  className="hidden"
                  onChange={handleUploadMaterial}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('material-upload-detail')?.click()}
                  disabled={uploadingMaterial}
                >
                  {uploadingMaterial ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Files
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No materials uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map((mat) => (
                <div key={mat.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{mat.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(mat.file_size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={mat.file_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    {isInstructor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteMaterial(mat.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update course details and thumbnail</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Thumbnail */}
            <div className="space-y-2">
              <Label>Course Thumbnail</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                {editThumbnailPreview ? (
                  <div className="relative">
                    <img src={editThumbnailPreview} alt="Thumbnail" className="w-full h-48 object-cover rounded-lg" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={handleRemoveEditThumbnail}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="edit-thumbnail-upload" className="cursor-pointer block text-center py-6">
                    <Image className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload thumbnail image</p>
                  </label>
                )}
                <input
                  id="edit-thumbnail-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleEditThumbnailChange}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Course Title *</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Age Group *</Label>
                <Select value={editAgeGroup} onValueChange={setEditAgeGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6-8">6-8 years</SelectItem>
                    <SelectItem value="9-12">9-12 years</SelectItem>
                    <SelectItem value="13-15">13-15 years</SelectItem>
                    <SelectItem value="16-18">16-18 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleSaveEdit}
              disabled={savingEdit || !editTitle.trim() || !editAgeGroup}
              className="w-full"
            >
              {savingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <Dialog open={editLessonDialogOpen} onOpenChange={setEditLessonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الدرس</DialogTitle>
            <DialogDescription>قم بتعديل تفاصيل الدرس</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>العنوان *</Label>
              <Input value={editLessonTitle} onChange={(e) => setEditLessonTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Input value={editLessonDescription} onChange={(e) => setEditLessonDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>المحتوى</Label>
              <Textarea value={editLessonContent} onChange={(e) => setEditLessonContent(e.target.value)} rows={5} />
            </div>
            <div className="space-y-2">
              <Label>رابط الفيديو</Label>
              <Input value={editLessonVideoUrl} onChange={(e) => setEditLessonVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
            </div>
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Code2 className="h-4 w-4 text-primary" />
                <Label className="font-medium">تفعيل المعامل البرمجية</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 rounded-md border bg-background">
                  <Label className="text-sm cursor-pointer">Scratch</Label>
                  <Switch checked={editLessonScratchEnabled} onCheckedChange={setEditLessonScratchEnabled} />
                </div>
                <div className="flex items-center justify-between p-2 rounded-md border bg-background">
                  <Label className="text-sm cursor-pointer">Python</Label>
                  <Switch checked={editLessonPythonEnabled} onCheckedChange={setEditLessonPythonEnabled} />
                </div>
                <div className="flex items-center justify-between p-2 rounded-md border bg-background">
                  <Label className="text-sm cursor-pointer">Roblox</Label>
                  <Switch checked={editLessonRobloxEnabled} onCheckedChange={setEditLessonRobloxEnabled} />
                </div>
                <div className="flex items-center justify-between p-2 rounded-md border bg-background">
                  <Label className="text-sm cursor-pointer">Minecraft</Label>
                  <Switch checked={editLessonMinecraftEnabled} onCheckedChange={setEditLessonMinecraftEnabled} />
                </div>
              </div>
              {editLessonScratchEnabled && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>رابط مشروع Scratch</Label>
                    <Input value={editLessonScratchUrl} onChange={(e) => setEditLessonScratchUrl(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>تعليمات النشاط</Label>
                    <Textarea value={editLessonScratchInstructions} onChange={(e) => setEditLessonScratchInstructions(e.target.value)} rows={3} />
                  </div>
                </div>
              )}
              {editLessonPythonEnabled && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>رابط مشروع Python</Label>
                    <Input value={editLessonPythonUrl} onChange={(e) => setEditLessonPythonUrl(e.target.value)} placeholder="رابط المشروع أو المحرر..." />
                  </div>
                  <div className="space-y-2">
                    <Label>تعليمات Python</Label>
                    <Textarea value={editLessonPythonInstructions} onChange={(e) => setEditLessonPythonInstructions(e.target.value)} rows={3} />
                  </div>
                </div>
              )}
              {editLessonRobloxEnabled && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>رابط مشروع Roblox</Label>
                    <Input value={editLessonRobloxUrl} onChange={(e) => setEditLessonRobloxUrl(e.target.value)} placeholder="رابط المشروع..." />
                  </div>
                  <div className="space-y-2">
                    <Label>تعليمات Roblox</Label>
                    <Textarea value={editLessonRobloxInstructions} onChange={(e) => setEditLessonRobloxInstructions(e.target.value)} rows={3} />
                  </div>
                </div>
              )}
              {editLessonMinecraftEnabled && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>رابط مشروع Minecraft</Label>
                    <Input value={editLessonMinecraftUrl} onChange={(e) => setEditLessonMinecraftUrl(e.target.value)} placeholder="رابط المشروع..." />
                  </div>
                  <div className="space-y-2">
                    <Label>تعليمات Minecraft</Label>
                    <Textarea value={editLessonMinecraftInstructions} onChange={(e) => setEditLessonMinecraftInstructions(e.target.value)} rows={3} />
                  </div>
                </div>
              )}
            </div>
            <Button onClick={handleSaveEditLesson} disabled={savingEditLesson || !editLessonTitle.trim()} className="w-full">
              {savingEditLesson ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري الحفظ...</>
              ) : 'حفظ التعديلات'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetail;
