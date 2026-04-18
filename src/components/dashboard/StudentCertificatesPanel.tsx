import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CertificateRow {
  id: string;
  course_title: string;
  score: number;
  total_points: number;
  certificate_number: string;
  issued_at: string;
}

const StudentCertificatesPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certs, setCerts] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('certificates')
        .select('id, course_title, score, total_points, certificate_number, issued_at')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false })
        .limit(3);
      setCerts((data as CertificateRow[]) || []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            شهاداتي
          </CardTitle>
          <CardDescription>الشهادات التي حصلت عليها بعد اجتياز الامتحانات النهائية</CardDescription>
        </div>
        {certs.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/certificates')}>
            عرض الكل
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin" /></div>
        ) : certs.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              لا توجد شهادات بعد. اجتز الامتحان النهائي لأي دورة للحصول على شهادة معتمدة!
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {certs.map(cert => {
              const percentage = Math.round((cert.score / cert.total_points) * 100);
              return (
                <div
                  key={cert.id}
                  onClick={() => navigate('/dashboard/certificates')}
                  className="cursor-pointer rounded-lg border-2 border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-4 text-center space-y-2 hover:shadow-md transition-shadow"
                >
                  <Award className="w-8 h-8 mx-auto text-amber-500" />
                  <p className="font-semibold text-sm line-clamp-2">{cert.course_title}</p>
                  <Badge variant="default" className="text-xs">{percentage}%</Badge>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(cert.issued_at), 'dd MMM yyyy', { locale: ar })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentCertificatesPanel;
