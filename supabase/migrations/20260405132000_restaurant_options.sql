-- Add options JSONB column to products for restaurant customization
ALTER TABLE IF EXISTS public.products 
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '{"variants": [], "extras": []}'::JSONB;

-- Add comment for clarity
COMMENT ON COLUMN public.products.options IS 'Flexible options for restaurant products (variants, extras, etc.)';
