import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Award, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { printCertificate } from '@/lib/certificateTemplate';

interface Certificate {
  id: string;
  student_name: string;
  course_title: string;
  score: number;
  total_points: number;
  certificate_number: string;
  issued_at: string;
}

const CertificateCard = ({ cert }: { cert: Certificate }) => {
  const percentage = Math.round((cert.score / cert.total_points) * 100);

  const handleDownload = () => {
    printCertificate(cert);
  };

  return (
    <Card className="overflow-hidden">
      {/* Mini certificate preview */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-b-4 border-amber-400 p-8 text-center space-y-3">
        <Award className="w-12 h-12 mx-auto text-amber-500" />
        <h3 className="text-xl font-bold">شهادة إتمام</h3>
        <p className="text-2xl font-bold text-primary">{cert.student_name}</p>
        <p className="text-muted-foreground">أتم بنجاح دورة</p>
        <p className="text-lg font-semibold">{cert.course_title}</p>
        <Badge variant="default" className="text-base px-4 py-1">
          {percentage}%
        </Badge>
      </div>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <p>{format(new Date(cert.issued_at), 'dd MMMM yyyy', { locale: ar })}</p>
          <p className="text-xs">{cert.certificate_number}</p>
        </div>
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="w-4 h-4 ml-2" />
          طباعة / تحميل
        </Button>
      </CardContent>
    </Card>
  );
};

const CertificatesPage = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCertificates();
  }, [user]);

  const fetchCertificates = async () => {
    const { data } = await supabase
      .from('certificates')
      .select('*')
      .order('issued_at', { ascending: false });
    setCertificates((data as Certificate[]) || []);
    setLoading(false);
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center p-8"><Loader2 className="animate-spin" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">شهاداتي</h1>
          <p className="text-muted-foreground">الشهادات التي حصلت عليها بعد اجتياز الامتحانات النهائية</p>
        </div>

        {certificates.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد شهادات بعد. اجتز الامتحان النهائي لأي دورة للحصول على شهادة!</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {certificates.map(cert => (
              <CertificateCard key={cert.id} cert={cert} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CertificatesPage;
