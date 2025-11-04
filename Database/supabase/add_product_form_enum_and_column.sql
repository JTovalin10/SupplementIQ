-- Add product form enum and column to pending_products and products tables
-- This allows tracking the physical form of supplements (powder, pill, bar, etc.)

-- 1. Create the product form enum
CREATE TYPE product_form_enum AS ENUM (
    'powder',      -- Powders: Pre-workouts, protein, creatine, BCAA powders (mixed with water)
    'pill',        -- Pills: Multivitamins, sleep aids, fat burners, nootropics (swallowed whole)
    'bar',         -- Bars: Protein bars, energy bars, meal replacement bars (solid food form)
    'liquid',      -- Liquid: Fish oil, liquid pre-workouts, liquid supplements (drinkable)
    'capsule',     -- Capsules: Fish oil, joint support, sleep aids (gelatin/vegetable capsules)
    'tablet',      -- Tablets: Individual vitamins (Vitamin D, Magnesium, Ashwagandha) (compressed powder)
    'drink',       -- Drinks: Ready-to-drink protein shakes, energy drinks (pre-mixed beverages)
    'energy_shot'  -- Energy Shots: Concentrated energy shots like 5-Hour Energy (small 2-3oz bottles)
);

-- 2. Add product_form column to pending_products table
ALTER TABLE public.pending_products 
ADD COLUMN product_form product_form_enum DEFAULT 'powder';

-- Add comment for documentation
COMMENT ON COLUMN public.pending_products.product_form IS 'Physical form of the supplement product (powder, pill, bar, etc.)';

-- 3. Add product_form column to products table (for approved products)
ALTER TABLE public.products 
ADD COLUMN product_form product_form_enum DEFAULT 'powder';

-- Add comment for documentation
COMMENT ON COLUMN public.products.product_form IS 'Physical form of the supplement product (powder, pill, bar, etc.)';

-- 4. Update existing records to have default 'powder' form
UPDATE public.pending_products 
SET product_form = 'powder' 
WHERE product_form IS NULL;

UPDATE public.products 
SET product_form = 'powder' 
WHERE product_form IS NULL;

-- 5. Add indexes for better query performance
CREATE INDEX idx_pending_products_product_form ON public.pending_products(product_form);
CREATE INDEX idx_products_product_form ON public.products(product_form);

-- 6. Optional: Add constraint to ensure product_form is not null
ALTER TABLE public.pending_products 
ALTER COLUMN product_form SET NOT NULL;

ALTER TABLE public.products 
ALTER COLUMN product_form SET NOT NULL;
