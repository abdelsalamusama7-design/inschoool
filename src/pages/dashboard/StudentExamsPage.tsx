import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, CheckCircle, Loader2 } from 'lucide-react';

const StudentExamsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, { score: number; total_points: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    const [{ data: examsData }, { data: subsData }] = await Promise.all([
      supabase
        .from('exams')
        .select('id, title, description, duration_minutes, exam_type, course_id, courses:course_id(title)')
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('exam_submissions')
        .select('exam_id, score, total_points')
        .eq('user_id', user!.id)
        .not('submitted_at', 'is', null),
    ]);

    setExams(examsData || []);
    const subsMap: Record<string, { score: number; total_points: number }> = {};
    (subsData || []).forEach((s: any) => { subsMap[s.exam_id] = { score: s.score, total_points: s.total_points }; });
    setSubmissions(subsMap);
    setLoading(false);
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center p-8"><Loader2 className="animate-spin" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">الامتحانات</h1>
          <p className="text-muted-foreground">الامتحانات المتاحة لك</p>
        </div>

        {exams.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد امتحانات متاحة حالياً</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => {
              const sub = submissions[exam.id];
              const percentage = sub && sub.total_points > 0 ? Math.round((sub.score / sub.total_points) * 100) : null;
              return (
                <Card key={exam.id}>
                  <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{exam.title}</h3>
                        <Badge variant="outline">
                          {exam.exam_type === 'final' ? '🏆 نهائي' : '📝 نصفي'}
                        </Badge>
                      </div>
                      {exam.description && <p className="text-sm text-muted-foreground">{exam.description}</p>}
                      <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                        <span>الدورة: {exam.courses?.title || ''}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.duration_minutes} دقيقة</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {sub ? (
                        <>
                          <Badge variant={percentage! >= 50 ? 'default' : 'destructive'}>
                            <CheckCircle className="w-3 h-3 mr-1" />{percentage}% ({sub.score}/{sub.total_points})
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/exams/${exam.id}/take`)}>عرض النتيجة</Button>
                        </>
                      ) : (
                        <Button onClick={() => navigate(`/dashboard/exams/${exam.id}/take`)}>ابدأ الامتحان</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentExamsPage;
