-- Storage bucket for certificate logo & signature
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificate-assets', 'certificate-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read on this bucket
CREATE POLICY "Public read certificate assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificate-assets');

CREATE POLICY "Admins can upload certificate assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificate-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update certificate assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificate-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete certificate assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'certificate-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Settings table (single-row pattern)
CREATE TABLE public.certificate_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  signature_url TEXT,
  signer_name TEXT,
  signer_title TEXT,
  academy_name TEXT DEFAULT 'Instatech Academy',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.certificate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read settings"
ON public.certificate_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.certificate_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed a default row
INSERT INTO public.certificate_settings (academy_name) VALUES ('Instatech Academy');

-- Trigger to update updated_at
CREATE TRIGGER trg_certificate_settings_updated_at
BEFORE UPDATE ON public.certificate_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
