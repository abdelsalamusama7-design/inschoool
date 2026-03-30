
-- Update admin1@gmail.com role to admin
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = 'db7ead9f-e879-4581-820d-e332d3e8f0c2';
