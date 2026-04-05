-- Migration: Add specialized fields for Immobilier, Automobile and Services
-- Elite V1.2.1

ALTER TABLE IF EXISTS products 
ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'vente', -- 'vente', 'location', 'service'
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb; -- { "year": 2024, "km": 15000, "surface": 300, "rooms": 4, etc. }

COMMENT ON COLUMN products.transaction_type IS 'Type de transaction spécialisé pour les tunnels Immobilier et Automobile';
COMMENT ON COLUMN products.specifications IS 'Données techniques dynamiques par catégorie';

-- Update existing products if needed (optional)
UPDATE products SET transaction_type = 'service' WHERE category IN ('Expertise & Services', 'Services Informatiques');
