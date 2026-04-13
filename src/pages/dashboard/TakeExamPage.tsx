import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  points: number;
  order_index: number;
}

interface ExamData {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  lesson_id: string;
  exam_type: string;
  course_id: string | null;
  courses: { title: string } | null;
}

const TakeExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (user && examId) fetchExam();
  }, [user, examId]);

  // Timer
  useEffect(() => {
    if (!started || submitted || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, submitted]);

  const fetchExam = async () => {
    setLoading(true);
    // Check existing submission
    const { data: existing } = await supabase
      .from('exam_submissions')
      .select('*')
      .eq('exam_id', examId!)
      .eq('user_id', user!.id)
      .maybeSingle();

    if (existing?.submitted_at) {
      setAlreadySubmitted(true);
      setScore(existing.score);
      setTotalPoints(existing.total_points || 0);
      setSubmitted(true);
      setLoading(false);
      return;
    }

    const { data: examData } = await supabase
      .from('exams')
      .select('id, title, description, duration_minutes, lesson_id, exam_type, course_id, courses:course_id(title)')
      .eq('id', examId!)
      .eq('is_published', true)
      .single();

    if (!examData) {
      toast.error('الامتحان غير موجود أو غير متاح');
      navigate('/dashboard');
      return;
    }

    const { data: questionsData } = await supabase
      .from('exam_questions')
      .select('id, question_text, question_type, options, points, order_index')
      .eq('exam_id', examId!)
      .order('order_index');

    setExam(examData as ExamData);
    setQuestions((questionsData as any as Question[]) || []);
    setTotalPoints((questionsData || []).reduce((sum: number, q: any) => sum + q.points, 0));
    setTimeLeft(examData.duration_minutes * 60);
    setLoading(false);
  };

  const startExam = async () => {
    // Create submission record
    await supabase.from('exam_submissions').insert({
      exam_id: examId!,
      user_id: user!.id,
      answers: {},
      started_at: new Date().toISOString(),
    });
    setStarted(true);
  };

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitted || submitting) return;
    if (!autoSubmit && !confirm('هل أنت متأكد من تسليم الامتحان؟')) return;

    setSubmitting(true);
    try {
      // Fetch correct answers to calculate score
      const { data: questionsWithAnswers } = await supabase
        .from('exam_questions')
        .select('id, correct_answer, points')
        .eq('exam_id', examId!);

      let calculatedScore = 0;
      (questionsWithAnswers || []).forEach((q: any) => {
        if (answers[q.id] === q.correct_answer) {
          calculatedScore += q.points;
        }
      });

      const { error } = await supabase
        .from('exam_submissions')
        .update({
          answers,
          score: calculatedScore,
          total_points: totalPoints,
          submitted_at: new Date().toISOString(),
        })
        .eq('exam_id', examId!)
        .eq('user_id', user!.id);

      if (error) throw error;

      // Auto-generate certificate if final exam and passed (>= 50%)
      const percentage = totalPoints > 0 ? Math.round((calculatedScore / totalPoints) * 100) : 0;
      if (exam?.exam_type === 'final' && percentage >= 50 && exam?.course_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user!.id)
          .single();

        const courseTitle = exam.courses?.title || 'دورة';
        const studentName = profile?.full_name || 'طالب';

        await supabase.from('certificates').insert({
          user_id: user!.id,
          course_id: exam.course_id,
          exam_id: examId!,
          student_name: studentName,
          course_title: courseTitle,
          score: calculatedScore,
          total_points: totalPoints,
        });
      }

      setScore(calculatedScore);
      setSubmitted(true);
      if (autoSubmit) {
        toast.warning('انتهى الوقت! تم تسليم الامتحان تلقائياً');
      } else {
        toast.success('تم تسليم الامتحان بنجاح');
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  }, [submitted, submitting, answers, examId, user, totalPoints, exam]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin" /></div>
      </DashboardLayout>
    );
  }

  if (submitted) {
    const percentage = totalPoints > 0 ? Math.round((score! / totalPoints) * 100) : 0;
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto mt-12 text-center space-y-6">
          <CheckCircle className={`w-20 h-20 mx-auto ${percentage >= 50 ? 'text-green-500' : 'text-red-500'}`} />
          <h1 className="text-3xl font-bold">{alreadySubmitted ? 'نتيجة الامتحان' : 'تم التسليم!'}</h1>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-5xl font-bold">{percentage}%</div>
              <p className="text-muted-foreground">{score} من {totalPoints} درجة</p>
              <Progress value={percentage} className="h-3" />
              <Badge variant={percentage >= 50 ? 'default' : 'destructive'} className="text-lg px-4 py-1">
                {percentage >= 90 ? 'ممتاز! 🌟' : percentage >= 75 ? 'جيد جداً 👏' : percentage >= 50 ? 'جيد ✅' : 'يحتاج تحسين 📚'}
              </Badge>
            </CardContent>
          </Card>
          <Button onClick={() => navigate('/dashboard')}>العودة للوحة التحكم</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!started) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto mt-12 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{exam?.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exam?.description && <p className="text-muted-foreground">{exam.description}</p>}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>المدة: {exam?.duration_minutes} دقيقة</span>
              </div>
              <p className="text-muted-foreground">عدد الأسئلة: {questions.length}</p>
              <p className="text-muted-foreground">إجمالي الدرجات: {totalPoints}</p>
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">تنبيه مهم</p>
                  <p className="text-amber-700 dark:text-amber-300">بمجرد البدء، سيبدأ العد التنازلي ولا يمكن إيقافه. سيتم تسليم الامتحان تلقائياً عند انتهاء الوقت.</p>
                </div>
              </div>
              <Button onClick={startExam} className="w-full" size="lg">ابدأ الامتحان</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Timer bar */}
        <div className="sticky top-0 z-10 bg-background border rounded-lg p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{exam?.title}</h2>
            <Badge variant="outline">{answeredCount}/{questions.length} سؤال</Badge>
          </div>
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timeLeft < 60 ? 'text-destructive animate-pulse' : ''}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, qi) => (
          <Card key={q.id} className={answers[q.id] ? 'border-primary/30' : ''}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  {qi + 1}. {q.question_text}
                </Label>
                <Badge variant="outline">{q.points} {q.points === 1 ? 'درجة' : 'درجات'}</Badge>
              </div>

              <RadioGroup value={answers[q.id] || ''} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}>
                {q.options.map((opt: string, oi: number) => (
                  <div key={oi} className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value={opt} id={`q${qi}_o${oi}`} />
                    <Label htmlFor={`q${qi}_o${oi}`} className="cursor-pointer flex-1">
                      {q.question_type === 'multiple_choice' ? `${String.fromCharCode(65 + oi)}. ${opt}` : opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-between items-center py-4">
          <p className="text-sm text-muted-foreground">أجبت على {answeredCount} من {questions.length} سؤال</p>
          <Button onClick={() => handleSubmit(false)} disabled={submitting} size="lg">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري التسليم...</> : 'تسليم الامتحان'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TakeExamPage;
