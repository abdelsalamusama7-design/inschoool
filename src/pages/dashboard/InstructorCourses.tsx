import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Plus, Users, FileText, Trash2, Upload, Image, Loader2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  age_group: string;
  thumbnail_url: string | null;
  created_at: string;
}

const InstructorCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Map<string, number>>(new Map());
  const [lessonCounts, setLessonCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  // Create course dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user!.id)
        .order('created_at', { ascending: false });

      if (coursesData) {
        setCourses(coursesData);

        const counts = new Map<string, number>();
        const lCounts = new Map<string, number>();
        
        await Promise.all(
          coursesData.map(async (course) => {
            const [enrollRes, lessonRes] = await Promise.all([
              supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
              supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
            ]);
            counts.set(course.id, enrollRes.count || 0);
            lCounts.set(course.id, lessonRes.count || 0);
          })
        );

        setEnrollmentCounts(counts);
        setLessonCounts(lCounts);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleMaterialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setMaterialFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeMaterial = (index: number) => {
    setMaterialFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAgeGroup('');
    setThumbnail(null);
    setThumbnailPreview(null);
    setMaterialFiles([]);
  };

  const handleCreateCourse = async () => {
    if (!title.trim() || !ageGroup) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      // 1. Upload thumbnail if provided
      let thumbnailUrl: string | null = null;
      if (thumbnail) {
        const ext = thumbnail.name.split('.').pop();
        const filePath = `thumbnails/${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('course-materials')
          .upload(filePath, thumbnail);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('course-materials')
          .getPublicUrl(filePath);

        thumbnailUrl = urlData.publicUrl;
      }

      // 2. Create course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          title,
          description: description || null,
          age_group: ageGroup as any,
          instructor_id: user!.id,
          thumbnail_url: thumbnailUrl,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // 3. Upload material files
      if (materialFiles.length > 0) {
        for (const file of materialFiles) {
          const filePath = `materials/${course.id}/${Date.now()}_${file.name}`;
          const { error: mUploadError } = await supabase.storage
            .from('course-materials')
            .upload(filePath, file);

          if (mUploadError) {
            console.error('Error uploading material:', mUploadError);
            continue;
          }

          const { data: mUrlData } = supabase.storage
            .from('course-materials')
            .getPublicUrl(filePath);

          await supabase.from('course_materials').insert({
            course_id: course.id,
            file_name: file.name,
            file_url: mUrlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user!.id,
          });
        }
      }

      toast({ title: 'Course created successfully!' });
      resetForm();
      setDialogOpen(false);
      fetchCourses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this course and all its lessons?')) return;

    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      toast({ title: 'Course deleted' });
      fetchCourses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Manage your courses and materials</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first course to get started</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="cursor-pointer hover:shadow-md transition-shadow group overflow-hidden"
              onClick={() => navigate(`/dashboard/courses/${course.id}`)}
            >
              {/* Thumbnail */}
              {course.thumbnail_url ? (
                <div className="h-40 overflow-hidden">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-40 bg-primary/5 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-primary/30" />
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                  <Badge variant="secondary">{course.age_group}</Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {course.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {enrollmentCounts.get(course.id) || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {lessonCounts.get(course.id) || 0} lessons
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteCourse(course.id, e)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Course Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Fill in the details and upload materials</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <Label>Course Thumbnail</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                {thumbnailPreview ? (
                  <div className="relative">
                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-48 object-cover rounded-lg" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => { setThumbnail(null); setThumbnailPreview(null); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="thumbnail-upload" className="cursor-pointer block text-center py-6">
                    <Image className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload thumbnail image</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP (max 5MB)</p>
                  </label>
                )}
                <input
                  id="thumbnail-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="course-title">Course Title *</Label>
                <Input
                  id="course-title"
                  placeholder="e.g., Web Development Basics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Age Group *</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
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
              <Label htmlFor="course-desc">Description</Label>
              <Textarea
                id="course-desc"
                placeholder="Describe what students will learn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Materials Upload */}
            <div className="space-y-2">
              <Label>Course Materials</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <label htmlFor="materials-upload" className="cursor-pointer block text-center py-4">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Upload files (PDF, Word, PowerPoint, images, etc.)</p>
                  <p className="text-xs text-muted-foreground mt-1">You can select multiple files</p>
                </label>
                <input
                  id="materials-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
                  className="hidden"
                  onChange={handleMaterialsChange}
                />
              </div>

              {materialFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                  {materialFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-muted-foreground shrink-0">({formatFileSize(file.size)})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-destructive"
                        onClick={() => removeMaterial(idx)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleCreateCourse}
              disabled={creating || !title.trim() || !ageGroup}
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorCourses;
