import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Download, Search, TrendingUp, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const pct = r.total_points ? Math.round(((r.score || 0) / r.total_points) * 100) : 0;
                    const passed = pct >= 50;
                    return (
                      <TableRow key={r.id}>
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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ExamResultsPage;
