-- Migration: Fix form crash by adding missing columns
-- Elite V1.3 Stabilization

ALTER TABLE IF EXISTS public.products 
ADD COLUMN IF NOT EXISTS is_rent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_zone TEXT;

COMMENT ON COLUMN public.products.is_rent IS 'Indique si le produit est à louer (Immobilier/Automobile)';
COMMENT ON COLUMN public.products.delivery_zone IS 'Quartier ou zone de livraison préférée spécifiée par le vendeur';
