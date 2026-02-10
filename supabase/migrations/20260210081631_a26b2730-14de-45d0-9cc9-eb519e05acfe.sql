
ALTER TABLE public.payment_requests DROP CONSTRAINT payment_requests_payment_method_check;
ALTER TABLE public.payment_requests ADD CONSTRAINT payment_requests_payment_method_check CHECK (payment_method = ANY (ARRAY['vodafone_cash'::text, 'instapay'::text, 'fawry'::text, 'e_wallet'::text]));
