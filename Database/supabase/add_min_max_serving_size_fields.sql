-- Add min and max serving size fields to pending_products and products tables
-- These represent the number of scoops/pills (decimals for powders, integers for pills/bars)

-- 1. Add min_serving_size column to pending_products table
ALTER TABLE public.pending_products 
ADD COLUMN min_serving_size DECIMAL(5,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.pending_products.min_serving_size IS 'Minimum recommended serving size (e.g., 1 scoop, 2 pills) - decimals allowed for powders';

-- 2. Add max_serving_size column to pending_products table
ALTER TABLE public.pending_products 
ADD COLUMN max_serving_size DECIMAL(5,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.pending_products.max_serving_size IS 'Maximum recommended serving size (e.g., 3 scoops, 6 pills) - decimals allowed for powders';

-- 3. Add min_serving_size column to products table (for approved products)
ALTER TABLE public.products 
ADD COLUMN min_serving_size DECIMAL(5,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.products.min_serving_size IS 'Minimum recommended serving size (e.g., 1 scoop, 2 pills) - decimals allowed for powders';

-- 4. Add max_serving_size column to products table (for approved products)
ALTER TABLE public.products 
ADD COLUMN max_serving_size DECIMAL(5,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.products.max_serving_size IS 'Maximum recommended serving size (e.g., 3 scoops, 6 pills) - decimals allowed for powders';

-- 5. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pending_products_min_serving_size ON public.pending_products(min_serving_size);
CREATE INDEX IF NOT EXISTS idx_pending_products_max_serving_size ON public.pending_products(max_serving_size);
CREATE INDEX IF NOT EXISTS idx_products_min_serving_size ON public.products(min_serving_size);
CREATE INDEX IF NOT EXISTS idx_products_max_serving_size ON public.products(max_serving_size);

-- 6. Add constraints to ensure positive values
ALTER TABLE public.pending_products 
ADD CONSTRAINT chk_min_serving_size CHECK (min_serving_size IS NULL OR min_serving_size > 0);

ALTER TABLE public.pending_products 
ADD CONSTRAINT chk_max_serving_size CHECK (max_serving_size IS NULL OR max_serving_size > 0);

ALTER TABLE public.products 
ADD CONSTRAINT chk_products_min_serving_size CHECK (min_serving_size IS NULL OR min_serving_size > 0);

ALTER TABLE public.products 
ADD CONSTRAINT chk_products_max_serving_size CHECK (max_serving_size IS NULL OR max_serving_size > 0);

-- 7. Add constraint to ensure max >= min when both are set
ALTER TABLE public.pending_products 
ADD CONSTRAINT chk_serving_size_range CHECK (
  min_serving_size IS NULL OR 
  max_serving_size IS NULL OR 
  max_serving_size >= min_serving_size
);

ALTER TABLE public.products 
ADD CONSTRAINT chk_products_serving_size_range CHECK (
  min_serving_size IS NULL OR 
  max_serving_size IS NULL OR 
  max_serving_size >= min_serving_size
);
