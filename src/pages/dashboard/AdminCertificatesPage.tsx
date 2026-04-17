import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Award, Loader2, Mail, MessageCircle, Plus, Printer, Search, Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Certificate {
  id: string;
  student_name: string;
  course_title: string;
  score: number;
  total_points: number;
  certificate_number: string;
  issued_at: string;
  user_id: string;
  course_id: string;
  exam_id: string;
}

interface Student { user_id: string; full_name: string; email: string; }
interface Course { id: string; title: string; }
interface Exam { id: string; title: string; course_id: string | null; }

const buildCertificateHtml = (cert: Certificate, percentage: number) => `
<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8" /><title>شهادة - ${cert.course_title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
  .cert { width: 800px; padding: 60px; background: white; border: 8px double #d4af37; position: relative; text-align: center; }
  .cert::before { content: ''; position: absolute; inset: 12px; border: 2px solid #d4af37; pointer-events: none; }
  .cert h1 { color: #d4af37; font-size: 36px; margin-bottom: 8px; }
  .cert h2 { color: #1f2937; font-size: 28px; margin: 20px 0 8px; }
  .cert .name { color: #1e40af; font-size: 32px; font-weight: bold; margin: 16px 0; border-bottom: 2px solid #d4af37; display: inline-block; padding: 0 20px 8px; }
  .cert .course { color: #1f2937; font-size: 24px; font-weight: 600; margin: 12px 0; }
  .cert .score { color: #059669; font-size: 20px; margin: 12px 0; }
  .cert .details { color: #6b7280; font-size: 14px; margin-top: 30px; }
  .cert .number { color: #9ca3af; font-size: 12px; margin-top: 8px; }
  @media print { body { background: white; } .cert { border-width: 4px; } }
</style></head><body>
<div class="cert">
  <h1>🏆 شهادة إتمام</h1>
  <h2>يُشهد بأن</h2>
  <div class="name">${cert.student_name}</div>
  <p>قد أتم بنجاح دورة</p>
  <div class="course">${cert.course_title}</div>
  <div class="score">بنتيجة ${percentage}% (${cert.score}/${cert.total_points})</div>
  <div class="details">تاريخ الإصدار: ${format(new Date(cert.issued_at), 'dd MMMM yyyy', { locale: ar })}</div>
  <div class="number">رقم الشهادة: ${cert.certificate_number}</div>
</div>
<script>setTimeout(() => window.print(), 500);</script>
</body></html>`;

