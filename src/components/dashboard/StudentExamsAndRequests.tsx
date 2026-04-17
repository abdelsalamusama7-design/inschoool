import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, AlertCircle, Loader2, Receipt } from 'lucide-react';

interface ExamRow {
  id: string;
  title: string;
  exam_type: string;
  duration_minutes: number;
  course_title: string | null;
  submitted: boolean;
  score: number | null;
  total_points: number | null;
}

interface PaymentRequestRow {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method: string;
  admin_notes: string | null;
  plan_name: string;
}

const StudentExamsAndRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [requests, setRequests] = useState<PaymentRequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    setLoading(true);

    const [examsRes, subsRes, reqRes] = await Promise.all([
      supabase
        .from('exams')
        .select('id, title, exam_type, duration_minutes, course_id, lesson_id, courses:course_id(title), lessons:lesson_id(courses:course_id(title))')
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('exam_submissions')
        .select('exam_id, score, total_points, submitted_at')
        .eq('user_id', user!.id)
        .not('submitted_at', 'is', null),
      supabase
        .from('payment_requests')
        .select('id, amount, status, created_at, payment_method, admin_notes, subscription_plans:plan_id(name_ar)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const subMap = new Map((subsRes.data || []).map((s: any) => [s.exam_id, s]));
    const examRows: ExamRow[] = (examsRes.data || []).map((e: any) => {
      const sub = subMap.get(e.id);
      return {
        id: e.id,
        title: e.title,
        exam_type: e.exam_type,
        duration_minutes: e.duration_minutes,
        course_title: e.courses?.title || e.lessons?.courses?.title || null,
        submitted: !!sub,
        score: sub?.score ?? null,
        total_points: sub?.total_points ?? null,
      };
    });

    const reqRows: PaymentRequestRow[] = (reqRes.data || []).map((r: any) => ({
      id: r.id,
      amount: r.amount,
      status: r.status,
      created_at: r.created_at,
      payment_method: r.payment_method,
      admin_notes: r.admin_notes,
      plan_name: r.subscription_plans?.name_ar || 'باقة',
    }));

    setExams(examRows);
    setRequests(reqRows);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardContent className="p-10 flex justify-center"><Loader2 className="animate-spin" /></CardContent></Card>
        <Card><CardContent className="p-10 flex justify-center"><Loader2 className="animate-spin" /></CardContent></Card>
      </div>
    );
  }

  const renderRequestStatus = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle className="w-3 h-3 ml-1" />تمت الموافقة</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 ml-1" />قيد المراجعة</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 ml-1" />مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Available Exams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            الامتحانات المتاحة
          </CardTitle>
          <CardDescription>الامتحانات التي فتحها لك الأدمن</CardDescription>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد امتحانات متاحة حالياً</p>
          ) : (
            <div className="space-y-3">
              {exams.slice(0, 5).map((e) => {
                const pct = e.total_points ? Math.round(((e.score || 0) / e.total_points) * 100) : 0;
                return (
                  <div key={e.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium truncate">{e.title}</p>
                        <Badge variant={e.exam_type === 'final' ? 'default' : 'secondary'} className="text-[10px]">
                          {e.exam_type === 'final' ? 'نهائي' : 'نصفي'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {e.course_title || '—'} · {e.duration_minutes} دقيقة
                      </p>
                    </div>
                    {e.submitted ? (
                      <div className="text-center shrink-0">
                        <Badge className="bg-primary/10 text-primary border-primary/20">{pct}%</Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">تم التسليم</p>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => navigate(`/dashboard/exams/${e.id}/take`)}>
                        ابدأ
                      </Button>
                    )}
                  </div>
                );
              })}
              {exams.length > 5 && (
                <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard/student-exams')}>
                  عرض كل الامتحانات ({exams.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Requests Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            طلبات الاشتراك
          </CardTitle>
          <CardDescription>حالة طلبات الدفع التي قدمتها</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">لم تقدم أي طلبات اشتراك بعد</p>
              <Button size="sm" onClick={() => navigate('/dashboard/subscription')}>اشترك الآن</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.plan_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.amount} جنيه · {r.payment_method} · {new Date(r.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    {renderRequestStatus(r.status)}
                  </div>
                  {r.admin_notes && r.status === 'rejected' && (
                    <p className="text-xs text-destructive bg-destructive/5 rounded p-2">
                      ملاحظات الأدمن: {r.admin_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentExamsAndRequests;
