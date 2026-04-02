-- Migration v4: Product Boost System
-- Target Table: products

-- Add columns for boosting
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS boost_expiry TIMESTAMP WITH TIME ZONE;

-- Add index for performance on filtering boosted products
CREATE INDEX IF NOT EXISTS products_is_boosted_idx ON public.products(is_boosted) WHERE is_boosted = true;

COMMENT ON COLUMN public.products.is_boosted IS 'True if the seller has paid for a visibility boost';
COMMENT ON COLUMN public.products.boost_expiry IS 'Timestamp when the boost visibility expires';
