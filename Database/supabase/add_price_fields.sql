-- Add price and currency fields to products and pending_products tables
-- This migration adds the missing price and currency fields that are referenced in the API

-- Add price and currency fields to products table
ALTER TABLE public.products 
ADD COLUMN price DECIMAL(10,2) CHECK (price > 0 AND price <= 10000),
ADD COLUMN currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD'));

-- Add price and currency fields to pending_products table  
ALTER TABLE public.pending_products 
ADD COLUMN price DECIMAL(10,2) CHECK (price > 0 AND price <= 10000),
ADD COLUMN currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD'));

-- Add comments for documentation
COMMENT ON COLUMN public.products.price IS 'Product price in the specified currency';
COMMENT ON COLUMN public.products.currency IS 'Currency code for the price (USD, EUR, GBP, CAD, AUD)';
COMMENT ON COLUMN public.pending_products.price IS 'Product price in the specified currency';
COMMENT ON COLUMN public.pending_products.currency IS 'Currency code for the price (USD, EUR, GBP, CAD, AUD)';
