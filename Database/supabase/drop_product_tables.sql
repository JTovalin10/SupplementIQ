-- =================================================================
-- COMPLETE SCHEMA RESET AND RECREATION SCRIPT
-- This script drops all product-related tables except for:
-- - public.users (preserved)
-- - public.vitamins_minerals (preserved)
-- Then recreates the entire schema with proper foreign key relationships
-- =================================================================

SET client_min_messages TO WARNING;

-- =================================================================
-- STEP 1: DROP ALL PRODUCT-RELATED TABLES
-- =================================================================

-- Drop all product-related tables in the correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS
    public.user_badges,
    public.product_reviews,
    public.product_images,
    public.lab_verification_results,
    public.preworkout_details,
    public.non_stim_preworkout_details,
    public.energy_drink_details,
    public.protein_details,
    public.amino_acid_details,
    public.fat_burner_details,
    public.creatine_details,
    public.creatine_types,
    public.pending_products,
    public.products,
    public.brands
CASCADE;

-- Drop custom data types related to products
DROP TYPE IF EXISTS contribution_status CASCADE;
DROP TYPE IF EXISTS product_category CASCADE;
DROP TYPE IF EXISTS lab_result CASCADE;

-- Drop functions related to products
DROP FUNCTION IF EXISTS public.update_product_review_stats() CASCADE;

-- Drop views related to vitamins (these will be recreated)
DROP VIEW IF EXISTS public.vitamins_by_category CASCADE;
DROP VIEW IF EXISTS public.vitamin_mineral_rda CASCADE;

-- =================================================================
-- STEP 2: CREATE NEW SCHEMA WITH FOREIGN KEY RELATIONSHIPS
-- =================================================================

-- Create ENUM types FIRST (before any tables that use them)
CREATE TYPE user_role AS ENUM ('newcomer', 'contributor', 'trusted_editor', 'moderator', 'admin', 'owner');
CREATE TYPE contribution_status AS ENUM ('pending', 'approved', 'rejected', 'needs_review');
CREATE TYPE product_category AS ENUM ('protein', 'pre-workout', 'non-stim-pre-workout', 'energy-drink', 'bcaa', 'eaa', 'fat-burner', 'appetite-suppressant', 'creatine');
CREATE TYPE lab_result AS ENUM ('verified', 'failed');

-- Create brands table
CREATE TABLE public.brands (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE,
    website TEXT,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES public.brands(id),
    category product_category NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    description TEXT,
    price DECIMAL(10,2) CHECK (price > 0),
    currency VARCHAR(3) DEFAULT 'USD',
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

-- Create pending_products table with foreign keys
CREATE TABLE public.pending_products (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES public.brands(id),
    category product_category NOT NULL,
    product_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    description TEXT,
    price DECIMAL(10,2) CHECK (price > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    servings_per_container INTEGER,
    serving_size_g DECIMAL(5,2),
    dosage_rating INTEGER DEFAULT 0 CHECK (dosage_rating BETWEEN 0 AND 100),
    danger_rating INTEGER DEFAULT 0 CHECK (danger_rating BETWEEN 0 AND 100),
    approval_status INTEGER DEFAULT 0 CHECK (approval_status IN (1, 0, -1)),
    submitted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(product_name, '')), 'A')
    ) STORED
);

