-- =================================================================
-- CORRECTED SCHEMA - Only pending_products table, no separate pending detail tables
-- =================================================================

-- Drop all existing tables and types
DROP TABLE IF EXISTS
    public.user_badges,
    public.product_reviews,
    public.product_images,
    public.preworkout_details,
    public.non_stim_preworkout_details,
    public.energy_drink_details,
    public.protein_details,
    public.amino_acid_details,
    public.fat_burner_details,
    public.creatine_details,
    public.creatine_types,
    public.temporary_products,
    public.pending_products,
    public.pending_preworkout_details,
    public.pending_non_stim_preworkout_details,
    public.pending_energy_drink_details,
    public.pending_protein_details,
    public.pending_amino_acid_details,
    public.pending_fat_burner_details,
    public.pending_creatine_details,
    public.products,
    public.brands
CASCADE;

-- Drop all custom data types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS contribution_status CASCADE;
DROP TYPE IF EXISTS product_category CASCADE;

-- =================================================================
-- RECREATE SCHEMA WITH CORRECT STRUCTURE
-- =================================================================

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('newcomer', 'contributor', 'trusted_editor', 'moderator', 'admin', 'owner');
CREATE TYPE contribution_status AS ENUM ('pending', 'approved', 'rejected', 'needs_review');
CREATE TYPE product_category AS ENUM ('protein', 'pre-workout', 'non-stim-pre-workout', 'energy-drink', 'bcaa', 'eaa', 'fat-burner', 'appetite-suppressant', 'creatine');

-- Create users table (keep existing)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    reputation_points INTEGER DEFAULT 0,
    role user_role DEFAULT 'newcomer',
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create brands table
CREATE TABLE public.brands (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE,
    website TEXT,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table (regular products shown to users)
CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES public.brands(id),
    category product_category NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    description TEXT,
    servings_per_container INTEGER,
    serving_size_g DECIMAL(5,2),
    dosage_rating INTEGER DEFAULT 0 CHECK (dosage_rating BETWEEN 0 AND 100),
    danger_rating INTEGER DEFAULT 0 CHECK (danger_rating BETWEEN 0 AND 100),
    community_rating DECIMAL(3,1) DEFAULT 0.0 CHECK (community_rating BETWEEN 0.0 AND 10.0),
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A')
    ) STORED
);

-- Create pending_products table (same structure as products, but not shown to users until approved)
CREATE TABLE public.pending_products (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES public.brands(id),
    category product_category NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    description TEXT,
    servings_per_container INTEGER,
    serving_size_g DECIMAL(5,2),
    dosage_rating INTEGER DEFAULT 0 CHECK (dosage_rating BETWEEN 0 AND 100),
    danger_rating INTEGER DEFAULT 0 CHECK (danger_rating BETWEEN 0 AND 100),
    submitted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A')
    ) STORED
);

-- Create detail tables that work for BOTH products and pending_products
CREATE TABLE public.preworkout_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER UNIQUE REFERENCES public.pending_products(id) ON DELETE CASCADE,
    serving_scoops INTEGER,
    serving_g NUMERIC(5,1),
    flavors TEXT[] DEFAULT '{}',
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
    bioperine_mg INTEGER NOT NULL DEFAULT 0 CHECK (bioperine_mg >= 0 OR bioperine_mg = -1),
    CONSTRAINT chk_preworkout_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

CREATE TABLE public.non_stim_preworkout_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER UNIQUE REFERENCES public.pending_products(id) ON DELETE CASCADE,
    serving_scoops INTEGER DEFAULT 2,
    serving_g NUMERIC(5,1) DEFAULT 40.2,
    flavors TEXT[] DEFAULT '{}',
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
    vasodrive_ap_mg INTEGER NOT NULL DEFAULT 508 CHECK (vasodrive_ap_mg >= 0 OR vasodrive_ap_mg = -1),
    CONSTRAINT chk_non_stim_preworkout_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

CREATE TABLE public.energy_drink_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER UNIQUE REFERENCES public.pending_products(id) ON DELETE CASCADE,
    serving_size_fl_oz INTEGER,
    flavors TEXT[] DEFAULT '{}',
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
    pantothenic_acid_b5_mg INTEGER NOT NULL DEFAULT 0 CHECK (pantothenic_acid_b5_mg >= 0 OR pantothenic_acid_b5_mg = -1),
    CONSTRAINT chk_energy_drink_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

CREATE TABLE public.protein_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER UNIQUE REFERENCES public.pending_products(id) ON DELETE CASCADE,
    flavors TEXT[] DEFAULT '{}',
    protein_claim_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (protein_claim_g >= 0 OR protein_claim_g = -1),
    effective_protein_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (effective_protein_g >= 0 OR effective_protein_g = -1),
    protein_sources JSONB,
    CONSTRAINT chk_protein_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

CREATE TABLE public.amino_acid_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER UNIQUE REFERENCES public.pending_products(id) ON DELETE CASCADE,
    flavors TEXT[] DEFAULT '{}',
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
    astragin_mg INTEGER NOT NULL DEFAULT 0 CHECK (astragin_mg >= 0 OR astragin_mg = -1),
    CONSTRAINT chk_amino_acid_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

CREATE TABLE public.fat_burner_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER UNIQUE REFERENCES public.pending_products(id) ON DELETE CASCADE,
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
    bioperine_mg INTEGER NOT NULL DEFAULT 0 CHECK (bioperine_mg >= 0 OR bioperine_mg = -1),
    CONSTRAINT chk_fat_burner_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

CREATE TABLE public.creatine_types (
    name VARCHAR(255) PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('fundamental', 'salt', 'ester', 'chelate', 'processed')),
    recommended_daily_dose_g DECIMAL(5,1) NOT NULL CHECK (recommended_daily_dose_g > 0)
);

CREATE TABLE public.creatine_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER UNIQUE REFERENCES public.pending_products(id) ON DELETE CASCADE,
    creatine_type_name VARCHAR(255) NOT NULL REFERENCES public.creatine_types(name),
    flavors TEXT[] DEFAULT '{}',
    serving_size_g DECIMAL(5,1) NOT NULL DEFAULT 0 CHECK (serving_size_g >= 0),
    servings_per_container INTEGER NOT NULL DEFAULT 0 CHECK (servings_per_container >= 0),
    CONSTRAINT chk_creatine_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

