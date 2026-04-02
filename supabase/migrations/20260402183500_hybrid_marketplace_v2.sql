-- Update products table for boosting
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMP WITH TIME ZONE;

-- Update profiles table for subscription and socialization
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'STANDARD' CHECK (subscription_type IN ('STANDARD', 'BOOSTED', 'PRO'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Update transactions table for transparency
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS gateway_fee INTEGER DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS platform_commission INTEGER DEFAULT 0;

-- Update orders table for Lomé zones 
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_zone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0;

-- Improved trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Generate unique referral code
  new_referral_code := UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8));

  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    whatsapp_number,
    referral_code,
    subscription_type
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'whatsapp_number',
    new_referral_code,
    'STANDARD'
  );

  -- Insert role
  IF (NEW.raw_user_meta_data->>'role' IS NOT NULL) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'buyer'::app_role);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
