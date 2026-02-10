
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS python_url text,
  ADD COLUMN IF NOT EXISTS python_instructions text,
  ADD COLUMN IF NOT EXISTS roblox_url text,
  ADD COLUMN IF NOT EXISTS roblox_instructions text,
  ADD COLUMN IF NOT EXISTS minecraft_url text,
  ADD COLUMN IF NOT EXISTS minecraft_instructions text;
