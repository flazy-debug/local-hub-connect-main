
-- Add promo_price to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promo_price integer DEFAULT NULL;

-- Add delivery proof columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_proof_image text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_proof_note text DEFAULT NULL;

-- Create disputes table
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  buyer_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_response text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers can create disputes" ON public.disputes FOR INSERT TO public WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can view own disputes" ON public.disputes FOR SELECT TO public USING (auth.uid() = buyer_id);
CREATE POLICY "Admins can view all disputes" ON public.disputes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update disputes" ON public.disputes FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Create wishlist table
CREATE TABLE public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wishlist" ON public.wishlist FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can add to wishlist" ON public.wishlist FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from wishlist" ON public.wishlist FOR DELETE TO public USING (auth.uid() = user_id);

-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  code text NOT NULL,
  discount_percent integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  uses_count integer NOT NULL DEFAULT 0,
  max_uses integer DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (code)
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active promo codes" ON public.promo_codes FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Sellers can manage own codes" ON public.promo_codes FOR INSERT TO public WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own codes" ON public.promo_codes FOR UPDATE TO public USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own codes" ON public.promo_codes FOR DELETE TO public USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can view own codes" ON public.promo_codes FOR SELECT TO public USING (auth.uid() = seller_id);
