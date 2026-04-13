import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Award, Download } from 'lucide-react';
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
}

const CertificateCard = ({ cert }: { cert: Certificate }) => {
  const certRef = useRef<HTMLDivElement>(null);
  const percentage = Math.round((cert.score / cert.total_points) * 100);

  const handleDownload = () => {
    const el = certRef.current;
    if (!el) return;
    // Open print dialog for the certificate
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl"><head><title>شهادة - ${cert.course_title}</title>
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
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <Card className="overflow-hidden">
      {/* Mini certificate preview */}
      <div ref={certRef} className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-b-4 border-amber-400 p-8 text-center space-y-3">
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