-- Create other supporting tables
CREATE TABLE public.user_badges (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

CREATE TABLE public.product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating DECIMAL(3,1) NOT NULL CHECK (rating BETWEEN 1.0 AND 10.0),
    title TEXT NOT NULL,
    comment VARCHAR(1000) NOT NULL,
    value_for_money INTEGER CHECK (value_for_money BETWEEN 1 AND 10),
    effectiveness INTEGER CHECK (effectiveness BETWEEN 1 AND 10),
    safety_concerns VARCHAR(1000),
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

CREATE TABLE public.product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    alt_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews (rating);
CREATE INDEX IF NOT EXISTS idx_pending_products_submitted_by ON public.pending_products (submitted_by);
CREATE INDEX IF NOT EXISTS idx_pending_products_reviewed_by ON public.pending_products (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_pending_products_search_vector ON public.pending_products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON public.products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges (user_id);

-- Create vitamins and minerals reference table
CREATE TABLE public.vitamins_minerals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('vitamin', 'mineral', 'vitamin_derivative')),
    subcategory VARCHAR(50),
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('mg', 'mcg', 'IU', 'g', 'mcg_DFE')),
    rda_adult_male DECIMAL(10,2), -- Recommended Daily Allowance for adult males
    rda_adult_female DECIMAL(10,2), -- Recommended Daily Allowance for adult females
    ul_adult DECIMAL(10,2), -- Upper Limit for adults
    description TEXT,
    benefits TEXT[],
    deficiency_symptoms TEXT[],
    toxicity_symptoms TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert creatine types data
INSERT INTO public.creatine_types (name, category, recommended_daily_dose_g) VALUES
('Creatine Monohydrate', 'fundamental', 5.0),
('Creatine Anhydrous', 'fundamental', 4.5),
('Creatine Phosphate', 'fundamental', 5.0),
('Free Acid Creatine', 'fundamental', 4.5),
('Creatine Hydrochloride', 'salt', 2.0),
('Creatine Citrate', 'salt', 5.0),
('Creatine Malate', 'salt', 5.0),
('Creatine Pyruvate', 'salt', 5.0),
('Creatine Nitrate', 'salt', 3.0),
('Creatine Gluconate', 'salt', 5.0),
('Creatine Orotate', 'salt', 5.0),
('Creatine Alpha-Ketoglutarate', 'salt', 5.0),
('Creatine Taurinate', 'salt', 5.0),
('Creatine Ethyl Ester', 'ester', 3.0),
('Creatine Ethyl Ester Malate', 'ester', 3.0),
('Creatine Magnesium Chelate', 'chelate', 5.0),
('Micronized Creatine', 'processed', 5.0),
('Buffered Creatine', 'processed', 3.0),
('Crea-Trona', 'processed', 3.0),
('Effervescent Creatine', 'processed', 5.0),
('Liquid Creatine', 'processed', 5.0),
('Creatinol-O-Phosphate', 'processed', 5.0),
('Creapure', 'processed', 5.0);

-- Insert comprehensive vitamins and minerals data
INSERT INTO public.vitamins_minerals (name, display_name, category, subcategory, unit, rda_adult_male, rda_adult_female, ul_adult, description, benefits, deficiency_symptoms, toxicity_symptoms) VALUES

-- Fat-Soluble Vitamins
('vitamin_a_retinol', 'Vitamin A (Retinol)', 'vitamin', 'fat_soluble', 'mcg_DFE', 900, 700, 3000, 'Essential for vision, immune function, and skin health - Retinol form',
 ARRAY['Vision health', 'Immune function', 'Skin health', 'Bone growth'],
 ARRAY['Night blindness', 'Dry eyes', 'Skin problems', 'Immune weakness'],
 ARRAY['Liver damage', 'Bone pain', 'Hair loss', 'Vision problems']),

('vitamin_a_beta_carotene', 'Vitamin A (Beta-Carotene)', 'vitamin', 'fat_soluble', 'mcg_DFE', 900, 700, 3000, 'Essential for vision, immune function, and skin health - Beta-carotene form (provitamin A)',
 ARRAY['Vision health', 'Immune function', 'Skin health', 'Bone growth', 'Antioxidant'],
 ARRAY['Night blindness', 'Dry eyes', 'Skin problems', 'Immune weakness'],
 ARRAY['Rare - may cause yellowing of skin']),

('vitamin_a_retinyl_palmitate', 'Vitamin A (Retinyl Palmitate)', 'vitamin', 'fat_soluble', 'mcg_DFE', 900, 700, 3000, 'Essential for vision, immune function, and skin health - Retinyl palmitate form (stable ester)',
 ARRAY['Vision health', 'Immune function', 'Skin health', 'Bone growth'],
 ARRAY['Night blindness', 'Dry eyes', 'Skin problems', 'Immune weakness'],
 ARRAY['Liver damage', 'Bone pain', 'Hair loss', 'Vision problems']),

('vitamin_a_retinyl_acetate', 'Vitamin A (Retinyl Acetate)', 'vitamin', 'fat_soluble', 'mcg_DFE', 900, 700, 3000, 'Essential for vision, immune function, and skin health - Retinyl acetate form',
 ARRAY['Vision health', 'Immune function', 'Skin health', 'Bone growth'],
 ARRAY['Night blindness', 'Dry eyes', 'Skin problems', 'Immune weakness'],
 ARRAY['Liver damage', 'Bone pain', 'Hair loss', 'Vision problems']),

('vitamin_d_cholecalciferol', 'Vitamin D3 (Cholecalciferol)', 'vitamin', 'fat_soluble', 'IU', 800, 800, 4000, 'Essential for bone health and immune function - Cholecalciferol form (D3)',
 ARRAY['Bone health', 'Immune function', 'Muscle function', 'Calcium absorption'],
 ARRAY['Bone weakness', 'Muscle pain', 'Immune weakness', 'Depression'],
 ARRAY['Kidney stones', 'Nausea', 'Weakness', 'Confusion']),

