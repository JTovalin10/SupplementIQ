-- Add creatine dosage field to creatine_details table
-- This will store the actual amount of creatine in mg per serving

ALTER TABLE public.creatine_details 
ADD COLUMN creatine_dosage_mg INTEGER DEFAULT 0 CHECK (creatine_dosage_mg >= 0);

-- Add comment for documentation
COMMENT ON COLUMN public.creatine_details.creatine_dosage_mg IS 'Amount of creatine in mg per serving';

-- Update existing records with default values based on creatine type
-- For Creatine Monohydrate, set to 5000mg (5g) as a reasonable default
UPDATE public.creatine_details 
SET creatine_dosage_mg = 5000 
WHERE creatine_type_name = 'Creatine Monohydrate' AND creatine_dosage_mg = 0;

-- For other creatine types, set reasonable defaults
UPDATE public.creatine_details 
SET creatine_dosage_mg = 3000 
WHERE creatine_type_name != 'Creatine Monohydrate' AND creatine_dosage_mg = 0;