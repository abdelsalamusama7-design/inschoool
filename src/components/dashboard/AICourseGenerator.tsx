import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AILesson { title: string; description: string; content: string; }
interface AIQuestion { question_text: string; question_type: 'multiple_choice' | 'true_false'; options: string[]; correct_answer: string; points: number; }
interface AIExam { title: string; duration_minutes: number; questions: AIQuestion[]; }
interface AIResult { description: string; lessons: AILesson[]; exam?: AIExam; }

interface Props { onCreated?: () => void; }

const AICourseGenerator = ({ onCreated }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [ageGroup, setAgeGroup] = useState('9-12');
  const [lessonsCount, setLessonsCount] = useState(6);
  const [includeExam, setIncludeExam] = useState(true);
  const [examQuestionsCount, setExamQuestionsCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  const handleGenerate = async () => {
    if (!title.trim()) return toast.error('أدخل عنوان الكورس');
    setGenerating(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-full-course', {
        body: { courseTitle: title, ageGroup, lessonsCount, includeExam, examQuestionsCount, topic },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as AIResult);
      toast.success('تم توليد الكورس! راجعه ثم احفظ');
    } catch (e: any) {
      toast.error(e.message || 'فشل التوليد');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;
    setSaving(true);
    try {
      const { data: course, error: ce } = await supabase.from('courses').insert({
        title, description: result.description, age_group: ageGroup as any, instructor_id: user.id,
      }).select().single();
      if (ce) throw ce;

      const lessonRows = result.lessons.map((l, i) => ({
        course_id: course.id, title: l.title, description: l.description, content: l.content, order_index: i,
      }));
      const { error: le } = await supabase.from('lessons').insert(lessonRows);
      if (le) throw le;

      if (includeExam && result.exam) {
        const { data: exam, error: ee } = await supabase.from('exams').insert({
          title: result.exam.title,
          duration_minutes: result.exam.duration_minutes || 30,
          course_id: course.id,
          exam_type: 'final' as any,
          created_by: user.id,
          is_published: true,
        }).select().single();
        if (ee) throw ee;

        const qRows = result.exam.questions.map((q, i) => ({
          exam_id: exam.id,
          question_text: q.question_text,
          question_type: q.question_type as any,
          options: q.options,
          correct_answer: q.correct_answer,
          points: q.points || 1,
          order_index: i,
        }));
        const { error: qe } = await supabase.from('exam_questions').insert(qRows);
        if (qe) throw qe;
      }

      toast.success('تم حفظ الكورس بنجاح! 🎉');
      onCreated?.();
      setOpen(false);
      setResult(null);
      setTitle('');
      setTopic('');
      navigate(`/dashboard/courses/${course.id}`);
    } catch (e: any) {
      toast.error(e.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Wand2 className="w-4 h-4 ml-2" />
          توليد كورس بالذكاء الاصطناعي
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            توليد كورس متكامل
          </DialogTitle>
          <DialogDescription>أدخل المعلومات وسيقوم الذكاء الاصطناعي بإنشاء الكورس + الدروس + الامتحان</DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>عنوان الكورس *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: مقدمة في برمجة Scratch" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>الموضوع / تفاصيل إضافية (اختياري)</Label>
                <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3}
                  placeholder="أهداف الكورس، المهارات المستهدفة..." />
              </div>
              <div className="space-y-2">
                <Label>الفئة العمرية</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6-8">6-8 سنوات</SelectItem>
                    <SelectItem value="9-12">9-12 سنة</SelectItem>
                    <SelectItem value="13-15">13-15 سنة</SelectItem>
                    <SelectItem value="16-18">16-18 سنة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>عدد الدروس</Label>
                <Input type="number" min={1} max={20} value={lessonsCount}
                  onChange={(e) => setLessonsCount(Number(e.target.value))} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border md:col-span-2">
                <div>
                  <Label className="text-base">إضافة امتحان نهائي</Label>
                  <p className="text-xs text-muted-foreground mt-1">سيتم توليد امتحان متعدد الأسئلة لتقييم الكورس</p>
                </div>
                <Switch checked={includeExam} onCheckedChange={setIncludeExam} />
              </div>
              {includeExam && (
                <div className="space-y-2">
                  <Label>عدد أسئلة الامتحان</Label>
                  <Input type="number" min={1} max={20} value={examQuestionsCount}
                    onChange={(e) => setExamQuestionsCount(Number(e.target.value))} />
                </div>
              )}
            </div>

            <Button onClick={handleGenerate} disabled={generating || !title.trim()} className="w-full" size="lg">
              {generating ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري التوليد...</> :
                <><Sparkles className="w-4 h-4 ml-2" />ولّد الكورس الآن</>}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground">{result.description}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge>{ageGroup} سنوات</Badge>
                <Badge variant="secondary">{result.lessons.length} درس</Badge>
                {result.exam && <Badge variant="outline">امتحان: {result.exam.questions.length} سؤال</Badge>}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">الدروس:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.lessons.map((l, i) => (
                  <div key={i} className="p-3 rounded border">
                    <p className="font-medium text-sm">{i + 1}. {l.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{l.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {result.exam && (
              <div className="space-y-2">
                <h4 className="font-semibold">أسئلة الامتحان ({result.exam.title}):</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.exam.questions.map((q, i) => (
                    <div key={i} className="p-2 rounded border text-sm">
                      <p>{i + 1}. {q.question_text}</p>
                      <p className="text-xs text-primary mt-1">الإجابة: {q.correct_answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResult(null)} disabled={saving}>عدّل البيانات</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الحفظ...</> : 'احفظ الكورس'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AICourseGenerator;
