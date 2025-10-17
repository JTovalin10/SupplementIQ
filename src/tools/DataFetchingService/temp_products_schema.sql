-- Temporary Products Table Schema
-- This table mirrors the main products table but includes a status field for approval workflow

-- Drop existing enum if it exists
DROP TYPE IF EXISTS product_approval_status CASCADE;

-- Create enum for approval status
CREATE TYPE product_approval_status AS ENUM ('pending', 'accepted', 'denied');

-- Create temporary products table
CREATE TABLE IF NOT EXISTS public.temporary_products (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES public.brands(id),
    category product_category NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    release_year smallint DEFAULT NULL,
    image_url TEXT,
    description TEXT,
    servings_per_container INTEGER,
    price decimal(5,2) NOT NULL,
    serving_size_g DECIMAL(5,2),
    transparency_score INTEGER DEFAULT 0 CHECK (transparency_score BETWEEN 0 AND 100),
    confidence_level TEXT DEFAULT 'estimated' CHECK (confidence_level IN ('verified', 'likely', 'estimated', 'unknown')),
    
    -- Approval workflow fields
    status product_approval_status DEFAULT 'pending',
    submitted_by UUID REFERENCES public.users(id),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A')
    ) STORED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_temporary_products_status ON public.temporary_products (status);
CREATE INDEX IF NOT EXISTS idx_temporary_products_submitted_by ON public.temporary_products (submitted_by);
CREATE INDEX IF NOT EXISTS idx_temporary_products_category ON public.temporary_products (category);
CREATE INDEX IF NOT EXISTS idx_temporary_products_brand_id ON public.temporary_products (brand_id);
CREATE INDEX IF NOT EXISTS idx_temporary_products_submitted_at ON public.temporary_products (submitted_at);
CREATE INDEX IF NOT EXISTS idx_temporary_products_search_vector ON public.temporary_products USING GIN (search_vector);

-- Create temporary product detail tables (mirror main detail tables)
CREATE TABLE IF NOT EXISTS public.temporary_preworkout_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.temporary_products(id) ON DELETE CASCADE,
    serving_scoops INTEGER,
    serving_g NUMERIC(5,1),
    sugar_g INTEGER NOT NULL DEFAULT 0 CHECK (sugar_g >= 0 OR sugar_g = -1),
    key_features TEXT[] DEFAULT array['pump','endurance','focus','power'],
    l_citrulline_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_citrulline_mg >= 0 OR l_citrulline_mg = -1),
    creatine_monohydrate_mg INTEGER NOT NULL DEFAULT 0 CHECK (creatine_monohydrate_mg >= 0 OR creatine_monohydrate_mg = -1),
    glycerpump_mg INTEGER NOT NULL DEFAULT 0 CHECK (glycerpump_mg >= 0 OR glycerpump_mg = -1),
    betaine_anhydrous_mg INTEGER NOT NULL DEFAULT 0 CHECK (betaine_anhydrous_mg >= 0 OR betaine_anhydrous_mg = -1),
    agmatine_sulfate_mg INTEGER NOT NULL DEFAULT 0 CHECK (agmatine_sulfate_mg >= 0 OR agmatine_sulfate_mg = -1),
    l_tyrosine_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_tyrosine_mg >= 0 OR l_tyrosine_mg = -1),
    caffeine_anhydrous_mg INTEGER NOT NULL DEFAULT 0 CHECK (caffeine_anhydrous_mg >= 0 OR caffeine_anhydrous_mg = -1),
    n_phenethyl_dimethylamine_citrate_mg INTEGER NOT NULL DEFAULT 0 CHECK (n_phenethyl_dimethylamine_citrate_mg >= 0 OR n_phenethyl_dimethylamine_citrate_mg = -1),
    kanna_extract_mg INTEGER NOT NULL DEFAULT 0 CHECK (kanna_extract_mg >= 0 OR kanna_extract_mg = -1),
    huperzine_a_mcg INTEGER NOT NULL DEFAULT 0 CHECK (huperzine_a_mcg >= 0 OR huperzine_a_mcg = -1),
    bioperine_mg INTEGER NOT NULL DEFAULT 0 CHECK (bioperine_mg >= 0 OR bioperine_mg = -1)
);

