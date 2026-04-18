import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Upload, ImageIcon, PenTool, Save, Trash2 } from 'lucide-react';
import { fetchCertificateSettings } from '@/lib/certificateTemplate';

interface Settings {
  id?: string;
  logo_url: string | null;
  signature_url: string | null;
  signer_name: string | null;
  signer_title: string | null;
  academy_name: string | null;
}

const CertificateSettingsCard = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    logo_url: null,
    signature_url: null,
    signer_name: '',
    signer_title: '',
    academy_name: 'Instatech Academy',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'signature' | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('certificate_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (data) setSettings(data as Settings);
      setLoading(false);
    })();
  }, []);

  const uploadFile = async (file: File, kind: 'logo' | 'signature') => {
    if (!file.type.startsWith('image/')) {
      toast.error('الملف يجب أن يكون صورة');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت');
      return;
    }
    setUploading(kind);
    const ext = file.name.split('.').pop() || 'png';
    const path = `${kind}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('certificate-assets')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (uploadError) {
      setUploading(null);
      toast.error(uploadError.message);
      return;
    }

    const { data: pub } = supabase.storage.from('certificate-assets').getPublicUrl(path);
    const url = pub.publicUrl;

    setSettings((prev) => ({
      ...prev,
      [kind === 'logo' ? 'logo_url' : 'signature_url']: url,
    }));
    setUploading(null);
    toast.success(`تم رفع ${kind === 'logo' ? 'الشعار' : 'التوقيع'}`);
  };

  const removeAsset = (kind: 'logo' | 'signature') => {
    setSettings((prev) => ({
      ...prev,
      [kind === 'logo' ? 'logo_url' : 'signature_url']: null,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      logo_url: settings.logo_url,
      signature_url: settings.signature_url,
      signer_name: settings.signer_name,
      signer_title: settings.signer_title,
      academy_name: settings.academy_name,
      updated_by: user?.id,
    };

    let error;
    if (settings.id) {
      ({ error } = await supabase
        .from('certificate_settings')
        .update(payload)
        .eq('id', settings.id));
    } else {
      const { data, error: insertError } = await supabase
        .from('certificate_settings')
        .insert(payload)
        .select()
        .single();
      error = insertError;
      if (data) setSettings(data as Settings);
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    await fetchCertificateSettings(true); // refresh cache
    toast.success('تم حفظ الإعدادات. ستُطبق على جميع الشهادات الجديدة والمطبوعة.');
  };

  if (loading) {
    return (
      <Card><CardContent className="py-10 flex justify-center">
        <Loader2 className="animate-spin" />
      </CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="w-5 h-5" />
          إعدادات الشهادات
        </CardTitle>
        <CardDescription>
          ارفع شعار المنصة وتوقيع المسؤول، وستظهر تلقائياً على جميع الشهادات عند الطباعة.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo */}
        <div className="space-y-2">
          <Label>شعار المنصة</Label>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-32 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'logo')} />
            <Button variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploading === 'logo'}>
              {uploading === 'logo' ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Upload className="w-4 h-4 ml-2" />}
              رفع شعار
            </Button>
            {settings.logo_url && (
              <Button variant="ghost" size="icon" onClick={() => removeAsset('logo')}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>

        {/* Signature */}
        <div className="space-y-2">
          <Label>توقيع المسؤول (صورة بخلفية شفافة مفضلة)</Label>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-40 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
              {settings.signature_url ? (
                <img src={settings.signature_url} alt="signature" className="max-w-full max-h-full object-contain" />
              ) : (
                <PenTool className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <input ref={sigInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'signature')} />
            <Button variant="outline" onClick={() => sigInputRef.current?.click()} disabled={uploading === 'signature'}>
              {uploading === 'signature' ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Upload className="w-4 h-4 ml-2" />}
              رفع توقيع
            </Button>
            {settings.signature_url && (
              <Button variant="ghost" size="icon" onClick={() => removeAsset('signature')}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>اسم الموقّع</Label>
            <Input value={settings.signer_name || ''}
              onChange={(e) => setSettings({ ...settings, signer_name: e.target.value })}
              placeholder="مثال: د. أحمد محمد" />
          </div>
          <div className="space-y-2">
            <Label>المسمى الوظيفي</Label>
            <Input value={settings.signer_title || ''}
              onChange={(e) => setSettings({ ...settings, signer_title: e.target.value })}
              placeholder="مثال: المدير الأكاديمي" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>اسم المنصة على الشهادة</Label>
          <Input value={settings.academy_name || ''}
            onChange={(e) => setSettings({ ...settings, academy_name: e.target.value })}
            placeholder="Instatech Academy" />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
          حفظ الإعدادات
        </Button>
      </CardContent>
    </Card>
  );
};

export default CertificateSettingsCard;