const IssueCertificateDialog = ({ onIssued }: { onIssued: () => void }) => {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [examId, setExamId] = useState('');
  const [score, setScore] = useState(100);
  const [totalPoints, setTotalPoints] = useState(100);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (open) loadData(); }, [open]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: roles }, { data: cs }, { data: es }] = await Promise.all([
      supabase.from('user_roles').select('user_id').eq('role', 'student'),
      supabase.from('courses').select('id, title').order('title'),
      supabase.from('exams').select('id, title, course_id').eq('exam_type', 'final'),
    ]);
    const ids = (roles || []).map((r: any) => r.user_id);
    let stu: Student[] = [];
    if (ids.length) {
      const { data: ps } = await supabase.from('profiles')
        .select('user_id, full_name, email').in('user_id', ids);
      stu = (ps as any) || [];
    }
    setStudents(stu);
    setCourses(cs || []);
    setExams((es as Exam[]) || []);
    setLoading(false);
  };

  const filteredExams = courseId ? exams.filter((e) => e.course_id === courseId) : exams;

  const handleIssue = async () => {
    if (!studentId || !courseId) return toast.error('اختر الطالب والكورس');
    const student = students.find((s) => s.user_id === studentId);
    const course = courses.find((c) => c.id === courseId);
    if (!student || !course) return;

    let finalExamId = examId;
    if (!finalExamId) {
      const courseExam = exams.find((e) => e.course_id === courseId);
      if (courseExam) finalExamId = courseExam.id;
    }
    if (!finalExamId) {
      return toast.error('لا يوجد امتحان نهائي لهذا الكورس. أنشئ امتحاناً نهائياً أولاً.');
    }

    setSubmitting(true);
    const { error } = await supabase.from('certificates').insert({
      user_id: studentId,
      course_id: courseId,
      exam_id: finalExamId,
      student_name: student.full_name,
      course_title: course.title,
      score,
      total_points: totalPoints,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success('تم إصدار الشهادة بنجاح');
    setOpen(false);
    onIssued();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 ml-2" />إصدار شهادة جديدة</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>إصدار شهادة لطالب</DialogTitle>
          <DialogDescription>اختر الطالب والكورس وأدخل الدرجة</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الطالب</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue placeholder="اختر طالباً..." /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.user_id} value={s.user_id}>
                      {s.full_name} ({s.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الكورس</Label>
              <Select value={courseId} onValueChange={(v) => { setCourseId(v); setExamId(''); }}>
                <SelectTrigger><SelectValue placeholder="اختر كورساً..." /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {filteredExams.length > 0 && (
              <div className="space-y-2">
                <Label>الامتحان النهائي (اختياري)</Label>
                <Select value={examId} onValueChange={setExamId}>
                  <SelectTrigger><SelectValue placeholder="تلقائي حسب الكورس" /></SelectTrigger>
                  <SelectContent>
                    {filteredExams.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الدرجة</Label>
                <Input type="number" min={0} value={score}
                  onChange={(e) => setScore(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>الإجمالي</Label>
                <Input type="number" min={1} value={totalPoints}
                  onChange={(e) => setTotalPoints(Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleIssue} disabled={submitting || loading} className="w-full">
            {submitting ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Award className="w-4 h-4 ml-2" />}
            إصدار الشهادة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ShareDialog = ({ cert, studentEmail }: { cert: Certificate; studentEmail?: string }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(studentEmail || '');
  const [phone, setPhone] = useState('');
  const percentage = Math.round((cert.score / cert.total_points) * 100);
  const publishedBase = window.location.origin;
  const shareText = `🏆 مبروك ${cert.student_name}!\n\nحصلت على شهادة إتمام دورة "${cert.course_title}" بنسبة ${percentage}%.\nرقم الشهادة: ${cert.certificate_number}\n\n${publishedBase}/dashboard/certificates`;

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(buildCertificateHtml(cert, percentage));
    w.document.close();
  };

  const handleEmail = () => {
    if (!email) return toast.error('أدخل البريد الإلكتروني');
    const subject = encodeURIComponent(`شهادة إتمام دورة ${cert.course_title}`);
    const body = encodeURIComponent(shareText);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    toast.success('تم فتح برنامج البريد');
  };

  const handleWhatsApp = () => {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned) return toast.error('أدخل رقم الواتساب');
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    toast.success('تم فتح الواتساب');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">مشاركة</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>مشاركة الشهادة</DialogTitle>
          <DialogDescription>
            {cert.student_name} — {cert.course_title} ({percentage}%)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 rounded bg-muted/50 text-sm whitespace-pre-line">{shareText}</div>

          <div className="space-y-2">
            <Label>إرسال بالبريد الإلكتروني</Label>
            <div className="flex gap-2">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com" />
              <Button onClick={handleEmail} variant="secondary">
                <Mail className="w-4 h-4 ml-2" />إرسال
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">سيُفتح برنامج البريد لديك مع الرسالة جاهزة.</p>
          </div>

          <div className="space-y-2">
            <Label>إرسال على واتساب</Label>
            <div className="flex gap-2">
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="201234567890 (مع كود الدولة)" />
              <Button onClick={handleWhatsApp} className="bg-[#25D366] hover:bg-[#1faa55] text-white">
                <MessageCircle className="w-4 h-4 ml-2" />إرسال
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">أدخل الرقم بدون + وبكود الدولة (مثل 20 لمصر).</p>
          </div>

          <Button onClick={handlePrint} variant="outline" className="w-full">
            <Printer className="w-4 h-4 ml-2" />طباعة / حفظ PDF
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            الشهادة محفوظة في لوحة تحكم الطالب تلقائياً ضمن "شهاداتي".
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AdminCertificatesPage = () => {
  const { role } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from('certificates').select('*')
      .order('issued_at', { ascending: false });
    const list = (data as Certificate[]) || [];
    setCerts(list);
    const userIds = [...new Set(list.map((c) => c.user_id))];
    if (userIds.length) {
      const { data: ps } = await supabase.from('profiles')
        .select('user_id, email').in('user_id', userIds);
      const map: Record<string, string> = {};
      (ps || []).forEach((p: any) => { map[p.user_id] = p.email; });
      setEmails(map);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه الشهادة؟')) return;
    const { error } = await supabase.from('certificates').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('تم الحذف');
    fetchAll();
  };

  const filtered = certs.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.student_name?.toLowerCase().includes(q)
      || c.course_title?.toLowerCase().includes(q)
      || c.certificate_number?.toLowerCase().includes(q);
  });

  if (role !== 'admin' && role !== 'instructor') {
    return <DashboardLayout><Card><CardContent className="py-12 text-center">
      صلاحياتك لا تسمح بعرض هذه الصفحة.
    </CardContent></Card></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Award className="w-7 h-7 text-amber-500" />
              إدارة الشهادات
            </h1>
            <p className="text-muted-foreground">إصدار الشهادات للطلاب ومشاركتها عبر الواتساب أو البريد</p>
          </div>
          <IssueCertificateDialog onIssued={fetchAll} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
              <span>كل الشهادات ({filtered.length})</span>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الكورس..." className="pr-9" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد شهادات بعد</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الطالب</TableHead>
                      <TableHead>الكورس</TableHead>
                      <TableHead>الدرجة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>رقم الشهادة</TableHead>
                      <TableHead className="text-left">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => {
                      const pct = Math.round((c.score / c.total_points) * 100);
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.student_name}</TableCell>
                          <TableCell>{c.course_title}</TableCell>
                          <TableCell>
                            <Badge variant={pct >= 50 ? 'default' : 'destructive'}>{pct}%</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(c.issued_at), 'dd MMM yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell className="text-xs font-mono">{c.certificate_number}</TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-end">
                              <ShareDialog cert={c} studentEmail={emails[c.user_id]} />
                              {role === 'admin' && (
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminCertificatesPage;