CREATE TABLE IF NOT EXISTS public.temporary_non_stim_preworkout_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.temporary_products(id) ON DELETE CASCADE,
    serving_scoops INTEGER DEFAULT 2,
    serving_g NUMERIC(5,1) DEFAULT 40.2,
    key_features TEXT[] DEFAULT array['pump','endurance','focus','power', 'non-stim'],
    calories INTEGER NOT NULL DEFAULT 20 CHECK (calories >= 0 OR calories = -1),
    total_carbohydrate_g INTEGER NOT NULL DEFAULT 4 CHECK (total_carbohydrate_g >= 0 OR total_carbohydrate_g = -1),
    niacin_mg INTEGER NOT NULL DEFAULT 32 CHECK (niacin_mg >= 0 OR niacin_mg = -1),
    vitamin_b6_mg INTEGER NOT NULL DEFAULT 20 CHECK (vitamin_b6_mg >= 0 OR vitamin_b6_mg = -1),
    vitamin_b12_mcg INTEGER NOT NULL DEFAULT 250 CHECK (vitamin_b12_mcg >= 0 OR vitamin_b12_mcg = -1),
    magnesium_mg INTEGER NOT NULL DEFAULT 50 CHECK (magnesium_mg >= 0 OR magnesium_mg = -1),
    sodium_mg INTEGER NOT NULL DEFAULT 420 CHECK (sodium_mg >= 0 OR sodium_mg = -1),
    potassium_mg INTEGER NOT NULL DEFAULT 420 CHECK (potassium_mg >= 0 OR potassium_mg = -1),
    l_citrulline_mg INTEGER NOT NULL DEFAULT 10000 CHECK (l_citrulline_mg >= 0 OR l_citrulline_mg = -1),
    creatine_monohydrate_mg INTEGER NOT NULL DEFAULT 5000 CHECK (creatine_monohydrate_mg >= 0 OR creatine_monohydrate_mg = -1),
    betaine_anhydrous_mg INTEGER NOT NULL DEFAULT 4000 CHECK (betaine_anhydrous_mg >= 0 OR betaine_anhydrous_mg = -1),
    glycerol_powder_mg INTEGER NOT NULL DEFAULT 4000 CHECK (glycerol_powder_mg >= 0 OR glycerol_powder_mg = -1),
    malic_acid_mg INTEGER NOT NULL DEFAULT 3000 CHECK (malic_acid_mg >= 0 OR malic_acid_mg = -1),
    taurine_mg INTEGER NOT NULL DEFAULT 3000 CHECK (taurine_mg >= 0 OR taurine_mg = -1),
    sodium_nitrate_mg INTEGER NOT NULL DEFAULT 1500 CHECK (sodium_nitrate_mg >= 0 OR sodium_nitrate_mg = -1),
    agmatine_sulfate_mg INTEGER NOT NULL DEFAULT 1000 CHECK (agmatine_sulfate_mg >= 0 OR agmatine_sulfate_mg = -1),
    vasodrive_ap_mg INTEGER NOT NULL DEFAULT 508 CHECK (vasodrive_ap_mg >= 0 OR vasodrive_ap_mg = -1)
);

CREATE TABLE IF NOT EXISTS public.temporary_energy_drink_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.temporary_products(id) ON DELETE CASCADE,
    serving_size_fl_oz INTEGER,
    sugar_g INTEGER NOT NULL DEFAULT 0 CHECK (sugar_g >= 0 OR sugar_g = -1),
    key_features TEXT[] DEFAULT array['focus','nootropics','mental clarity','sugar-free'],
    caffeine_mg INTEGER NOT NULL DEFAULT 0 CHECK (caffeine_mg >= 0 OR caffeine_mg = -1),
    n_acetyl_l_tyrosine_mg INTEGER NOT NULL DEFAULT 0 CHECK (n_acetyl_l_tyrosine_mg >= 0 OR n_acetyl_l_tyrosine_mg = -1),
    alpha_gpc_mg INTEGER NOT NULL DEFAULT 0 CHECK (alpha_gpc_mg >= 0 OR alpha_gpc_mg = -1),
    l_theanine_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_theanine_mg >= 0 OR l_theanine_mg = -1),
    huperzine_a_mcg INTEGER NOT NULL DEFAULT 0 CHECK (huperzine_a_mcg >= 0 OR huperzine_a_mcg = -1),
    uridine_monophosphate_mg INTEGER NOT NULL DEFAULT 0 CHECK (uridine_monophosphate_mg >= 0 OR uridine_monophosphate_mg = -1),
    saffron_extract_mg INTEGER NOT NULL DEFAULT 0 CHECK (saffron_extract_mg >= 0 OR saffron_extract_mg = -1),
    vitamin_c_mg INTEGER NOT NULL DEFAULT 0 CHECK (vitamin_c_mg >= 0 OR vitamin_c_mg = -1),
    niacin_b3_mg INTEGER NOT NULL DEFAULT 0 CHECK (niacin_b3_mg >= 0 OR niacin_b3_mg = -1),
    vitamin_b6_mg INTEGER NOT NULL DEFAULT 0 CHECK (vitamin_b6_mg >= 0 OR vitamin_b6_mg = -1),
    vitamin_b12_mcg INTEGER NOT NULL DEFAULT 0 CHECK (vitamin_b12_mcg >= 0 OR vitamin_b12_mcg = -1),
    pantothenic_acid_b5_mg INTEGER NOT NULL DEFAULT 0 CHECK (pantothenic_acid_b5_mg >= 0 OR pantothenic_acid_b5_mg = -1)
);