('vitamin_d_ergocalciferol', 'Vitamin D2 (Ergocalciferol)', 'vitamin', 'fat_soluble', 'IU', 800, 800, 4000, 'Essential for bone health and immune function - Ergocalciferol form (D2)',
 ARRAY['Bone health', 'Immune function', 'Muscle function', 'Calcium absorption'],
 ARRAY['Bone weakness', 'Muscle pain', 'Immune weakness', 'Depression'],
 ARRAY['Kidney stones', 'Nausea', 'Weakness', 'Confusion']),

('vitamin_e_alpha_tocopherol', 'Vitamin E (Alpha-Tocopherol)', 'vitamin', 'fat_soluble', 'IU', 15, 15, 1000, 'Powerful antioxidant for cell protection - Alpha-tocopherol form',
 ARRAY['Antioxidant', 'Immune function', 'Skin health', 'Heart health'],
 ARRAY['Nerve problems', 'Muscle weakness', 'Vision problems', 'Immune weakness'],
 ARRAY['Bleeding problems', 'Weakness', 'Nausea']),

('vitamin_e_mixed_tocopherols', 'Vitamin E (Mixed Tocopherols)', 'vitamin', 'fat_soluble', 'IU', 15, 15, 1000, 'Powerful antioxidant for cell protection - Mixed tocopherols form',
 ARRAY['Antioxidant', 'Immune function', 'Skin health', 'Heart health'],
 ARRAY['Nerve problems', 'Muscle weakness', 'Vision problems', 'Immune weakness'],
 ARRAY['Bleeding problems', 'Weakness', 'Nausea']),

('vitamin_e_gamma_tocopherol', 'Vitamin E (Gamma-Tocopherol)', 'vitamin', 'fat_soluble', 'IU', 15, 15, 1000, 'Powerful antioxidant for cell protection - Gamma-tocopherol form',
 ARRAY['Antioxidant', 'Immune function', 'Skin health', 'Heart health'],
 ARRAY['Nerve problems', 'Muscle weakness', 'Vision problems', 'Immune weakness'],
 ARRAY['Bleeding problems', 'Weakness', 'Nausea']),

('vitamin_k1_phylloquinone', 'Vitamin K1 (Phylloquinone)', 'vitamin', 'fat_soluble', 'mcg', 120, 90, NULL, 'Essential for blood clotting and bone health - Phylloquinone form',
 ARRAY['Blood clotting', 'Bone health', 'Heart health'],
 ARRAY['Bleeding problems', 'Bone weakness', 'Easy bruising'],
 ARRAY['Rare - may interfere with blood thinners']),

('vitamin_k2_mk4', 'Vitamin K2 (MK-4)', 'vitamin', 'fat_soluble', 'mcg', 120, 90, NULL, 'Essential for blood clotting and bone health - Menaquinone-4 form',
 ARRAY['Blood clotting', 'Bone health', 'Heart health', 'Calcium metabolism'],
 ARRAY['Bleeding problems', 'Bone weakness', 'Easy bruising'],
 ARRAY['Rare - may interfere with blood thinners']),

('vitamin_k2_mk7', 'Vitamin K2 (MK-7)', 'vitamin', 'fat_soluble', 'mcg', 120, 90, NULL, 'Essential for blood clotting and bone health - Menaquinone-7 form',
 ARRAY['Blood clotting', 'Bone health', 'Heart health', 'Calcium metabolism'],
 ARRAY['Bleeding problems', 'Bone weakness', 'Easy bruising'],
 ARRAY['Rare - may interfere with blood thinners']),

