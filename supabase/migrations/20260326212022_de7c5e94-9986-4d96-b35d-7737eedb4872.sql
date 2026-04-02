
-- Add subscription_type to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_type text NOT NULL DEFAULT 'commission';