-- Create user_badges table
CREATE TABLE public.user_badges (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- Create product_reviews table
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

-- Create product_images table with foreign keys to both products and pending_products
CREATE TABLE public.product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER REFERENCES public.pending_products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    alt_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_product_images_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

-- Create lab_verification_results table with foreign keys to both products and pending_products
CREATE TABLE public.lab_verification_results (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER REFERENCES public.pending_products(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    lab_result SMALLINT NOT NULL CHECK (lab_result IN (1, -1)),
    lab_report_url TEXT,
    tested_at TIMESTAMPTZ DEFAULT NOW(),
    tested_by TEXT,
    CONSTRAINT chk_lab_verification_link CHECK (num_nonnulls(product_id, pending_product_id) = 1),
    CONSTRAINT chk_lab_verification_unique UNIQUE (product_id, ingredient_name),
    CONSTRAINT chk_lab_verification_unique_pending UNIQUE (pending_product_id, ingredient_name)
);

-- Create creatine_types table
CREATE TABLE public.creatine_types (
    name VARCHAR(255) PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('fundamental', 'salt', 'ester', 'chelate', 'processed')),
    recommended_daily_dose_g DECIMAL(5,1) NOT NULL CHECK (recommended_daily_dose_g > 0)
);

-- Create all detail tables with foreign keys to both products and pending_products
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
    -- Lab verification fields
    lab_verified_sugar_g SMALLINT CHECK (lab_verified_sugar_g IN (1, -1)),
    lab_verified_l_citrulline_mg SMALLINT CHECK (lab_verified_l_citrulline_mg IN (1, -1)),
    lab_verified_creatine_monohydrate_mg SMALLINT CHECK (lab_verified_creatine_monohydrate_mg IN (1, -1)),
    lab_verified_glycerpump_mg SMALLINT CHECK (lab_verified_glycerpump_mg IN (1, -1)),
    lab_verified_betaine_anhydrous_mg SMALLINT CHECK (lab_verified_betaine_anhydrous_mg IN (1, -1)),
    lab_verified_agmatine_sulfate_mg SMALLINT CHECK (lab_verified_agmatine_sulfate_mg IN (1, -1)),
    lab_verified_l_tyrosine_mg SMALLINT CHECK (lab_verified_l_tyrosine_mg IN (1, -1)),
    lab_verified_caffeine_anhydrous_mg SMALLINT CHECK (lab_verified_caffeine_anhydrous_mg IN (1, -1)),
    lab_verified_n_phenethyl_dimethylamine_citrate_mg SMALLINT CHECK (lab_verified_n_phenethyl_dimethylamine_citrate_mg IN (1, -1)),
    lab_verified_kanna_extract_mg SMALLINT CHECK (lab_verified_kanna_extract_mg IN (1, -1)),
    lab_verified_huperzine_a_mcg SMALLINT CHECK (lab_verified_huperzine_a_mcg IN (1, -1)),
    lab_verified_bioperine_mg SMALLINT CHECK (lab_verified_bioperine_mg IN (1, -1)),
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
    -- Lab verification fields
    lab_verified_calories SMALLINT CHECK (lab_verified_calories IN (1, -1)),
    lab_verified_total_carbohydrate_g SMALLINT CHECK (lab_verified_total_carbohydrate_g IN (1, -1)),
    lab_verified_niacin_mg SMALLINT CHECK (lab_verified_niacin_mg IN (1, -1)),
    lab_verified_vitamin_b6_mg SMALLINT CHECK (lab_verified_vitamin_b6_mg IN (1, -1)),
    lab_verified_vitamin_b12_mcg SMALLINT CHECK (lab_verified_vitamin_b12_mcg IN (1, -1)),
    lab_verified_magnesium_mg SMALLINT CHECK (lab_verified_magnesium_mg IN (1, -1)),
    lab_verified_sodium_mg SMALLINT CHECK (lab_verified_sodium_mg IN (1, -1)),
    lab_verified_potassium_mg SMALLINT CHECK (lab_verified_potassium_mg IN (1, -1)),
    lab_verified_l_citrulline_mg SMALLINT CHECK (lab_verified_l_citrulline_mg IN (1, -1)),
    lab_verified_creatine_monohydrate_mg SMALLINT CHECK (lab_verified_creatine_monohydrate_mg IN (1, -1)),
    lab_verified_betaine_anhydrous_mg SMALLINT CHECK (lab_verified_betaine_anhydrous_mg IN (1, -1)),
    lab_verified_glycerol_powder_mg SMALLINT CHECK (lab_verified_glycerol_powder_mg IN (1, -1)),
    lab_verified_malic_acid_mg SMALLINT CHECK (lab_verified_malic_acid_mg IN (1, -1)),
    lab_verified_taurine_mg SMALLINT CHECK (lab_verified_taurine_mg IN (1, -1)),
    lab_verified_sodium_nitrate_mg SMALLINT CHECK (lab_verified_sodium_nitrate_mg IN (1, -1)),
    lab_verified_agmatine_sulfate_mg SMALLINT CHECK (lab_verified_agmatine_sulfate_mg IN (1, -1)),
    lab_verified_vasodrive_ap_mg SMALLINT CHECK (lab_verified_vasodrive_ap_mg IN (1, -1)),
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
    -- Lab verification fields
    lab_verified_sugar_g SMALLINT CHECK (lab_verified_sugar_g IN (1, -1)),
    lab_verified_caffeine_mg SMALLINT CHECK (lab_verified_caffeine_mg IN (1, -1)),
    lab_verified_n_acetyl_l_tyrosine_mg SMALLINT CHECK (lab_verified_n_acetyl_l_tyrosine_mg IN (1, -1)),
    lab_verified_alpha_gpc_mg SMALLINT CHECK (lab_verified_alpha_gpc_mg IN (1, -1)),
    lab_verified_l_theanine_mg SMALLINT CHECK (lab_verified_l_theanine_mg IN (1, -1)),
    lab_verified_huperzine_a_mcg SMALLINT CHECK (lab_verified_huperzine_a_mcg IN (1, -1)),
    lab_verified_uridine_monophosphate_mg SMALLINT CHECK (lab_verified_uridine_monophosphate_mg IN (1, -1)),
    lab_verified_saffron_extract_mg SMALLINT CHECK (lab_verified_saffron_extract_mg IN (1, -1)),
    lab_verified_vitamin_c_mg SMALLINT CHECK (lab_verified_vitamin_c_mg IN (1, -1)),
    lab_verified_niacin_b3_mg SMALLINT CHECK (lab_verified_niacin_b3_mg IN (1, -1)),
    lab_verified_vitamin_b6_mg SMALLINT CHECK (lab_verified_vitamin_b6_mg IN (1, -1)),
    lab_verified_vitamin_b12_mcg SMALLINT CHECK (lab_verified_vitamin_b12_mcg IN (1, -1)),
    lab_verified_pantothenic_acid_b5_mg SMALLINT CHECK (lab_verified_pantothenic_acid_b5_mg IN (1, -1)),
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
    -- Lab verification fields
    lab_verified_protein_claim_g SMALLINT CHECK (lab_verified_protein_claim_g IN (1, -1)),
    lab_verified_effective_protein_g SMALLINT CHECK (lab_verified_effective_protein_g IN (1, -1)),
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
    -- Lab verification fields
    lab_verified_total_eaas_mg SMALLINT CHECK (lab_verified_total_eaas_mg IN (1, -1)),
    lab_verified_l_leucine_mg SMALLINT CHECK (lab_verified_l_leucine_mg IN (1, -1)),
    lab_verified_l_isoleucine_mg SMALLINT CHECK (lab_verified_l_isoleucine_mg IN (1, -1)),
    lab_verified_l_valine_mg SMALLINT CHECK (lab_verified_l_valine_mg IN (1, -1)),
    lab_verified_l_lysine_hcl_mg SMALLINT CHECK (lab_verified_l_lysine_hcl_mg IN (1, -1)),
    lab_verified_l_threonine_mg SMALLINT CHECK (lab_verified_l_threonine_mg IN (1, -1)),
    lab_verified_l_phenylalanine_mg SMALLINT CHECK (lab_verified_l_phenylalanine_mg IN (1, -1)),
    lab_verified_l_tryptophan_mg SMALLINT CHECK (lab_verified_l_tryptophan_mg IN (1, -1)),
    lab_verified_l_histidine_hcl_mg SMALLINT CHECK (lab_verified_l_histidine_hcl_mg IN (1, -1)),
    lab_verified_l_methionine_mg SMALLINT CHECK (lab_verified_l_methionine_mg IN (1, -1)),
    lab_verified_betaine_anhydrous_mg SMALLINT CHECK (lab_verified_betaine_anhydrous_mg IN (1, -1)),
    lab_verified_coconut_water_powder_mg SMALLINT CHECK (lab_verified_coconut_water_powder_mg IN (1, -1)),
    lab_verified_astragin_mg SMALLINT CHECK (lab_verified_astragin_mg IN (1, -1)),
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
    -- Lab verification fields
    lab_verified_l_carnitine_l_tartrate_mg SMALLINT CHECK (lab_verified_l_carnitine_l_tartrate_mg IN (1, -1)),
    lab_verified_green_tea_extract_mg SMALLINT CHECK (lab_verified_green_tea_extract_mg IN (1, -1)),
    lab_verified_capsimax_mg SMALLINT CHECK (lab_verified_capsimax_mg IN (1, -1)),
    lab_verified_grains_of_paradise_mg SMALLINT CHECK (lab_verified_grains_of_paradise_mg IN (1, -1)),
    lab_verified_ksm66_ashwagandha_mg SMALLINT CHECK (lab_verified_ksm66_ashwagandha_mg IN (1, -1)),
    lab_verified_kelp_extract_mcg SMALLINT CHECK (lab_verified_kelp_extract_mcg IN (1, -1)),
    lab_verified_selenium_mcg SMALLINT CHECK (lab_verified_selenium_mcg IN (1, -1)),
    lab_verified_zinc_picolinate_mg SMALLINT CHECK (lab_verified_zinc_picolinate_mg IN (1, -1)),
    lab_verified_five_htp_mg SMALLINT CHECK (lab_verified_five_htp_mg IN (1, -1)),
    lab_verified_caffeine_anhydrous_mg SMALLINT CHECK (lab_verified_caffeine_anhydrous_mg IN (1, -1)),
    lab_verified_halostachine_mg SMALLINT CHECK (lab_verified_halostachine_mg IN (1, -1)),
    lab_verified_rauwolscine_mcg SMALLINT CHECK (lab_verified_rauwolscine_mcg IN (1, -1)),
    lab_verified_bioperine_mg SMALLINT CHECK (lab_verified_bioperine_mg IN (1, -1)),
    CONSTRAINT chk_fat_burner_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

CREATE TABLE public.creatine_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER UNIQUE REFERENCES public.pending_products(id) ON DELETE CASCADE,
    creatine_type_name VARCHAR(255) NOT NULL REFERENCES public.creatine_types(name),
    flavors TEXT[] DEFAULT '{}',
    serving_size_g DECIMAL(5,1) NOT NULL DEFAULT 0 CHECK (serving_size_g >= 0),
    servings_per_container INTEGER NOT NULL DEFAULT 0 CHECK (servings_per_container >= 0),
    -- Lab verification fields
    lab_verified_creatine_content_g SMALLINT CHECK (lab_verified_creatine_content_g IN (1, -1)),
    CONSTRAINT chk_creatine_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

-- =================================================================
-- STEP 3: CREATE FUNCTIONS, TRIGGERS, AND INDEXES
-- =================================================================

-- Create functions and triggers
CREATE OR REPLACE FUNCTION public.update_product_review_stats() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    new_avg_rating DECIMAL(3,1);
    new_total_reviews INTEGER;
BEGIN
    SELECT
        COALESCE(AVG(rating), 0.0),
        COUNT(*)
    INTO new_avg_rating, new_total_reviews
    FROM public.product_reviews
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);

    UPDATE public.products
    SET
        community_rating = new_avg_rating,
        total_reviews = new_total_reviews,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER product_reviews_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_review_stats();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews (rating);