-- Water-Soluble Vitamins - B Complex
('vitamin_b1_thiamine', 'Vitamin B1 (Thiamine)', 'vitamin', 'water_soluble', 'mg', 1.2, 1.1, NULL, 'Essential for energy metabolism and nerve function - Thiamine hydrochloride form',
 ARRAY['Energy production', 'Nerve function', 'Heart health', 'Brain function'],
 ARRAY['Beriberi', 'Confusion', 'Muscle weakness', 'Heart problems'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b1_thiamine_mononitrate', 'Vitamin B1 (Thiamine Mononitrate)', 'vitamin', 'water_soluble', 'mg', 1.2, 1.1, NULL, 'Essential for energy metabolism and nerve function - Thiamine mononitrate form (stable)',
 ARRAY['Energy production', 'Nerve function', 'Heart health', 'Brain function'],
 ARRAY['Beriberi', 'Confusion', 'Muscle weakness', 'Heart problems'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b1_benfotiamine', 'Vitamin B1 (Benfotiamine)', 'vitamin', 'water_soluble', 'mg', 1.2, 1.1, NULL, 'Essential for energy metabolism and nerve function - Benfotiamine form (fat-soluble)',
 ARRAY['Energy production', 'Nerve function', 'Heart health', 'Brain function'],
 ARRAY['Beriberi', 'Confusion', 'Muscle weakness', 'Heart problems'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b2_riboflavin', 'Vitamin B2 (Riboflavin)', 'vitamin', 'water_soluble', 'mg', 1.3, 1.1, NULL, 'Essential for energy metabolism and skin health - Riboflavin form',
 ARRAY['Energy production', 'Skin health', 'Vision health', 'Antioxidant'],
 ARRAY['Cracked lips', 'Sore throat', 'Skin problems', 'Eye problems'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b2_riboflavin_5_phosphate', 'Vitamin B2 (Riboflavin 5-Phosphate)', 'vitamin', 'water_soluble', 'mg', 1.3, 1.1, NULL, 'Essential for energy metabolism and skin health - Riboflavin 5-phosphate form (active)',
 ARRAY['Energy production', 'Skin health', 'Vision health', 'Antioxidant'],
 ARRAY['Cracked lips', 'Sore throat', 'Skin problems', 'Eye problems'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b3_niacin', 'Vitamin B3 (Niacin)', 'vitamin', 'water_soluble', 'mg', 16, 14, 35, 'Essential for energy metabolism and skin health - Nicotinic acid form',
 ARRAY['Energy production', 'Skin health', 'Cholesterol management', 'Brain function'],
 ARRAY['Pellagra', 'Digestive issues', 'Skin problems', 'Mental confusion'],
 ARRAY['Flushing', 'Liver damage', 'Stomach ulcers', 'Vision problems']),

('vitamin_b3_niacinamide', 'Vitamin B3 (Niacinamide)', 'vitamin', 'water_soluble', 'mg', 16, 14, 35, 'Essential for energy metabolism and skin health - Niacinamide form (no flush)',
 ARRAY['Energy production', 'Skin health', 'Cholesterol management', 'Brain function'],
 ARRAY['Pellagra', 'Digestive issues', 'Skin problems', 'Mental confusion'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b3_inositol_hexanicotinate', 'Vitamin B3 (Inositol Hexanicotinate)', 'vitamin', 'water_soluble', 'mg', 16, 14, 35, 'Essential for energy metabolism and skin health - Inositol hexanicotinate form (no flush)',
 ARRAY['Energy production', 'Skin health', 'Cholesterol management', 'Brain function'],
 ARRAY['Pellagra', 'Digestive issues', 'Skin problems', 'Mental confusion'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b5_pantothenic_acid', 'Vitamin B5 (Pantothenic Acid)', 'vitamin', 'water_soluble', 'mg', 5, 5, NULL, 'Essential for energy metabolism and hormone production - D-pantothenic acid form',
 ARRAY['Energy production', 'Hormone synthesis', 'Skin health', 'Stress management'],
 ARRAY['Fatigue', 'Numbness', 'Burning feet', 'Digestive issues'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b5_pantethine', 'Vitamin B5 (Pantethine)', 'vitamin', 'water_soluble', 'mg', 5, 5, NULL, 'Essential for energy metabolism and hormone production - Pantethine form (more bioavailable)',
 ARRAY['Energy production', 'Hormone synthesis', 'Skin health', 'Stress management'],
 ARRAY['Fatigue', 'Numbness', 'Burning feet', 'Digestive issues'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b6_pyridoxine', 'Vitamin B6 (Pyridoxine)', 'vitamin', 'water_soluble', 'mg', 1.3, 1.3, 100, 'Important for protein metabolism and brain function - Pyridoxine hydrochloride form',
 ARRAY['Protein metabolism', 'Brain function', 'Immune system', 'Hormone regulation'],
 ARRAY['Depression', 'Confusion', 'Weak immune system', 'Skin problems'],
 ARRAY['Nerve damage', 'Skin lesions', 'Photosensitivity']),

('vitamin_b6_pyridoxal', 'Vitamin B6 (Pyridoxal)', 'vitamin', 'water_soluble', 'mg', 1.3, 1.3, 100, 'Important for protein metabolism and brain function - Pyridoxal form (active coenzyme)',
 ARRAY['Protein metabolism', 'Brain function', 'Immune system', 'Hormone regulation'],
 ARRAY['Depression', 'Confusion', 'Weak immune system', 'Skin problems'],
 ARRAY['Nerve damage', 'Skin lesions', 'Photosensitivity']),

('vitamin_b6_pyridoxamine', 'Vitamin B6 (Pyridoxamine)', 'vitamin', 'water_soluble', 'mg', 1.3, 1.3, 100, 'Important for protein metabolism and brain function - Pyridoxamine form',
 ARRAY['Protein metabolism', 'Brain function', 'Immune system', 'Hormone regulation'],
 ARRAY['Depression', 'Confusion', 'Weak immune system', 'Skin problems'],
 ARRAY['Nerve damage', 'Skin lesions', 'Photosensitivity']),

('vitamin_b6_plp', 'Vitamin B6 (PLP)', 'vitamin', 'water_soluble', 'mg', 1.3, 1.3, 100, 'Important for protein metabolism and brain function - Pyridoxal 5-phosphate form (most active)',
 ARRAY['Protein metabolism', 'Brain function', 'Immune system', 'Hormone regulation'],
 ARRAY['Depression', 'Une confusion', 'Weak immune system', 'Skin problems'],
 ARRAY['Nerve damage', 'Skin lesions', 'Photosensitivity']),

('vitamin_b7_biotin', 'Vitamin B7 (Biotin)', 'vitamin', 'water_soluble', 'mcg', 30, 30, NULL, 'Essential for hair, skin, and nail health - Biotin form',
 ARRAY['Hair health', 'Skin health', 'Nail health', 'Energy production'],
 ARRAY['Hair loss', 'Skin rash', 'Brittle nails', 'Depression'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b7_biotin_d_biotin', 'Vitamin B7 (D-Biotin)', 'vitamin', 'water_soluble', 'mcg', 30, 30, NULL, 'Essential for hair, skin, and nail health - D-biotin form (natural)',
 ARRAY['Hair health', 'Skin health', 'Nail health', 'Energy production'],
 ARRAY['Hair loss', 'Skin rash', 'Brittle nails', 'Depression'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b9_folic_acid', 'Vitamin B9 (Folic Acid)', 'vitamin', 'water_soluble', 'mcg_DFE', 400, 400, 1000, 'Essential for DNA synthesis and cell division - Folic acid form (synthetic)',
 ARRAY['DNA synthesis', 'Cell division', 'Heart health', 'Brain function'],
 ARRAY['Anemia', 'Birth defects', 'Heart disease', 'Depression'],
 ARRAY['May mask B12 deficiency']),

('vitamin_b9_folate', 'Vitamin B9 (Folate)', 'vitamin', 'water_soluble', 'mcg_DFE', 400, 400, 1000, 'Essential for DNA synthesis and cell division - Folate form (natural)',
 ARRAY['DNA synthesis', 'Cell division', 'Heart health', 'Brain function'],
 ARRAY['Anemia', 'Birth defects', 'Heart disease', 'Depression'],
 ARRAY['May mask B12 deficiency']),

('vitamin_b9_methylfolate', 'Vitamin B9 (Methylfolate)', 'vitamin', 'water_soluble', 'mcg_DFE', 400, 400, 1000, 'Essential for DNA synthesis and cell division - Methylfolate form (active)',
 ARRAY['DNA synthesis', 'Cell division', 'Heart health', 'Brain function'],
 ARRAY['Anemia', 'Birth defects', 'Heart disease', 'Depression'],
 ARRAY['May mask B12 deficiency']),

('vitamin_b12_cyanocobalamin', 'Vitamin B12 (Cyanocobalamin)', 'vitamin', 'water_soluble', 'mcg', 2.4, 2.4, NULL, 'Essential for nerve function and red blood cell formation - Cyanocobalamin form (synthetic)',
 ARRAY['Nerve function', 'Red blood cell formation', 'DNA synthesis', 'Brain health'],
 ARRAY['Anemia', 'Nerve damage', 'Memory problems', 'Fatigue'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b12_methylcobalamin', 'Vitamin B12 (Methylcobalamin)', 'vitamin', 'water_soluble', 'mcg', 2.4, 2.4, NULL, 'Essential for nerve function and red blood cell formation - Methylcobalamin form (active)',
 ARRAY['Nerve function', 'Red blood cell formation', 'DNA synthesis', 'Brain health'],
 ARRAY['Anemia', 'Nerve damage', 'Memory problems', 'Fatigue'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b12_hydroxocobalamin', 'Vitamin B12 (Hydroxocobalamin)', 'vitamin', 'water_soluble', 'mcg', 2.4, 2.4, NULL, 'Essential for nerve function and red blood cell formation - Hydroxocobalamin form (long-acting)',
 ARRAY['Nerve function', 'Red blood cell formation', 'DNA synthesis', 'Brain health'],
 ARRAY['Anemia', 'Nerve damage', 'Memory problems', 'Fatigue'],
 ARRAY['Rare - excess excreted in urine']),

('vitamin_b12_adenosylcobalamin', 'Vitamin B12 (Adenosylcobalamin)', 'vitamin', 'water_soluble', 'mcg', 2.4, 2.4, NULL, 'Essential for nerve function and red blood cell formation - Adenosylcobalamin form (mitochondrial)',
 ARRAY['Nerve function', 'Red blood cell formation', 'DNA synthesis', 'Brain health'],
 ARRAY['Anemia', 'Nerve damage', 'Memory problems', 'Fatigue'],
 ARRAY['Rare - excess excreted in urine']),

-- Other Vitamins
('vitamin_c_ascorbic_acid', 'Vitamin C (Ascorbic Acid)', 'vitamin', 'water_soluble', 'mg', 90, 75, 2000, 'Powerful antioxidant and immune booster - Ascorbic acid form',
 ARRAY['Immune function', 'Antioxidant', 'Collagen synthesis', 'Iron absorption'],
 ARRAY['Scurvy', 'Weak immune system', 'Slow wound healing', 'Fatigue'],
 ARRAY['Diarrhea', 'Nausea', 'Kidney stones']),

('vitamin_c_sodium_ascorbate', 'Vitamin C (Sodium Ascorbate)', 'vitamin', 'water_soluble', 'mg', 90, 75, 2000, 'Powerful antioxidant and immune booster - Sodium ascorbate form (buffered)',
 ARRAY['Immune function', 'Antioxidant', 'Collagen synthesis', 'Iron absorption'],
 ARRAY['Scurvy', 'Weak immune system', 'Slow wound healing', 'Fatigue'],
 ARRAY['Diarrhea', 'Nausea', 'Kidney stones']),

('vitamin_c_calcium_ascorbate', 'Vitamin C (Calcium Ascorbate)', 'vitamin', 'water_soluble', 'mg', 90, 75, 2000, 'Powerful antioxidant and immune booster - Calcium ascorbate form (buffered)',
 ARRAY['Immune function', 'Antioxidant', 'Collagen synthesis', 'Iron absorption'],
 ARRAY['Scurvy', 'Weak immune system', 'Slow wound healing', 'Fatigue'],
 ARRAY['Diarrhea', 'Nausea', 'Kidney stones']),

('vitamin_c_ester_c', 'Vitamin C (Ester-C)', 'vitamin', 'water_soluble', 'mg', 90, 75, 2000, 'Powerful antioxidant and immune booster - Ester-C form (non-acidic)',
 ARRAY['Immune function', 'Antioxidant', 'Collagen synthesis', 'Iron absorption'],
 ARRAY['Scurvy', 'Weak immune system', 'Slow wound healing', 'Fatigue'],
 ARRAY['Diarrhea', 'Nausea', 'Kidney stones']),

('choline', 'Choline', 'vitamin', 'water_soluble', 'mg', 550, 425, 3500, 'Essential for brain function and liver health',
 ARRAY['Brain function', 'Liver health', 'Memory', 'Nerve function'],
 ARRAY['Memory problems', 'Liver problems', 'Muscle damage', 'Fatigue'],
 ARRAY['Fishy body odor', 'Low blood pressure', 'Sweating']),

('inositol', 'Inositol', 'vitamin', 'water_soluble', 'mg', 1000, 1000, NULL, 'Important for brain function and mood regulation',
 ARRAY['Brain function', 'Mood regulation', 'Sleep quality', 'Hair health'],
 ARRAY['Depression', 'Anxiety', 'Sleep problems', 'Hair loss'],
 ARRAY['Rare - may cause digestive issues']),

-- Major Minerals (Macrominerals)
('calcium', 'Calcium', 'mineral', 'macromineral', 'mg', 1000, 1000, 2500, 'Essential for bone and teeth health - Calcium carbonate form',
 ARRAY['Bone health', 'Teeth health', 'Muscle function', 'Nerve function'],
 ARRAY['Bone weakness', 'Muscle cramps', 'Nerve problems', 'Tooth decay'],
 ARRAY['Kidney stones', 'Constipation', 'Nausea']),

('calcium_citrate', 'Calcium (Citrate)', 'mineral', 'macromineral', 'mg', 1000, 1000, 2500, 'Essential for bone and teeth health - Calcium citrate form (better absorption)',
 ARRAY['Bone health', 'Teeth health', 'Muscle function', 'Nerve function'],
 ARRAY['Bone weakness', 'Muscle cramps', 'Nerve problems', 'Tooth decay'],
 ARRAY['Kidney stones', 'Constipation', 'Nausea']),

('calcium_malate', 'Calcium (Malate)', 'mineral', 'macromineral', 'mg', 1000, 1000, 2500, 'Essential for bone and teeth health - Calcium malate form',
 ARRAY['Bone health', 'Teeth health', 'Muscle function', 'Nerve function'],
 ARRAY['Bone weakness', 'Muscle cramps', 'Nerve problems', 'Tooth decay'],
 ARRAY['Kidney stones', 'Constipation', 'Nausea']),

('calcium_gluconate', 'Calcium (Gluconate)', 'mineral', 'macromineral', 'mg', 1000, 1000, 2500, 'Essential for bone and teeth health - Calcium gluconate form',
 ARRAY['Bone health', 'Teeth health', 'Muscle function', 'Nerve function'],
 ARRAY['Bone weakness', 'Muscle cramps', 'Nerve problems', 'Tooth decay'],
 ARRAY['Kidney stones', 'Constipation', 'Nausea']),

('magnesium', 'Magnesium', 'mineral', 'macromineral', 'mg', 420, 320, 350, 'Essential for muscle and nerve function, bone health - Magnesium oxide form',
 ARRAY['Muscle function', 'Nerve function', 'Bone health', 'Heart rhythm'],
 ARRAY['Muscle cramps', 'Irregular heartbeat', 'Weakness', 'Personality changes'],
 ARRAY['Diarrhea', 'Nausea', 'Muscle weakness', 'Low blood pressure']),

('magnesium_citrate', 'Magnesium (Citrate)', 'mineral', 'macromineral', 'mg', 420, 320, 350, 'Essential for muscle and nerve function, bone health - Magnesium citrate form (better absorption)',
 ARRAY['Muscle function', 'Nerve function', 'Bone health', 'Heart rhythm'],
 ARRAY['Muscle cramps', 'Irregular heartbeat', 'Weakness', 'Personality changes'],
 ARRAY['Diarrhea', 'Nausea', 'Muscle weakness', 'Low blood pressure']),

('magnesium_glycinate', 'Magnesium (Glycinate)', 'mineral', 'macromineral', 'mg', 420, 320, 350, 'Essential for muscle and nerve function, bone health - Magnesium glycinate form (chelated)',
 ARRAY['Muscle function', 'Nerve function', 'Bone health', 'Heart rhythm'],
 ARRAY['Muscle cramps', 'Irregular heartbeat', 'Weakness', 'Personality changes'],
 ARRAY['Diarrhea', 'Nausea', 'Muscle weakness', 'Low blood pressure']),

('magnesium_malate', 'Magnesium (Malate)', 'mineral', 'macromineral', 'mg', 420, 320, 350, 'Essential for muscle and nerve function, bone health - Magnesium malate form',
 ARRAY['Muscle function', 'Nerve function', 'Bone health', 'Heart rhythm'],
 ARRAY['Muscle cramps', 'Irregular heartbeat', 'Weakness', 'Personality changes'],
 ARRAY['Diarrhea', 'Nausea', 'Muscle weakness', 'Low blood pressure']),

('magnesium_taurate', 'Magnesium (Taurate)', 'mineral', 'macromineral', 'mg', 420, 320, 350, 'Essential for muscle and nerve function, bone health - Magnesium taurate form',
 ARRAY['Muscle function', 'Nerve function', 'Bone health', 'Heart rhythm'],
 ARRAY['Muscle cramps', 'Irregular heartbeat', 'Weakness', 'Personality changes'],
 ARRAY['Diarrhea', 'Nausea', 'Muscle weakness', 'Low blood pressure']),

('phosphorus', 'Phosphorus', 'mineral', 'macromineral', 'mg', 700, 700, 4000, 'Essential for bone health and energy production',
 ARRAY['Bone health', 'Energy production', 'Kidney function', 'Muscle function'],
 ARRAY['Bone weakness', 'Muscle weakness', 'Fatigue', 'Appetite loss'],
 ARRAY['Kidney damage', 'Bone problems', 'Calcium imbalance']),

('sodium', 'Sodium', 'mineral', 'electrolyte', 'mg', 2300, 2300, 2300, 'Essential for fluid balance and nerve function - Sodium chloride form',
 ARRAY['Fluid balance', 'Nerve function', 'Muscle contraction'],
 ARRAY['Muscle cramps', 'Headaches', 'Nausea', 'Fatigue'],
 ARRAY['High blood pressure', 'Heart disease', 'Stroke', 'Kidney disease']),

('potassium', 'Potassium', 'mineral', 'electrolyte', 'mg', 3400, 2600, NULL, 'Essential for heart rhythm and muscle function - Potassium chloride form',
 ARRAY['Heart rhythm', 'Muscle function', 'Blood pressure', 'Nerve function'],
 ARRAY['Muscle weakness', 'Irregular heartbeat', 'Fatigue', 'Constipation'],
 ARRAY['Heart rhythm problems', 'Muscle weakness', 'Nausea']),

('potassium_citrate', 'Potassium (Citrate)', 'mineral', 'electrolyte', 'mg', 3400, 2600, NULL, 'Essential for heart rhythm and muscle function - Potassium citrate form',
 ARRAY['Heart rhythm', 'Muscle function', 'Blood pressure', 'Nerve function'],
 ARRAY['Muscle weakness', 'Irregular heartbeat', 'Fatigue', 'Constipation'],
 ARRAY['Heart rhythm problems', 'Muscle weakness', 'Nausea']),

('potassium_gluconate', 'Potassium (Gluconate)', 'mineral', 'electrolyte', 'mg', 3400, 2600, NULL, 'Essential for heart rhythm and muscle function - Potassium gluconate form',
 ARRAY['Heart rhythm', 'Muscle function', 'Blood pressure', 'Nerve function'],
 ARRAY['Muscle weakness', 'Irregular heartbeat', 'Fatigue', 'Constipation'],
 ARRAY['Heart rhythm problems', 'Muscle weakness', 'Nausea']),

('sulfur', 'Sulfur', 'mineral', 'macromineral', 'mg', 1000, 1000, NULL, 'Essential for protein synthesis and detoxification',
 ARRAY['Protein synthesis', 'Detoxification', 'Skin health', 'Joint health'],
 ARRAY['Joint problems', 'Skin problems', 'Hair problems', 'Weakness'],
 ARRAY['Rare - may cause digestive issues']),

-- Trace Minerals (Microminerals)
('iron', 'Iron', 'mineral', 'micromineral', 'mg', 8, 18, 45, 'Essential for oxygen transport and energy production - Iron sulfate form',
 ARRAY['Oxygen transport', 'Energy production', 'Immune function', 'Brain function'],
 ARRAY['Anemia', 'Fatigue', 'Weakness', 'Cold intolerance'],
 ARRAY['Nausea', 'Constipation', 'Organ damage']),

('iron_bisglycinate', 'Iron (Bisglycinate)', 'mineral', 'micromineral', 'mg', 8, 18, 45, 'Essential for oxygen transport and energy production - Iron bisglycinate form (chelated)',
 ARRAY['Oxygen transport', 'Energy production', 'Immune function', 'Brain function'],
 ARRAY['Anemia', 'Fatigue', 'Weakness', 'Cold intolerance'],
 ARRAY['Nausea', 'Constipation', 'Organ damage']),

('iron_fumarate', 'Iron (Fumarate)', 'mineral', 'micromineral', 'mg', 8, 18, 45, 'Essential for oxygen transport and energy production - Iron fumarate form',
 ARRAY['Oxygen transport', 'Energy production', 'Immune function', 'Brain function'],
 ARRAY['Anemia', 'Fatigue', 'Weakness', 'Cold intolerance'],
 ARRAY['Nausea', 'Constipation', 'Organ damage']),

('iron_polysaccharide', 'Iron (Polysaccharide)', 'mineral', 'micromineral', 'mg', 8, 18, 45, 'Essential for oxygen transport and energy production - Iron polysaccharide form (gentle)',
 ARRAY['Oxygen transport', 'Energy production', 'Immune function', 'Brain function'],
 ARRAY['Anemia', 'Fatigue', 'Weakness', 'Cold intolerance'],
 ARRAY['Nausea', 'Constipation', 'Organ damage']),

('zinc', 'Zinc', 'mineral', 'micromineral', 'mg', 11, 8, 40, 'Essential for immune function and wound healing - Zinc oxide form',
 ARRAY['Immune function', 'Wound healing', 'Skin health', 'Taste/smell'],
 ARRAY['Weak immune system', 'Slow wound healing', 'Loss of taste', 'Hair loss'],
 ARRAY['Nausea', 'Vomiting', 'Diarrhea', 'Copper deficiency']),

('zinc_picolinate', 'Zinc (Picolinate)', 'mineral', 'micromineral', 'mg', 11, 8, 40, 'Essential for immune function and wound healing - Zinc picolinate form (better absorption)',
 ARRAY['Immune function', 'Wound healing', 'Skin health', 'Taste/smell'],
 ARRAY['Weak immune system', 'Slow wound healing', 'Loss of taste', 'Hair loss'],
 ARRAY['Nausea', 'Vomiting', 'Diarrhea', 'Copper deficiency']),

('zinc_gluconate', 'Zinc (Gluconate)', 'mineral', 'micromineral', 'mg', 11, 8, 40, 'Essential for immune function and wound healing - Zinc gluconate form',
 ARRAY['Immune function', 'Wound healing', 'Skin health', 'Taste/smell'],
 ARRAY['Weak immune system', 'Slow wound healing', 'Loss of taste', 'Hair loss'],
 ARRAY['Nausea', 'Vomiting', 'Diarrhea', 'Copper deficiency']),

('zinc_citrate', 'Zinc (Citrate)', 'mineral', 'micromineral', 'mg', 11, 8, 40, 'Essential for immune function and wound healing - Zinc citrate form',
 ARRAY['Immune function', 'Wound healing', 'Skin health', 'Taste/smell'],
 ARRAY['Weak immune system', 'Slow wound healing', 'Loss of taste', 'Hair loss'],
 ARRAY['Nausea', 'Vomiting', 'Diarrhea', 'Copper deficiency']),

('zinc_bisglycinate', 'Zinc (Bisglycinate)', 'mineral', 'micromineral', 'mg', 11, 8, 40, 'Essential for immune function and wound healing - Zinc bisglycinate form (chelated)',
 ARRAY['Immune function', 'Wound healing', 'Skin health', 'Taste/smell'],
 ARRAY['Weak immune system', 'Slow wound healing', 'Loss of taste', 'Hair loss'],
 ARRAY['Nausea', 'Vomiting', 'Diarrhea', 'Copper deficiency']),

('copper', 'Copper', 'mineral', 'micromineral', 'mcg', 900, 900, 10000, 'Essential for iron metabolism and antioxidant function - Copper gluconate form',
 ARRAY['Iron metabolism', 'Antioxidant function', 'Bone health', 'Immune function'],
 ARRAY['Anemia', 'Bone problems', 'Weak immune system', 'Fatigue'],
 ARRAY['Nausea', 'Vomiting', 'Liver damage', 'Wilson disease']),

('copper_bisglycinate', 'Copper (Bisglycinate)', 'mineral', 'micromineral', 'mcg', 900, 900, 10000, 'Essential for iron metabolism and antioxidant function - Copper bisglycinate form (chelated)',
 ARRAY['Iron metabolism', 'Antioxidant function', 'Bone health', 'Immune function'],
 ARRAY['Anemia', 'Bone problems', 'Weak immune system', 'Fatigue'],
 ARRAY['Nausea', 'Vomiting', 'Liver damage', 'Wilson disease']),

('manganese', 'Manganese', 'mineral', 'micromineral', 'mg', 2.3, 1.8, 11, 'Essential for bone health and antioxidant function - Manganese sulfate form',
 ARRAY['Bone health', 'Antioxidant function', 'Blood sugar regulation', 'Brain function'],
 ARRAY['Bone problems', 'Blood sugar problems', 'Weak immune system', 'Fatigue'],
 ARRAY['Nerve problems', 'Movement disorders', 'Liver damage']),

('manganese_bisglycinate', 'Manganese (Bisglycinate)', 'mineral', 'micromineral', 'mg', 2.3, 1.8, 11, 'Essential for bone health and antioxidant function - Manganese bisglycinate form (chelated)',
 ARRAY['Bone health', 'Antioxidant function', 'Blood sugar regulation', 'Brain function'],
 ARRAY['Bone problems', 'Blood sugar problems', 'Weak immune system', 'Fatigue'],
 ARRAY['Nerve problems', 'Movement disorders', 'Liver damage']),

('selenium', 'Selenium', 'mineral', 'micromineral', 'mcg', 55, 55, 400, 'Essential for antioxidant function and thyroid health - Selenium methionine form',
 ARRAY['Antioxidant function', 'Thyroid health', 'Immune function', 'Heart health'],
 ARRAY['Weak immune system', 'Thyroid problems', 'Heart problems', 'Fatigue'],
 ARRAY['Nausea', 'Hair loss', 'Nail problems', 'Garlic breath']),

('selenium_selenomethionine', 'Selenium (Selenomethionine)', 'mineral', 'micromineral', 'mcg', 55, 55, 400, 'Essential for antioxidant function and thyroid health - Selenium selenomethionine form',
 ARRAY['Antioxidant function', 'Thyroid health', 'Immune function', 'Heart health'],
 ARRAY['Weak immune system', 'Thyroid problems', 'Heart problems', 'Fatigue'],
 ARRAY['Nausea', 'Hair loss', 'Nail problems', 'Garlic breath']),

('iodine', 'Iodine', 'mineral', 'micromineral', 'mcg', 150, 150, 1100, 'Essential for thyroid function and metabolism - Potassium iodide form',
 ARRAY['Thyroid function', 'Metabolism', 'Brain development', 'Energy production'],
 ARRAY['Thyroid problems', 'Weight gain', 'Fatigue', 'Depression'],
 ARRAY['Thyroid problems', 'Metallic taste', 'Nausea', 'Headaches']),

('chromium', 'Chromium', 'mineral', 'micromineral', 'mcg', 35, 25, NULL, 'Helps regulate blood sugar levels - Chromium picolinate form',
 ARRAY['Blood sugar regulation', 'Metabolism', 'Weight management'],
 ARRAY['Poor blood sugar control', 'Weight loss', 'Nerve problems'],
 ARRAY['Rare - excess excreted in urine']),

('chromium_polynicotinate', 'Chromium (Polynicotinate)', 'mineral', 'micromineral', 'mcg', 35, 25, NULL, 'Helps regulate blood sugar levels - Chromium polynicotinate form',
 ARRAY['Blood sugar regulation', 'Metabolism', 'Weight management'],
 ARRAY['Poor blood sugar control', 'Weight loss', 'Nerve problems'],
 ARRAY['Rare - excess excreted in urine']),

('molybdenum', 'Molybdenum', 'mineral', 'micromineral', 'mcg', 45, 45, 2000, 'Essential for enzyme function and detoxification',
 ARRAY['Enzyme function', 'Detoxification', 'Sulfite metabolism', 'Iron metabolism'],
 ARRAY['Sulfite sensitivity', 'Iron problems', 'Fatigue', 'Weakness'],
 ARRAY['Rare - may cause gout-like symptoms']),

('boron', 'Boron', 'mineral', 'micromineral', 'mg', 3, 3, 20, 'Important for bone health and hormone regulation',
 ARRAY['Bone health', 'Hormone regulation', 'Brain function', 'Joint health'],
 ARRAY['Bone problems', 'Hormone problems', 'Joint problems', 'Weakness'],
 ARRAY['Nausea', 'Vomiting', 'Diarrhea', 'Skin problems']),

('vanadium', 'Vanadium', 'mineral', 'micromineral', 'mcg', 1000, 1000, 1800, 'May help with blood sugar regulation',
 ARRAY['Blood sugar regulation', 'Bone health', 'Cholesterol management'],
 ARRAY['Blood sugar problems', 'Bone problems', 'Cholesterol problems'],
 ARRAY['Green tongue', 'Nausea', 'Diarrhea']),

('silicon', 'Silicon', 'mineral', 'micromineral', 'mg', 25, 25, NULL, 'Important for bone, skin, and hair health',
 ARRAY['Bone health', 'Skin health', 'Hair health', 'Nail health'],
 ARRAY['Bone problems', 'Skin problems', 'Hair problems', 'Nail problems'],
 ARRAY['Rare - excess excreted in urine']),

('nickel', 'Nickel', 'mineral', 'micromineral', 'mcg', 100, 100, 1000, 'Essential for enzyme function and iron metabolism',
 ARRAY['Enzyme function', 'Iron metabolism', 'Urea metabolism'],
 ARRAY['Iron problems', 'Urea problems', 'Fatigue', 'Weakness'],
 ARRAY['Skin problems', 'Lung problems', 'Allergic reactions']),

('cobalt', 'Cobalt', 'mineral', 'micromineral', 'mcg', 2.4, 2.4, NULL, 'Essential component of vitamin B12',
 ARRAY['B12 function', 'Red blood cell formation', 'Nerve function'],
 ARRAY['B12 deficiency', 'Anemia', 'Nerve problems', 'Fatigue'],
 ARRAY['Heart problems', 'Thyroid problems', 'Allergic reactions']);

-- Create indexes for vitamins and minerals table
CREATE INDEX IF NOT EXISTS idx_vitamins_minerals_name ON public.vitamins_minerals (name);
CREATE INDEX IF NOT EXISTS idx_vitamins_minerals_category ON public.vitamins_minerals (category);
CREATE INDEX IF NOT EXISTS idx_vitamins_minerals_subcategory ON public.vitamins_minerals (subcategory);
CREATE INDEX IF NOT EXISTS idx_vitamins_minerals_display_name ON public.vitamins_minerals (display_name);
