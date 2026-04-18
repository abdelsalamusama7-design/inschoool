import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Download, Search, TrendingUp, Users, Award, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResultRow {
  id: string;
  user_id: string;
  exam_id: string;
  score: number | null;
  total_points: number | null;
  submitted_at: string | null;
  started_at: string;
  student_name: string;
  student_email: string;
  exam_title: string;
  exam_type: string;
  course_title: string | null;
}

const ExamResultsPage = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState<string>('all');
  const [selected, setSelected] = useState<ResultRow | null>(null);
  const [details, setDetails] = useState<{ questions: any[]; answers: Record<string, string> } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const openDetails = async (row: ResultRow) => {
    setSelected(row);
    setDetails(null);
    setDetailsLoading(true);
    const [{ data: questions }, { data: submission }] = await Promise.all([
      supabase
        .from('exam_questions')
        .select('id, question_text, question_type, options, correct_answer, points, order_index')
        .eq('exam_id', row.exam_id)
        .order('order_index', { ascending: true }),
      supabase
        .from('exam_submissions')
        .select('answers')
        .eq('id', row.id)
        .maybeSingle(),
    ]);
    setDetails({
      questions: (questions as any[]) || [],
      answers: (submission?.answers as Record<string, string>) || {},
    });
    setDetailsLoading(false);
  };

  useEffect(() => {
    if (user) fetchResults();
  }, [user]);

  const fetchResults = async () => {
    setLoading(true);
    const { data: subs, error } = await supabase
      .from('exam_submissions')
      .select('id, user_id, exam_id, score, total_points, submitted_at, started_at')
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false });

    if (error || !subs?.length) {
      setRows([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(subs.map((s) => s.user_id))];
    const examIds = [...new Set(subs.map((s) => s.exam_id))];

    const [{ data: profiles }, { data: exams }] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds),
      supabase.from('exams').select('id, title, exam_type, course_id, courses:course_id(title), lesson_id, lessons:lesson_id(course_id, courses:course_id(title))').in('id', examIds),
    ]);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    const examMap = new Map((exams || []).map((e: any) => [e.id, e]));

    const merged: ResultRow[] = subs.map((s) => {
      const p: any = profileMap.get(s.user_id);
      const e: any = examMap.get(s.exam_id);
      const courseTitle = e?.courses?.title || e?.lessons?.courses?.title || null;
      return {
        id: s.id,
        user_id: s.user_id,
        exam_id: s.exam_id,
        score: s.score,
        total_points: s.total_points,
        submitted_at: s.submitted_at,
        started_at: s.started_at,
        student_name: p?.full_name || '—',
        student_email: p?.email || '—',
        exam_title: e?.title || '—',
        exam_type: e?.exam_type || 'midterm',
        course_title: courseTitle,
      };
    });

    setRows(merged);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (examFilter !== 'all' && r.exam_id !== examFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.student_name.toLowerCase().includes(q) ||
        r.student_email.toLowerCase().includes(q) ||
        r.exam_title.toLowerCase().includes(q) ||
        (r.course_title || '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, examFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const passed = filtered.filter((r) => {
      const pct = r.total_points ? (r.score! / r.total_points) * 100 : 0;
      return pct >= 50;
    }).length;
    const avg = total > 0
      ? Math.round(filtered.reduce((sum, r) => sum + (r.total_points ? ((r.score || 0) / r.total_points) * 100 : 0), 0) / total)
      : 0;
    return { total, passed, avg };
  }, [filtered]);

  const examOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.exam_id, r.exam_title));
    return Array.from(map.entries());
  }, [rows]);

  const exportCSV = () => {
    const header = ['الطالب', 'البريد', 'الامتحان', 'النوع', 'الكورس', 'الدرجة', 'الإجمالي', 'النسبة %', 'تاريخ التسليم'];
    const lines = filtered.map((r) => {
      const pct = r.total_points ? Math.round(((r.score || 0) / r.total_points) * 100) : 0;
      return [
        r.student_name,
        r.student_email,
        r.exam_title,
        r.exam_type === 'final' ? 'نهائي' : 'نصفي',
        r.course_title || '',
        r.score ?? 0,
        r.total_points ?? 0,
        pct,
        r.submitted_at ? new Date(r.submitted_at).toLocaleString('ar-EG') : '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = '\uFEFF' + [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="w-7 h-7" />
              نتائج الامتحانات
            </h1>
            <p className="text-muted-foreground mt-1">عرض جميع نتائج الطلاب في الامتحانات</p>
          </div>
          <Button onClick={exportCSV} disabled={!filtered.length}>
            <Download className="w-4 h-4 ml-2" />
            تصدير CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التسليمات</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <Award className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">عدد الناجحين</p>
                <p className="text-2xl font-bold">{stats.passed}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">متوسط النسبة</p>
                <p className="text-2xl font-bold">{stats.avg}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">البحث والتصفية</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم الطالب أو الامتحان أو الكورس..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={examFilter} onValueChange={setExamFilter}>
              <SelectTrigger className="md:w-64">
                <SelectValue placeholder="كل الامتحانات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الامتحانات</SelectItem>
                {examOptions.map(([id, title]) => (
                  <SelectItem key={id} value={id}>{title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">لا توجد نتائج</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>الامتحان</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الكورس</TableHead>
                    <TableHead>الدرجة</TableHead>
                    <TableHead>النسبة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ التسليم</TableHead>
                    <TableHead className="text-center">تفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const pct = r.total_points ? Math.round(((r.score || 0) / r.total_points) * 100) : 0;
                    const passed = pct >= 50;
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDetails(r)}
                      >
                        <TableCell>
                          <div className="font-medium">{r.student_name}</div>
                          <div className="text-xs text-muted-foreground">{r.student_email}</div>
                        </TableCell>
                        <TableCell>{r.exam_title}</TableCell>
                        <TableCell>
                          <Badge variant={r.exam_type === 'final' ? 'default' : 'secondary'}>
                            {r.exam_type === 'final' ? 'نهائي' : 'نصفي'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.course_title || '—'}</TableCell>
                        <TableCell className="font-mono">{r.score ?? 0}/{r.total_points ?? 0}</TableCell>
                        <TableCell className="font-bold">{pct}%</TableCell>
                        <TableCell>
                          <Badge variant={passed ? 'default' : 'destructive'}>
                            {passed ? 'ناجح' : 'راسب'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.submitted_at ? new Date(r.submitted_at).toLocaleString('ar-EG') : '—'}
                        </TableCell>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => openDetails(r)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Answer details dialog */}
        <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setDetails(null); } }}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>تفاصيل إجابات الطالب</DialogTitle>
              {selected && (
                <DialogDescription className="space-y-1">
                  <div><strong>{selected.student_name}</strong> — {selected.exam_title}</div>
                  <div className="text-xs">
                    الدرجة: {selected.score ?? 0}/{selected.total_points ?? 0}
                    {selected.total_points ? ` (${Math.round(((selected.score || 0) / selected.total_points) * 100)}%)` : ''}
                  </div>
                </DialogDescription>
              )}
            </DialogHeader>

            {detailsLoading || !details ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin" /></div>
            ) : details.questions.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">لا توجد أسئلة لهذا الامتحان</div>
            ) : (
              <ScrollArea className="max-h-[60vh] pr-2">
                <div className="space-y-4">
                  {details.questions.map((q, idx) => {
                    const studentAnswer = details.answers[q.id];
                    const isCorrect = studentAnswer === q.correct_answer;
                    const answered = studentAnswer !== undefined && studentAnswer !== null && studentAnswer !== '';
                    const options: string[] = Array.isArray(q.options) ? q.options : [];
                    return (
                      <div key={q.id} className={`rounded-lg border-2 p-4 ${isCorrect ? 'border-green-500/30 bg-green-500/5' : answered ? 'border-destructive/30 bg-destructive/5' : 'border-muted bg-muted/30'}`}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">سؤال {idx + 1}</Badge>
                              <Badge variant="secondary" className="text-xs">{q.points} نقطة</Badge>
                              {isCorrect ? (
                                <Badge className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle2 className="w-3 h-3 ml-1" />صحيح</Badge>
                              ) : answered ? (
                                <Badge variant="destructive"><XCircle className="w-3 h-3 ml-1" />خطأ</Badge>
                              ) : (
                                <Badge variant="outline">لم يُجب</Badge>
                              )}
                            </div>
                            <p className="font-medium">{q.question_text}</p>
                          </div>
                        </div>

                        {q.question_type === 'multiple_choice' && options.length > 0 ? (
                          <div className="space-y-1.5">
                            {options.map((opt, i) => {
                              const isStudent = opt === studentAnswer;
                              const isRight = opt === q.correct_answer;
                              return (
                                <div
                                  key={i}
                                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                                    isRight ? 'bg-green-500/10 border border-green-500/30' :
                                    isStudent ? 'bg-destructive/10 border border-destructive/30' :
                                    'bg-background border border-border'
                                  }`}
                                >
                                  {isRight && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                                  {isStudent && !isRight && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                                  <span className="flex-1">{opt}</span>
                                  {isStudent && <Badge variant="outline" className="text-xs">إجابة الطالب</Badge>}
                                  {isRight && !isStudent && <Badge variant="outline" className="text-xs">الإجابة الصحيحة</Badge>}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground min-w-24">إجابة الطالب:</span>
                              <span className="font-medium">{answered ? studentAnswer : '— لم يُجب —'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground min-w-24">الإجابة الصحيحة:</span>
                              <span className="font-medium text-green-600">{q.correct_answer}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ExamResultsPage;