CREATE TABLE IF NOT EXISTS public.temporary_protein_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.temporary_products(id) ON DELETE CASCADE,
    protein_claim_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (protein_claim_g >= 0 OR protein_claim_g = -1),
    effective_protein_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (effective_protein_g >= 0 OR effective_protein_g = -1),
    whey_concentrate_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (whey_concentrate_g >= 0 OR whey_concentrate_g = -1),
    whey_isolate_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (whey_isolate_g >= 0 OR whey_isolate_g = -1),
    whey_hydrolysate_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (whey_hydrolysate_g >= 0 OR whey_hydrolysate_g = -1),
    casein_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (casein_g >= 0 OR casein_g = -1),
    egg_protein_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (egg_protein_g >= 0 OR egg_protein_g = -1),
    soy_protein_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (soy_protein_g >= 0 OR soy_protein_g = -1)
);

CREATE TABLE IF NOT EXISTS public.temporary_amino_acid_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.temporary_products(id) ON DELETE CASCADE,
    key_features TEXT[] DEFAULT array['recovery','hydration','muscle protein synthesis'],
    total_eaas_mg INTEGER NOT NULL DEFAULT 0 CHECK (total_eaas_mg >= 0 OR total_eaas_mg = -1),
    l_leucine_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_leucine_mg >= 0 OR l_leucine_mg = -1),
    l_isoleucine_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_isoleucine_mg >= 0 OR l_isoleucine_mg = -1),
    l_valine_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_valine_mg >= 0 OR l_valine_mg = -1),
    l_lysine_hcl_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_lysine_hcl_mg >= 0 OR l_lysine_hcl_mg = -1),
    l_threonine_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_threonine_mg >= 0 OR l_threonine_mg = -1),
    l_phenylalanine_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_phenylalanine_mg >= 0 OR l_phenylalanine_mg = -1),
    l_tryptophan_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_tryptophan_mg >= 0 OR l_tryptophan_mg = -1),
    l_histidine_hcl_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_histidine_hcl_mg >= 0 OR l_histidine_hcl_mg = -1),
    l_methionine_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_methionine_mg >= 0 OR l_methionine_mg = -1),
    betaine_anhydrous_mg INTEGER NOT NULL DEFAULT 0 CHECK (betaine_anhydrous_mg >= 0 OR betaine_anhydrous_mg = -1),
    coconut_water_powder_mg INTEGER NOT NULL DEFAULT 0 CHECK (coconut_water_powder_mg >= 0 OR coconut_water_powder_mg = -1),
    astragin_mg INTEGER NOT NULL DEFAULT 0 CHECK (astragin_mg >= 0 OR astragin_mg = -1)
);

CREATE TABLE IF NOT EXISTS public.temporary_fat_burner_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.temporary_products(id) ON DELETE CASCADE,
    stimulant_based BOOLEAN DEFAULT TRUE,
    key_features TEXT[] DEFAULT array['thermogenesis','appetite suppression','metabolism','energy'],
    l_carnitine_l_tartrate_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_carnitine_l_tartrate_mg >= 0 OR l_carnitine_l_tartrate_mg = -1),
    green_tea_extract_mg INTEGER NOT NULL DEFAULT 0 CHECK (green_tea_extract_mg >= 0 OR green_tea_extract_mg = -1),
    capsimax_mg INTEGER NOT NULL DEFAULT 0 CHECK (capsimax_mg >= 0 OR capsimax_mg = -1),
    grains_of_paradise_mg INTEGER NOT NULL DEFAULT 0 CHECK (grains_of_paradise_mg >= 0 OR grains_of_paradise_mg = -1),
    ksm66_ashwagandha_mg INTEGER NOT NULL DEFAULT 0 CHECK (ksm66_ashwagandha_mg >= 0 OR ksm66_ashwagandha_mg = -1),
    kelp_extract_mcg INTEGER NOT NULL DEFAULT 0 CHECK (kelp_extract_mcg >= 0 OR kelp_extract_mcg = -1),
    selenium_mcg INTEGER NOT NULL DEFAULT 0 CHECK (selenium_mcg >= 0 OR selenium_mcg = -1),
    zinc_picolinate_mg INTEGER NOT NULL DEFAULT 0 CHECK (zinc_picolinate_mg >= 0 OR zinc_picolinate_mg = -1),
    five_htp_mg INTEGER NOT NULL DEFAULT 0 CHECK (five_htp_mg >= 0 OR five_htp_mg = -1),
    caffeine_anhydrous_mg INTEGER NOT NULL DEFAULT 0 CHECK (caffeine_anhydrous_mg >= 0 OR caffeine_anhydrous_mg = -1),
    halostachine_mg INTEGER NOT NULL DEFAULT 0 CHECK (halostachine_mg >= 0 OR halostachine_mg = -1),
    rauwolscine_mcg INTEGER NOT NULL DEFAULT 0 CHECK (rauwolscine_mcg >= 0 OR rauwolscine_mcg = -1),
    bioperine_mg INTEGER NOT NULL DEFAULT 0 CHECK (bioperine_mg >= 0 OR bioperine_mg = -1)
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_temporary_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS temporary_products_updated_at ON public.temporary_products;
CREATE TRIGGER temporary_products_updated_at
    BEFORE UPDATE ON public.temporary_products
    FOR EACH ROW
    EXECUTE FUNCTION update_temporary_products_updated_at();

