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
import { ArrowLeft, Plus, FileText, Trash2, Lock, Crown, Upload, Download, Loader2, Pencil, Image } from 'lucide-react';
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

        if (lessonsRes.data) setLessons(lessonsRes.data);
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
              Edit Course
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
                  <Button onClick={handleAddLesson} disabled={savingLesson} className="w-full">
                    {savingLesson ? 'Adding...' : 'Add Lesson'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
    </div>
  );
};

export default CourseDetail;
