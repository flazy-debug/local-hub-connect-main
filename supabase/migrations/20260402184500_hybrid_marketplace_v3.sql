-- Migration v3: Hybrid Marketplace Partner & Media Logic
-- Target Table: profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_type_check;
ALTER TABLE public.profiles ALTER COLUMN subscription_type SET DEFAULT 'STANDARD';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_type_check 
  CHECK (subscription_type IN ('STANDARD', 'BOOSTED', 'PRO', 'PARTNER'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner_markup_percent FLOAT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_number_verified BOOLEAN DEFAULT false;

-- Target Table: products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_price INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Update is_approved default for PARTNER products (logic should handle this in app, 
-- but we can set a fallback)
COMMENT ON COLUMN public.products.is_approved IS 'Sellers products are auto-approved, Partners need admin approval';

-- Social links are already present from v2, but let's ensure consistency
-- We keep facebook_url, instagram_url, tiktok_url as they were already added.