-- Create view for easy querying of pending products
CREATE OR REPLACE VIEW pending_products AS
SELECT 
    tp.*,
    b.name as brand_name,
    b.slug as brand_slug,
    b.website as brand_website,
    u.username as submitted_by_username,
    r.username as reviewed_by_username
FROM public.temporary_products tp
JOIN public.brands b ON tp.brand_id = b.id
LEFT JOIN public.users u ON tp.submitted_by = u.id
LEFT JOIN public.users r ON tp.reviewed_by = r.id
WHERE tp.status = 'pending'
ORDER BY tp.submitted_at ASC;

-- Create view for accepted products ready for migration
CREATE OR REPLACE VIEW accepted_products AS
SELECT 
    tp.*,
    b.name as brand_name,
    b.slug as brand_slug,
    b.website as brand_website,
    u.username as submitted_by_username,
    r.username as reviewed_by_username
FROM public.temporary_products tp
JOIN public.brands b ON tp.brand_id = b.id
LEFT JOIN public.users u ON tp.submitted_by = u.id
LEFT JOIN public.users r ON tp.reviewed_by = r.id
WHERE tp.status = 'accepted'
ORDER BY tp.reviewed_at ASC;

-- Create function to migrate accepted product to main products table
CREATE OR REPLACE FUNCTION migrate_accepted_product(temp_product_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_product_id INTEGER;
    temp_product RECORD;
BEGIN
    -- Get the temporary product data
    SELECT * INTO temp_product FROM public.temporary_products WHERE id = temp_product_id AND status = 'accepted';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found or not accepted', temp_product_id;
    END IF;
    
    -- Insert into main products table
    INSERT INTO public.products (
        brand_id, category, name, slug, release_year, image_url, description,
        servings_per_container, price, serving_size_g, transparency_score, confidence_level
    ) VALUES (
        temp_product.brand_id, temp_product.category, temp_product.name, temp_product.slug,
        temp_product.release_year, temp_product.image_url, temp_product.description,
        temp_product.servings_per_container, temp_product.price, temp_product.serving_size_g,
        temp_product.transparency_score, temp_product.confidence_level
    ) RETURNING id INTO new_product_id;
    
    -- Migrate category-specific details
    CASE temp_product.category
        WHEN 'pre-workout' THEN
            INSERT INTO public.preworkout_details SELECT * FROM public.temporary_preworkout_details WHERE product_id = temp_product_id;
        WHEN 'non-stim-pre-workout' THEN
            INSERT INTO public.non_stim_preworkout_details SELECT * FROM public.temporary_non_stim_preworkout_details WHERE product_id = temp_product_id;
        WHEN 'energy-drink' THEN
            INSERT INTO public.energy_drink_details SELECT * FROM public.temporary_energy_drink_details WHERE product_id = temp_product_id;
        WHEN 'protein' THEN
            INSERT INTO public.protein_details SELECT * FROM public.temporary_protein_details WHERE product_id = temp_product_id;
        WHEN 'bcaa', 'eaa' THEN
            INSERT INTO public.amino_acid_details SELECT * FROM public.temporary_amino_acid_details WHERE product_id = temp_product_id;
        WHEN 'fat-burner', 'appetite-suppressant' THEN
            INSERT INTO public.fat_burner_details SELECT * FROM public.temporary_fat_burner_details WHERE product_id = temp_product_id;
    END CASE;
    
    -- Delete from temporary tables
    DELETE FROM public.temporary_products WHERE id = temp_product_id;
    
    RETURN new_product_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your security model)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.temporary_products TO authenticated;
-- GRANT SELECT ON pending_products TO authenticated;
-- GRANT SELECT ON accepted_products TO authenticated;
-- GRANT EXECUTE ON FUNCTION migrate_accepted_product TO authenticated;
