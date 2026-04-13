import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, FileText, Loader2, Sparkles, BookOpen } from 'lucide-react';

interface Course { id: string; title: string; description: string | null; }
interface Lesson { id: string; title: string; course_id: string; }

interface Question {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  is_published: boolean;
  lesson_id: string | null;
  course_id: string | null;
  exam_type: string;
  created_at: string;
}

const ExamsManagement = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questionsDialogOpen, setQuestionsDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [examType, setExamType] = useState<'midterm' | 'final'>('midterm');

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiNumQuestions, setAiNumQuestions] = useState('10');

  useEffect(() => { if (user) { fetchExams(); fetchCoursesAndLessons(); } }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      setFilteredLessons(lessons.filter(l => l.course_id === selectedCourse));
    } else {
      setFilteredLessons([]);
    }
  }, [selectedCourse, lessons]);

  const fetchCoursesAndLessons = async () => {
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from('courses').select('id, title, description').order('title'),
      supabase.from('lessons').select('id, title, course_id').order('order_index'),
    ]);
    setCourses(c || []);
    setLessons(l || []);
  };

  const fetchExams = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });
    setExams((data as any) || []);
    setLoading(false);
  };

  const getCourseName = (exam: Exam) => {
    if (exam.course_id) return courses.find(c => c.id === exam.course_id)?.title || '';
    if (exam.lesson_id) {
      const lesson = lessons.find(l => l.id === exam.lesson_id);
      return lesson ? courses.find(c => c.id === lesson.course_id)?.title || '' : '';
    }
    return '';
  };

  const getLessonName = (exam: Exam) => {
    return exam.lesson_id ? lessons.find(l => l.id === exam.lesson_id)?.title || '' : 'كل الدورة';
  };

  const openCreateDialog = () => {
    setSelectedExam(null);
    setTitle(''); setDescription(''); setDurationMinutes('30');
    setSelectedCourse(''); setSelectedLesson('');
    setIsPublished(false); setExamType('midterm');
    setDialogOpen(true);
  };

  const openEditDialog = (exam: Exam) => {
    setSelectedExam(exam);
    setTitle(exam.title);
    setDescription(exam.description || '');
    setDurationMinutes(String(exam.duration_minutes));
    const courseId = exam.course_id || lessons.find(l => l.id === exam.lesson_id)?.course_id || '';
    setSelectedCourse(courseId);
    setSelectedLesson(exam.lesson_id || '');
    setIsPublished(exam.is_published);
    setExamType((exam.exam_type as 'midterm' | 'final') || 'midterm');
    setDialogOpen(true);
  };

  const handleSaveExam = async () => {
    if (!title || !selectedCourse) {
      toast.error('يرجى ملء العنوان واختيار الدورة');
      return;
    }
    setSaving(true);
    try {
      const examData: any = {
        title,
        description: description || null,
        duration_minutes: parseInt(durationMinutes),
        course_id: selectedCourse,
        lesson_id: selectedLesson || null,
        is_published: isPublished,
        exam_type: examType,
        created_by: user!.id,
      };

      if (selectedExam) {
        const { error } = await supabase.from('exams').update(examData).eq('id', selectedExam.id);
        if (error) throw error;
        toast.success('تم تحديث الامتحان بنجاح');
      } else {
        const { error } = await supabase.from('exams').insert(examData);
        if (error) throw error;
        toast.success('تم إنشاء الامتحان بنجاح');
      }
      setDialogOpen(false);
      fetchExams();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الامتحان؟')) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) toast.error('حدث خطأ أثناء الحذف');
    else { toast.success('تم حذف الامتحان'); fetchExams(); }
  };

  const togglePublish = async (exam: Exam) => {
    const { error } = await supabase.from('exams').update({ is_published: !exam.is_published }).eq('id', exam.id);
    if (error) toast.error('حدث خطأ');
    else { toast.success(exam.is_published ? 'تم إلغاء النشر' : 'تم نشر الامتحان'); fetchExams(); }
  };

  // Questions
  const openQuestionsDialog = async (exam: Exam) => {
    setSelectedExam(exam);
    const { data } = await supabase.from('exam_questions').select('*').eq('exam_id', exam.id).order('order_index');
    setQuestions((data as any as Question[]) || []);
    setQuestionsDialogOpen(true);
  };

  const addQuestion = (type: 'multiple_choice' | 'true_false') => {
    setQuestions([...questions, {
      question_text: '',
      question_type: type,
      options: type === 'multiple_choice' ? ['', '', '', ''] : ['صح', 'غلط'],
      correct_answer: '',
      points: 1,
      order_index: questions.length,
    }]);
  };

  const updateQuestion = (i: number, field: keyof Question, value: any) => {
    const u = [...questions]; (u[i] as any)[field] = value; setQuestions(u);
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    const u = [...questions]; u[qi].options[oi] = value; setQuestions(u);
  };

  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));

  const handleSaveQuestions = async () => {
    if (!selectedExam) return;
    if (questions.find(q => !q.question_text || !q.correct_answer)) {
      toast.error('يرجى ملء جميع الأسئلة وتحديد الإجابات الصحيحة');
      return;
    }
    setSavingQuestions(true);
    try {
      await supabase.from('exam_questions').delete().eq('exam_id', selectedExam.id);
      if (questions.length > 0) {
        const { error } = await supabase.from('exam_questions').insert(
          questions.map((q, i) => ({
            exam_id: selectedExam.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options,
            correct_answer: q.correct_answer,
            points: q.points,
            order_index: i,
          }))
        );
        if (error) throw error;
      }
      toast.success('تم حفظ الأسئلة بنجاح');
      setQuestionsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    } finally {
      setSavingQuestions(false);
    }
  };

  // AI Generation
  const handleGenerateAI = async () => {
    if (!selectedExam) return;
    const course = courses.find(c => c.id === selectedExam.course_id);
    if (!course) {
      toast.error('لا يمكن العثور على بيانات الدورة');
      return;
    }

    setGeneratingAI(true);
    try {
      const courseLessons = lessons.filter(l => l.course_id === course.id).map(l => l.title);

      const { data, error } = await supabase.functions.invoke('generate-exam', {
        body: {
          course_title: course.title,
          course_description: course.description,
          exam_type: selectedExam.exam_type,
          num_questions: parseInt(aiNumQuestions),
          lessons_titles: courseLessons,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const generated = (data.questions as Question[]).map((q, i) => ({
        ...q,
        order_index: questions.length + i,
      }));

      setQuestions([...questions, ...generated]);
      toast.success(`تم توليد ${generated.length} سؤال بالذكاء الاصطناعي!`);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التوليد');
    } finally {
      setGeneratingAI(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الامتحانات</h1>
          <p className="text-muted-foreground">إنشاء امتحانات نصفية ونهائية يدوياً أو بالذكاء الاصطناعي</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          إنشاء امتحان جديد
        </Button>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد امتحانات بعد</p>
            <Button className="mt-4" onClick={openCreateDialog}>إنشاء أول امتحان</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-lg">{exam.title}</h3>
                      <Badge variant={exam.is_published ? 'default' : 'secondary'}>
                        {exam.is_published ? 'منشور' : 'مسودة'}
                      </Badge>
                      <Badge variant="outline">
                        {exam.exam_type === 'final' ? '🏆 نهائي' : '📝 نصفي'}
                      </Badge>
                    </div>
                    {exam.description && <p className="text-sm text-muted-foreground mb-1">{exam.description}</p>}
                    <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                      <span>الدورة: {getCourseName(exam)}</span>
                      <span>الدرس: {getLessonName(exam)}</span>
                      <span>المدة: {exam.duration_minutes} دقيقة</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openQuestionsDialog(exam)}>
                      <FileText className="w-4 h-4 mr-1" />الأسئلة
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => togglePublish(exam)}>
                      {exam.is_published ? 'إلغاء النشر' : 'نشر'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(exam)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteExam(exam.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Exam Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam ? 'تعديل الامتحان' : 'إنشاء امتحان جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان الامتحان *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: امتحان منتصف الدورة" />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف الامتحان (اختياري)" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>نوع الامتحان *</Label>
              <Select value={examType} onValueChange={(v) => setExamType(v as 'midterm' | 'final')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="midterm">📝 امتحان نصفي (وسط الدورة)</SelectItem>
                  <SelectItem value="final">🏆 امتحان نهائي (آخر الدورة)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الدورة *</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger><SelectValue placeholder="اختر الدورة" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الدرس (اختياري)</Label>
              <Select value={selectedLesson} onValueChange={setSelectedLesson} disabled={!selectedCourse}>
                <SelectTrigger><SelectValue placeholder="اختر الدرس (اختياري)" /></SelectTrigger>
                <SelectContent>
                  {filteredLessons.map(l => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>مدة الامتحان (بالدقائق)</Label>
              <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 15, 20, 30, 45, 60, 90, 120].map(d => (
                    <SelectItem key={d} value={String(d)}>{d} دقيقة</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <Label>نشر الامتحان للطلاب</Label>
            </div>
            <Button onClick={handleSaveExam} disabled={saving} className="w-full">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري الحفظ...</> : selectedExam ? 'حفظ التعديلات' : 'إنشاء الامتحان'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Questions Dialog */}
      <Dialog open={questionsDialogOpen} onOpenChange={setQuestionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>أسئلة: {selectedExam?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="sm" variant="outline" onClick={() => addQuestion('multiple_choice')}>
                <Plus className="w-4 h-4 mr-1" />اختيار من متعدد
              </Button>
              <Button size="sm" variant="outline" onClick={() => addQuestion('true_false')}>
                <Plus className="w-4 h-4 mr-1" />صح / غلط
              </Button>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <Input
                  type="number" min={1} max={30}
                  className="w-20 h-9 text-sm"
                  value={aiNumQuestions}
                  onChange={(e) => setAiNumQuestions(e.target.value)}
                  placeholder="عدد"
                />
                <Button size="sm" variant="secondary" onClick={handleGenerateAI} disabled={generatingAI}>
                  {generatingAI ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" />جاري التوليد...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-1" />توليد بالذكاء الاصطناعي</>
                  )}
                </Button>
              </div>
            </div>

            {questions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">لا توجد أسئلة بعد. أضف يدوياً أو استخدم الذكاء الاصطناعي.</p>
            )}

            {questions.map((q, qi) => (
              <Card key={qi}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {q.question_type === 'multiple_choice' ? 'اختيار من متعدد' : 'صح / غلط'} — سؤال {qi + 1}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">الدرجة:</Label>
                      <Input type="number" min={1} className="w-16 h-8 text-sm" value={q.points}
                        onChange={(e) => updateQuestion(qi, 'points', parseInt(e.target.value) || 1)} />
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeQuestion(qi)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>نص السؤال *</Label>
                    <Textarea value={q.question_text} onChange={(e) => updateQuestion(qi, 'question_text', e.target.value)}
                      placeholder="اكتب السؤال هنا..." rows={2} />
                  </div>

                  {q.question_type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <Label>الخيارات</Label>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <span className="text-sm font-medium w-6">{String.fromCharCode(65 + oi)}.</span>
                          <Input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)}
                            placeholder={`الخيار ${String.fromCharCode(65 + oi)}`} className="flex-1" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>الإجابة الصحيحة *</Label>
                    <Select value={q.correct_answer} onValueChange={(v) => updateQuestion(qi, 'correct_answer', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر الإجابة الصحيحة" /></SelectTrigger>
                      <SelectContent>
                        {q.options.map((opt, oi) => (
                          <SelectItem key={oi} value={opt || `option_${oi}`} disabled={!opt}>
                            {q.question_type === 'multiple_choice' ? `${String.fromCharCode(65 + oi)}. ${opt || '(فارغ)'}` : opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}

            {questions.length > 0 && (
              <div className="flex justify-between items-center pt-2">
                <p className="text-sm text-muted-foreground">
                  {questions.length} سؤال — إجمالي الدرجات: {questions.reduce((s, q) => s + q.points, 0)}
                </p>
                <Button onClick={handleSaveQuestions} disabled={savingQuestions}>
                  {savingQuestions ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري الحفظ...</> : 'حفظ الأسئلة'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamsManagement;
