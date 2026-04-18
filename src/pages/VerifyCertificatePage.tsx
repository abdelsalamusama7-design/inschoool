import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldCheck, ShieldX, Award, Search, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface VerifiedCert {
  student_name: string;
  course_title: string;
  score: number;
  total_points: number;
  certificate_number: string;
  issued_at: string;
}

const VerifyCertificatePage = () => {
  const { certNumber } = useParams<{ certNumber?: string }>();
  const [searchValue, setSearchValue] = useState(certNumber || '');
  const [loading, setLoading] = useState(false);
  const [cert, setCert] = useState<VerifiedCert | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [academy, setAcademy] = useState('Instatech Academy');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'التحقق من الشهادة | Instatech Academy';
    (async () => {
      const { data } = await supabase
        .from('certificate_settings')
        .select('academy_name, logo_url')
        .limit(1)
        .maybeSingle();
      if (data) {
        setAcademy(data.academy_name || 'Instatech Academy');
        setLogoUrl(data.logo_url);
      }
    })();
  }, []);

  useEffect(() => {
    if (certNumber) verify(certNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certNumber]);

  const verify = async (number: string) => {
    setLoading(true);
    setCert(null);
    setNotFound(false);
    const trimmed = number.trim();
    if (!trimmed) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.rpc('verify_certificate_by_number', {
      _cert_number: trimmed,
    });
    setLoading(false);
    if (error || !data || data.length === 0) {
      setNotFound(true);
      return;
    }
    setCert(data[0] as VerifiedCert);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verify(searchValue);
  };

  const percentage = cert ? Math.round((cert.score / cert.total_points) * 100) : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          {logoUrl && <img src={logoUrl} alt="logo" className="mx-auto h-16 object-contain" />}
          <h1 className="text-3xl font-bold">{academy}</h1>
          <p className="text-muted-foreground">بوابة التحقق الرسمية من الشهادات</p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Search className="w-5 h-5" />
              التحقق من شهادة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="مثال: CERT-12ab34cd"
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تحقق'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        {loading && (
          <Card><CardContent className="py-10 flex justify-center">
            <Loader2 className="animate-spin" />
          </CardContent></Card>
        )}

        {!loading && notFound && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-8 text-center space-y-3">
              <ShieldX className="w-14 h-14 mx-auto text-destructive" />
              <h2 className="text-xl font-bold text-destructive">شهادة غير موجودة</h2>
              <p className="text-muted-foreground">
                لم يتم العثور على شهادة بهذا الرقم. يرجى التأكد من الرقم والمحاولة مرة أخرى.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && cert && (
          <Card className="border-2 border-green-500/40 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 text-center border-b border-green-500/20">
              <ShieldCheck className="w-14 h-14 mx-auto text-green-600 mb-2" />
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">شهادة موثّقة وصحيحة</h2>
              <p className="text-sm text-muted-foreground mt-1">
                هذه الشهادة صادرة رسمياً من {academy}
              </p>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-6 text-center space-y-3">
                <Award className="w-12 h-12 mx-auto text-amber-500" />
                <p className="text-muted-foreground text-sm">يُشهد بأن</p>
                <p className="text-2xl font-bold text-primary">{cert.student_name}</p>
                <p className="text-muted-foreground text-sm">قد أتم بنجاح دورة</p>
                <p className="text-lg font-semibold">{cert.course_title}</p>
                <Badge variant="default" className="text-base px-4 py-1">
                  {percentage}% ({cert.score}/{cert.total_points})
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">رقم الشهادة</p>
                  <p className="font-mono font-semibold">{cert.certificate_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">تاريخ الإصدار</p>
                  <p className="font-semibold">
                    {format(new Date(cert.issued_at), 'dd MMMM yyyy', { locale: ar })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للصفحة الرئيسية
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificatePage;
