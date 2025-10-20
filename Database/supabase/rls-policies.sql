-- Row Level Security (RLS) Policies for SupplementIQ
-- Run this after your main schema.sql

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner', 'moderator')
    )
  );

CREATE POLICY "Admins can update user roles" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Products table policies
CREATE POLICY "Anyone can read products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Moderators can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('moderator', 'admin', 'owner')
    )
  );

-- Brands table policies
CREATE POLICY "Anyone can read brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Moderators can manage brands" ON public.brands
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('moderator', 'admin', 'owner')
    )
  );

-- Temporary products policies
CREATE POLICY "Users can read own submissions" ON public.temporary_products
  FOR SELECT USING (auth.uid() = submitted_by);

CREATE POLICY "Users can create submissions" ON public.temporary_products
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Moderators can manage all submissions" ON public.temporary_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('moderator', 'admin', 'owner')
    )
  );

-- Product reviews policies
CREATE POLICY "Anyone can read reviews" ON public.product_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.product_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- User badges policies
CREATE POLICY "Users can read own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage badges" ON public.user_badges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Detail tables policies (for temp_product_id access)
ALTER TABLE public.preworkout_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_stim_preworkout_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_drink_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protein_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amino_acid_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fat_burner_details ENABLE ROW LEVEL SECURITY;

-- Detail tables: allow reading if user owns the temp product or is moderator+
CREATE POLICY "Users can read own temp product details" ON public.preworkout_details
  FOR SELECT USING (
    temp_product_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.temporary_products 
      WHERE id = temp_product_id 
      AND submitted_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('moderator', 'admin', 'owner')
    )
  );

-- Apply same policy to all detail tables
CREATE POLICY "Users can read own temp product details" ON public.non_stim_preworkout_details
  FOR SELECT USING (
    temp_product_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.temporary_products 
      WHERE id = temp_product_id 
      AND submitted_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('moderator', 'admin', 'owner')
    )
  );

CREATE POLICY "Users can read own temp product details" ON public.energy_drink_details
  FOR SELECT USING (
    temp_product_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.temporary_products 
      WHERE id = temp_product_id 
      AND submitted_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('moderator', 'admin', 'owner')
    )
  );

CREATE POLICY "Users can read own temp product details" ON public.protein_details
  FOR SELECT USING (
    temp_product_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.temporary_products 
      WHERE id = temp_product_id 
      AND submitted_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('moderator', 'admin', 'owner')
    )
  );

CREATE POLICY "Users can read own temp product details" ON public.amino_acid_details
  FOR SELECT USING (
    temp_product_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.temporary_products 
      WHERE id = temp_product_id 
      AND submitted_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('moderator', 'admin', 'owner')
    )
  );

CREATE POLICY "Users can read own temp product details" ON public.fat_burner_details
  FOR SELECT USING (
    temp_product_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.temporary_products 
      WHERE id = temp_product_id 
      AND submitted_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('moderator', 'admin', 'owner')
    )
  );