CREATE INDEX IF NOT EXISTS idx_pending_products_approval_status ON public.pending_products (approval_status);
CREATE INDEX IF NOT EXISTS idx_pending_products_submitted_by ON public.pending_products (submitted_by);
CREATE INDEX IF NOT EXISTS idx_pending_products_reviewed_by ON public.pending_products (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_pending_products_search_vector ON public.pending_products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON public.products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges (user_id);

-- =================================================================
-- STEP 4: INSERT REFERENCE DATA
-- =================================================================

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

-- Recreate vitamins views
CREATE OR REPLACE VIEW public.vitamins_by_category AS
SELECT 
    category,
    subcategory,
    COUNT(*) as count,
    ARRAY_AGG(name ORDER BY display_name) as names,
    ARRAY_AGG(display_name ORDER BY display_name) as display_names
FROM public.vitamins_minerals
GROUP BY category, subcategory
ORDER BY category, subcategory;

CREATE OR REPLACE VIEW public.vitamin_mineral_rda AS
SELECT 
    name,
    display_name,
    category,
    unit,
    rda_adult_male,
    rda_adult_female,
    ul_adult,
    CASE 
        WHEN ul_adult IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END as has_upper_limit
FROM public.vitamins_minerals
WHERE rda_adult_male IS NOT NULL OR rda_adult_female IS NOT NULL
ORDER BY category, display_name;

-- =================================================================
-- COMPLETION MESSAGE
-- =================================================================

COMMENT ON SCHEMA public IS 'Schema successfully updated with pending_products foreign key relationships. Ready for use.';
