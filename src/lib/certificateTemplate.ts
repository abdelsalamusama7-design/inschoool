import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

export interface CertificateData {
  student_name: string;
  course_title: string;
  score: number;
  total_points: number;
  certificate_number: string;
  issued_at: string;
}

export interface CertificateSettings {
  logo_url: string | null;
  signature_url: string | null;
  signer_name: string | null;
  signer_title: string | null;
  academy_name: string | null;
}

let cachedSettings: CertificateSettings | null = null;
let cachedAt = 0;

export const fetchCertificateSettings = async (force = false): Promise<CertificateSettings> => {
  if (!force && cachedSettings && Date.now() - cachedAt < 60_000) return cachedSettings;
  const { data } = await supabase
    .from('certificate_settings')
    .select('logo_url, signature_url, signer_name, signer_title, academy_name')
    .limit(1)
    .maybeSingle();
  cachedSettings = (data as CertificateSettings) || {
    logo_url: null,
    signature_url: null,
    signer_name: null,
    signer_title: null,
    academy_name: 'Instatech Academy',
  };
  cachedAt = Date.now();
  return cachedSettings;
};

export const buildCertificateHtml = async (
  cert: CertificateData,
  settings: CertificateSettings
): Promise<string> => {
  const percentage = Math.round((cert.score / cert.total_points) * 100);
  const academy = settings.academy_name || 'Instatech Academy';
  const dateStr = format(new Date(cert.issued_at), 'dd MMMM yyyy', { locale: ar });

  const verifyUrl = `${window.location.origin}/verify/${cert.certificate_number}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 120 });

  const logoBlock = settings.logo_url
    ? `<img src="${settings.logo_url}" alt="logo" class="logo" crossorigin="anonymous" />`
    : '';

  const signatureBlock = settings.signature_url || settings.signer_name
    ? `<div class="signature-block">
         ${settings.signature_url ? `<img src="${settings.signature_url}" alt="signature" class="signature" crossorigin="anonymous" />` : '<div class="signature-line"></div>'}
         <div class="signer-name">${settings.signer_name || ''}</div>
         <div class="signer-title">${settings.signer_title || ''}</div>
       </div>`
    : '';

  return `
<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8" /><title>شهادة - ${cert.course_title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; }
  .cert { width: 850px; padding: 50px 60px; background: white; border: 8px double #d4af37; position: relative; text-align: center; }
  .cert::before { content: ''; position: absolute; inset: 12px; border: 2px solid #d4af37; pointer-events: none; }
  .header { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 12px; }
  .logo { max-height: 70px; max-width: 140px; object-fit: contain; }
  .academy { color: #1e40af; font-size: 18px; font-weight: 600; }
  .cert h1 { color: #d4af37; font-size: 36px; margin: 8px 0; }
  .cert h2 { color: #1f2937; font-size: 24px; margin: 16px 0 8px; }
  .cert .name { color: #1e40af; font-size: 32px; font-weight: bold; margin: 14px 0; border-bottom: 2px solid #d4af37; display: inline-block; padding: 0 24px 8px; }
  .cert .course { color: #1f2937; font-size: 22px; font-weight: 600; margin: 10px 0; }
  .cert .score { color: #059669; font-size: 18px; margin: 10px 0; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding: 0 20px; gap: 16px; }
  .signature-block { text-align: center; min-width: 180px; }
  .signature { max-height: 60px; max-width: 180px; object-fit: contain; margin-bottom: 4px; }
  .signature-line { width: 180px; border-top: 1px solid #6b7280; margin-bottom: 4px; }
  .signer-name { font-weight: 600; color: #1f2937; font-size: 14px; }
  .signer-title { color: #6b7280; font-size: 12px; }
  .date-block { text-align: center; min-width: 180px; }
  .date-label { color: #6b7280; font-size: 12px; }
  .date-value { color: #1f2937; font-weight: 600; font-size: 14px; margin-top: 4px; }
  .qr-block { text-align: center; }
  .qr-block img { width: 90px; height: 90px; }
  .qr-block .qr-label { font-size: 10px; color: #6b7280; margin-top: 2px; }
  .number { color: #9ca3af; font-size: 11px; margin-top: 16px; word-break: break-all; }
  @media print { body { background: white; padding: 0; } .cert { border-width: 4px; } }
</style></head><body>
<div class="cert">
  <div class="header">
    ${logoBlock}
    <div class="academy">${academy}</div>
  </div>
  <h1>🏆 شهادة إتمام</h1>
  <h2>يُشهد بأن</h2>
  <div class="name">${cert.student_name}</div>
  <p style="color:#374151;font-size:16px;">قد أتم بنجاح دورة</p>
  <div class="course">${cert.course_title}</div>
  <div class="score">بنتيجة ${percentage}% (${cert.score}/${cert.total_points})</div>

  <div class="footer">
    ${signatureBlock || '<div></div>'}
    <div class="qr-block">
      <img src="${qrDataUrl}" alt="QR" />
      <div class="qr-label">امسح للتحقق</div>
    </div>
    <div class="date-block">
      <div class="date-label">تاريخ الإصدار</div>
      <div class="date-value">${dateStr}</div>
    </div>
  </div>
  <div class="number">رقم الشهادة: ${cert.certificate_number} • تحقق على: ${window.location.origin}/verify/${cert.certificate_number}</div>
</div>
<script>setTimeout(() => window.print(), 600);</script>
</body></html>`;
};

export const printCertificate = async (cert: CertificateData) => {
  const settings = await fetchCertificateSettings();
  const html = await buildCertificateHtml(cert, settings);
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
};
