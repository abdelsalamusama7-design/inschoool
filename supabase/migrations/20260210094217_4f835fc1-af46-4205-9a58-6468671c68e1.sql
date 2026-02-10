
-- Add lab enable columns for Python, Roblox, Minecraft
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS python_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS roblox_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS minecraft_enabled boolean NOT NULL DEFAULT false;
