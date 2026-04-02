
-- Allow authenticated users to insert their own role (for seller registration)
CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow buyers to update their own orders (for confirming reception)
CREATE POLICY "Buyers can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = buyer_id);

-- Allow system to insert transactions (via authenticated users)
CREATE POLICY "Authenticated can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow updating transactions when order is confirmed
CREATE POLICY "Sellers or system can update transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = seller_id);
