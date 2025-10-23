-- =================================================================
-- SCHEMA RESET SCRIPT
-- This section drops all tables (except for 'users'), types, and functions
-- to ensure a clean slate before recreating the schema.
-- =================================================================

-- LAB VERIFICATION FIELD MEANINGS:
-- Individual lab_verified_* SMALLINT fields for each ingredient:
-- NULL = No lab test performed for this specific ingredient
-- 1 = Lab test shows content matches or exceeds label claims
-- -1 = Lab test shows content significantly less than claimed

-- INGREDIENT VALUE FIELD MEANINGS:
-- For all mg/g fields with CHECK (field >= 0 OR field = -1):
-- >=0 = Contains the specified amount (in mg/g)
-- 0 = Not in the product (explicitly 0)
-- -1 = Not specified or it's a blend (amount unknown)
SET client_min_messages TO WARNING;

-- Drop all tables that depend on users, brands, or products
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
    public.pending_products,
    public.products,
    public.brands
CASCADE;

-- Drop all custom data types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS contribution_status CASCADE;
DROP TYPE IF EXISTS product_category CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_product_review_stats() CASCADE;

-- =================================================================
-- SCHEMA CREATION SCRIPT
-- This section creates the entire database schema from scratch.
-- =================================================================

-- 2) Create ENUM types
CREATE TYPE user_role AS ENUM ('newcomer', 'contributor', 'trusted_editor', 'moderator', 'admin', 'owner');
CREATE TYPE contribution_status AS ENUM ('pending', 'approved', 'rejected', 'needs_review');
CREATE TYPE product_category AS ENUM ('protein', 'pre-workout', 'non-stim-pre-workout', 'energy-drink', 'bcaa', 'eaa', 'fat-burner', 'appetite-suppressant', 'creatine');
CREATE TYPE lab_result AS ENUM ('verified', 'failed');

-- 3) Recreate tables
-- Note: 'public.users' is intentionally not dropped by the reset script.
-- The IF NOT EXISTS clause ensures this script won't fail if 'users' already exists.
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

CREATE TABLE public.user_badges (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

CREATE TABLE public.brands (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE,
    website TEXT,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Pending products table for contribution system
CREATE TABLE public.pending_products (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES public.brands(id),
    category product_category NOT NULL,
    product_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    description TEXT,
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

-- Product reviews and community comments
CREATE TABLE public.product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating DECIMAL(3,1) NOT NULL CHECK (rating BETWEEN 1.0 AND 10.0),
    title TEXT NOT NULL,
    comment VARCHAR(1000) NOT NULL,
    value_for_money INTEGER CHECK (value_for_money BETWEEN 1 AND 10),
    effectiveness INTEGER CHECK (effectiveness BETWEEN 1 AND 10),
    safety_concerns VARCHAR(1000), -- Corrected typo from VARHCAR to VARCHAR
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- Product images table
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

-- Lab verification results table for individual ingredient testing
-- LAB VERIFICATION FIELD MEANINGS:
-- lab_result SMALLINT field:
-- 1 = Lab test shows content matches or exceeds label claims
-- -1 = Lab test shows content significantly less than claimed
CREATE TABLE public.lab_verification_results (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER REFERENCES public.pending_products(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL, -- e.g., 'l_citrulline_mg', 'caffeine_anhydrous_mg'
    lab_result SMALLINT NOT NULL CHECK (lab_result IN (1, -1)), -- 1=verified, -1=failed
    lab_report_url TEXT, -- Optional link to lab report
    tested_at TIMESTAMPTZ DEFAULT NOW(),
    tested_by TEXT, -- Lab name or testing organization
    CONSTRAINT chk_lab_verification_link CHECK (num_nonnulls(product_id, pending_product_id) = 1),
    CONSTRAINT chk_lab_verification_unique UNIQUE (COALESCE(product_id, pending_product_id), ingredient_name)
);

-- Detail Tables
-- INGREDIENT VALUE FIELD MEANINGS:
-- For all mg/g fields with CHECK (field >= 0 OR field = -1):
-- >=0 = Contains the specified amount (in mg/g)
-- 0 = Not in the product (explicitly 0)
-- -1 = Not specified or it's a blend (amount unknown)
CREATE TABLE public.preworkout_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER UNIQUE REFERENCES public.pending_products(id) ON DELETE CASCADE,
    serving_scoops INTEGER,
    serving_g NUMERIC(5,1),
    flavors TEXT[] DEFAULT '{}',
    sugar_g INTEGER NOT NULL DEFAULT 0 CHECK (sugar_g >= 0 OR sugar_g = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    key_features TEXT[] DEFAULT array['pump','endurance','focus','power'],
    l_citrulline_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_citrulline_mg >= 0 OR l_citrulline_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    creatine_monohydrate_mg INTEGER NOT NULL DEFAULT 0 CHECK (creatine_monohydrate_mg >= 0 OR creatine_monohydrate_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    glycerpump_mg INTEGER NOT NULL DEFAULT 0 CHECK (glycerpump_mg >= 0 OR glycerpump_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    betaine_anhydrous_mg INTEGER NOT NULL DEFAULT 0 CHECK (betaine_anhydrous_mg >= 0 OR betaine_anhydrous_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    agmatine_sulfate_mg INTEGER NOT NULL DEFAULT 0 CHECK (agmatine_sulfate_mg >= 0 OR agmatine_sulfate_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    l_tyrosine_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_tyrosine_mg >= 0 OR l_tyrosine_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    caffeine_anhydrous_mg INTEGER NOT NULL DEFAULT 0 CHECK (caffeine_anhydrous_mg >= 0 OR caffeine_anhydrous_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    n_phenethyl_dimethylamine_citrate_mg INTEGER NOT NULL DEFAULT 0 CHECK (n_phenethyl_dimethylamine_citrate_mg >= 0 OR n_phenethyl_dimethylamine_citrate_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    kanna_extract_mg INTEGER NOT NULL DEFAULT 0 CHECK (kanna_extract_mg >= 0 OR kanna_extract_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    huperzine_a_mcg INTEGER NOT NULL DEFAULT 0 CHECK (huperzine_a_mcg >= 0 OR huperzine_a_mcg = -1), -- >=0=contains mcg, 0=not in product, -1=blend/unknown
    bioperine_mg INTEGER NOT NULL DEFAULT 0 CHECK (bioperine_mg >= 0 OR bioperine_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    -- Individual lab verification fields for each ingredient
    lab_verified_sugar_g SMALLINT CHECK (lab_verified_sugar_g IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_citrulline_mg SMALLINT CHECK (lab_verified_l_citrulline_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_creatine_monohydrate_mg SMALLINT CHECK (lab_verified_creatine_monohydrate_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_glycerpump_mg SMALLINT CHECK (lab_verified_glycerpump_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_betaine_anhydrous_mg SMALLINT CHECK (lab_verified_betaine_anhydrous_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_agmatine_sulfate_mg SMALLINT CHECK (lab_verified_agmatine_sulfate_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_tyrosine_mg SMALLINT CHECK (lab_verified_l_tyrosine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_caffeine_anhydrous_mg SMALLINT CHECK (lab_verified_caffeine_anhydrous_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_n_phenethyl_dimethylamine_citrate_mg SMALLINT CHECK (lab_verified_n_phenethyl_dimethylamine_citrate_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_kanna_extract_mg SMALLINT CHECK (lab_verified_kanna_extract_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_huperzine_a_mcg SMALLINT CHECK (lab_verified_huperzine_a_mcg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_bioperine_mg SMALLINT CHECK (lab_verified_bioperine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
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
    calories INTEGER NOT NULL DEFAULT 20 CHECK (calories >= 0 OR calories = -1), -- >=0=contains cal, 0=not in product, -1=blend/unknown
    total_carbohydrate_g INTEGER NOT NULL DEFAULT 4 CHECK (total_carbohydrate_g >= 0 OR total_carbohydrate_g = -1), -- >=0=contains g, 0=not in product, -1=blend/unknown
    niacin_mg INTEGER NOT NULL DEFAULT 32 CHECK (niacin_mg >= 0 OR niacin_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    vitamin_b6_mg INTEGER NOT NULL DEFAULT 20 CHECK (vitamin_b6_mg >= 0 OR vitamin_b6_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    vitamin_b12_mcg INTEGER NOT NULL DEFAULT 250 CHECK (vitamin_b12_mcg >= 0 OR vitamin_b12_mcg = -1), -- >=0=contains mcg, 0=not in product, -1=blend/unknown
    magnesium_mg INTEGER NOT NULL DEFAULT 50 CHECK (magnesium_mg >= 0 OR magnesium_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    sodium_mg INTEGER NOT NULL DEFAULT 420 CHECK (sodium_mg >= 0 OR sodium_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    potassium_mg INTEGER NOT NULL DEFAULT 420 CHECK (potassium_mg >= 0 OR potassium_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    l_citrulline_mg INTEGER NOT NULL DEFAULT 10000 CHECK (l_citrulline_mg >= 0 OR l_citrulline_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    creatine_monohydrate_mg INTEGER NOT NULL DEFAULT 5000 CHECK (creatine_monohydrate_mg >= 0 OR creatine_monohydrate_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    betaine_anhydrous_mg INTEGER NOT NULL DEFAULT 4000 CHECK (betaine_anhydrous_mg >= 0 OR betaine_anhydrous_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    glycerol_powder_mg INTEGER NOT NULL DEFAULT 4000 CHECK (glycerol_powder_mg >= 0 OR glycerol_powder_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    malic_acid_mg INTEGER NOT NULL DEFAULT 3000 CHECK (malic_acid_mg >= 0 OR malic_acid_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    taurine_mg INTEGER NOT NULL DEFAULT 3000 CHECK (taurine_mg >= 0 OR taurine_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    sodium_nitrate_mg INTEGER NOT NULL DEFAULT 1500 CHECK (sodium_nitrate_mg >= 0 OR sodium_nitrate_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    agmatine_sulfate_mg INTEGER NOT NULL DEFAULT 1000 CHECK (agmatine_sulfate_mg >= 0 OR agmatine_sulfate_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    vasodrive_ap_mg INTEGER NOT NULL DEFAULT 508 CHECK (vasodrive_ap_mg >= 0 OR vasodrive_ap_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    -- Individual lab verification fields for each ingredient
    lab_verified_calories SMALLINT CHECK (lab_verified_calories IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_total_carbohydrate_g SMALLINT CHECK (lab_verified_total_carbohydrate_g IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_niacin_mg SMALLINT CHECK (lab_verified_niacin_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_vitamin_b6_mg SMALLINT CHECK (lab_verified_vitamin_b6_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_vitamin_b12_mcg SMALLINT CHECK (lab_verified_vitamin_b12_mcg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_magnesium_mg SMALLINT CHECK (lab_verified_magnesium_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_sodium_mg SMALLINT CHECK (lab_verified_sodium_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_potassium_mg SMALLINT CHECK (lab_verified_potassium_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_citrulline_mg SMALLINT CHECK (lab_verified_l_citrulline_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_creatine_monohydrate_mg SMALLINT CHECK (lab_verified_creatine_monohydrate_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_betaine_anhydrous_mg SMALLINT CHECK (lab_verified_betaine_anhydrous_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_glycerol_powder_mg SMALLINT CHECK (lab_verified_glycerol_powder_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_malic_acid_mg SMALLINT CHECK (lab_verified_malic_acid_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_taurine_mg SMALLINT CHECK (lab_verified_taurine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_sodium_nitrate_mg SMALLINT CHECK (lab_verified_sodium_nitrate_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_agmatine_sulfate_mg SMALLINT CHECK (lab_verified_agmatine_sulfate_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_vasodrive_ap_mg SMALLINT CHECK (lab_verified_vasodrive_ap_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    CONSTRAINT chk_non_stim_preworkout_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

CREATE TABLE public.energy_drink_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER UNIQUE REFERENCES public.pending_products(id) ON DELETE CASCADE,
    serving_size_fl_oz INTEGER,
    flavors TEXT[] DEFAULT '{}',
    sugar_g INTEGER NOT NULL DEFAULT 0 CHECK (sugar_g >= 0 OR sugar_g = -1), -- >=0=contains g, 0=not in product, -1=blend/unknown
    key_features TEXT[] DEFAULT array['focus','nootropics','mental clarity','sugar-free'],
    caffeine_mg INTEGER NOT NULL DEFAULT 0 CHECK (caffeine_mg >= 0 OR caffeine_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    n_acetyl_l_tyrosine_mg INTEGER NOT NULL DEFAULT 0 CHECK (n_acetyl_l_tyrosine_mg >= 0 OR n_acetyl_l_tyrosine_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    alpha_gpc_mg INTEGER NOT NULL DEFAULT 0 CHECK (alpha_gpc_mg >= 0 OR alpha_gpc_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    l_theanine_mg INTEGER NOT NULL DEFAULT 0 CHECK (l_theanine_mg >= 0 OR l_theanine_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    huperzine_a_mcg INTEGER NOT NULL DEFAULT 0 CHECK (huperzine_a_mcg >= 0 OR huperzine_a_mcg = -1), -- >=0=contains mcg, 0=not in product, -1=blend/unknown
    uridine_monophosphate_mg INTEGER NOT NULL DEFAULT 0 CHECK (uridine_monophosphate_mg >= 0 OR uridine_monophosphate_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    saffron_extract_mg INTEGER NOT NULL DEFAULT 0 CHECK (saffron_extract_mg >= 0 OR saffron_extract_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    vitamin_c_mg INTEGER NOT NULL DEFAULT 0 CHECK (vitamin_c_mg >= 0 OR vitamin_c_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    niacin_b3_mg INTEGER NOT NULL DEFAULT 0 CHECK (niacin_b3_mg >= 0 OR niacin_b3_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    vitamin_b6_mg INTEGER NOT NULL DEFAULT 0 CHECK (vitamin_b6_mg >= 0 OR vitamin_b6_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    vitamin_b12_mcg INTEGER NOT NULL DEFAULT 0 CHECK (vitamin_b12_mcg >= 0 OR vitamin_b12_mcg = -1), -- >=0=contains mcg, 0=not in product, -1=blend/unknown
    pantothenic_acid_b5_mg INTEGER NOT NULL DEFAULT 0 CHECK (pantothenic_acid_b5_mg >= 0 OR pantothenic_acid_b5_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    -- Individual lab verification fields for each ingredient
    lab_verified_sugar_g SMALLINT CHECK (lab_verified_sugar_g IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_caffeine_mg SMALLINT CHECK (lab_verified_caffeine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_n_acetyl_l_tyrosine_mg SMALLINT CHECK (lab_verified_n_acetyl_l_tyrosine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_alpha_gpc_mg SMALLINT CHECK (lab_verified_alpha_gpc_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_theanine_mg SMALLINT CHECK (lab_verified_l_theanine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_huperzine_a_mcg SMALLINT CHECK (lab_verified_huperzine_a_mcg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_uridine_monophosphate_mg SMALLINT CHECK (lab_verified_uridine_monophosphate_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_saffron_extract_mg SMALLINT CHECK (lab_verified_saffron_extract_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_vitamin_c_mg SMALLINT CHECK (lab_verified_vitamin_c_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_niacin_b3_mg SMALLINT CHECK (lab_verified_niacin_b3_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_vitamin_b6_mg SMALLINT CHECK (lab_verified_vitamin_b6_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_vitamin_b12_mcg SMALLINT CHECK (lab_verified_vitamin_b12_mcg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_pantothenic_acid_b5_mg SMALLINT CHECK (lab_verified_pantothenic_acid_b5_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
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
    -- Individual lab verification fields for each ingredient
    lab_verified_protein_claim_g SMALLINT CHECK (lab_verified_protein_claim_g IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_effective_protein_g SMALLINT CHECK (lab_verified_effective_protein_g IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
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
    astragin_mg INTEGER NOT NULL DEFAULT 0 CHECK (astragin_mg >= 0 OR astragin_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    -- Individual lab verification fields for each ingredient
    lab_verified_total_eaas_mg SMALLINT CHECK (lab_verified_total_eaas_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_leucine_mg SMALLINT CHECK (lab_verified_l_leucine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_isoleucine_mg SMALLINT CHECK (lab_verified_l_isoleucine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_valine_mg SMALLINT CHECK (lab_verified_l_valine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_lysine_hcl_mg SMALLINT CHECK (lab_verified_l_lysine_hcl_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_threonine_mg SMALLINT CHECK (lab_verified_l_threonine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_phenylalanine_mg SMALLINT CHECK (lab_verified_l_phenylalanine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_tryptophan_mg SMALLINT CHECK (lab_verified_l_tryptophan_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_histidine_hcl_mg SMALLINT CHECK (lab_verified_l_histidine_hcl_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_l_methionine_mg SMALLINT CHECK (lab_verified_l_methionine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_betaine_anhydrous_mg SMALLINT CHECK (lab_verified_betaine_anhydrous_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_coconut_water_powder_mg SMALLINT CHECK (lab_verified_coconut_water_powder_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_astragin_mg SMALLINT CHECK (lab_verified_astragin_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
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
    bioperine_mg INTEGER NOT NULL DEFAULT 0 CHECK (bioperine_mg >= 0 OR bioperine_mg = -1), -- >=0=contains mg, 0=not in product, -1=blend/unknown
    -- Individual lab verification fields for each ingredient
    lab_verified_l_carnitine_l_tartrate_mg SMALLINT CHECK (lab_verified_l_carnitine_l_tartrate_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_green_tea_extract_mg SMALLINT CHECK (lab_verified_green_tea_extract_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_capsimax_mg SMALLINT CHECK (lab_verified_capsimax_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_grains_of_paradise_mg SMALLINT CHECK (lab_verified_grains_of_paradise_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_ksm66_ashwagandha_mg SMALLINT CHECK (lab_verified_ksm66_ashwagandha_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_kelp_extract_mcg SMALLINT CHECK (lab_verified_kelp_extract_mcg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_selenium_mcg SMALLINT CHECK (lab_verified_selenium_mcg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_zinc_picolinate_mg SMALLINT CHECK (lab_verified_zinc_picolinate_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_five_htp_mg SMALLINT CHECK (lab_verified_five_htp_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_caffeine_anhydrous_mg SMALLINT CHECK (lab_verified_caffeine_anhydrous_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_halostachine_mg SMALLINT CHECK (lab_verified_halostachine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_rauwolscine_mcg SMALLINT CHECK (lab_verified_rauwolscine_mcg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    lab_verified_bioperine_mg SMALLINT CHECK (lab_verified_bioperine_mg IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    CONSTRAINT chk_fat_burner_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

CREATE TABLE public.creatine_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    pending_product_id INTEGER UNIQUE REFERENCES public.pending_products(id) ON DELETE CASCADE,
    creatine_type_name VARCHAR(255) NOT NULL REFERENCES public.creatine_types(name),
    flavors TEXT[] DEFAULT '{}',
    serving_size_g DECIMAL(5,1) NOT NULL DEFAULT 0 CHECK (serving_size_g >= 0), -- Serving size in grams
    servings_per_container INTEGER NOT NULL DEFAULT 0 CHECK (servings_per_container >= 0), -- Number of servings per container
    -- Individual lab verification fields for each ingredient
    lab_verified_creatine_content_g SMALLINT CHECK (lab_verified_creatine_content_g IN (1, -1)), -- NULL=no test, 1=verified, -1=failed
    CONSTRAINT chk_creatine_link CHECK (num_nonnulls(product_id, pending_product_id) = 1)
);

CREATE TABLE public.creatine_types (
    name VARCHAR(255) PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('fundamental', 'salt', 'ester', 'chelate', 'processed')),
    recommended_daily_dose_g DECIMAL(5,1) NOT NULL CHECK (recommended_daily_dose_g > 0)
);


-- 4) Functions and Triggers
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


-- This function and trigger are assumed to already exist and are left untouched by the reset script.
CREATE OR REPLACE FUNCTION auth.sync_user_to_public() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        DELETE FROM public.users WHERE id = OLD.id;
        RETURN OLD;
    ELSE
        INSERT INTO public.users (id, username, email, created_at, updated_at)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
            NEW.email,
            NEW.created_at,
            NEW.updated_at
        )
        ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            email = EXCLUDED.email,
            updated_at = NOW();
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS users_sync_trigger ON auth.users;
CREATE TRIGGER users_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION auth.sync_user_to_public();

-- 6) Indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews (rating);
CREATE INDEX IF NOT EXISTS idx_pending_products_approval_status ON public.pending_products (approval_status);
CREATE INDEX IF NOT EXISTS idx_pending_products_submitted_by ON public.pending_products (submitted_by);
CREATE INDEX IF NOT EXISTS idx_pending_products_reviewed_by ON public.pending_products (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_pending_products_search_vector ON public.pending_products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON public.products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges (user_id);

-- 7) Insert Creatine Types Data
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

-- =================================================================
-- VITAMINS AND MINERALS REFERENCE TABLE
-- Comprehensive reference for all vitamins and minerals found in supplements
-- =================================================================

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

-- Insert comprehensive vitamins and minerals data
INSERT INTO public.vitamins_minerals (name, display_name, category, subcategory, unit, rda_adult_male, rda_adult_female, ul_adult, description, benefits, deficiency_symptoms, toxicity_symptoms) VALUES

-- Water-Soluble Vitamins - B Complex
('vitamin_b3_niacin', 'Vitamin B3 (Niacin)', 'vitamin', 'water_soluble', 'mg', 16, 14, 35, 'Essential for energy metabolism and skin health - Nicotinic acid form',
 ARRAY['Energy production', 'Skin health', 'Cholesterol management', 'Brain function'],
 ARRAY['Pellagra', 'Digestive issues', 'Skin problems', 'Mental confusion'],
 ARRAY['Flushing', 'Liver damage', 'Stomach ulcers', 'Vision problems']),

('vitamin_b3_niacinamide', 'Vitamin B3 (Niacinamide)', 'vitamin', 'water_soluble', 'mg', 16, 14, 35, 'Essential for energy metabolism and skin health - Niacinamide form (no flush)',
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
 ARRAY['Depression', 'Confusion', 'Weak immune system', 'Skin problems'],
 ARRAY['Nerve damage', 'Skin lesions', 'Photosensitivity']),

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

-- Major Minerals (Macrominerals)
('magnesium', 'Magnesium', 'mineral', 'macromineral', 'mg', 420, 320, 350, 'Essential for muscle and nerve function, bone health - Magnesium oxide/citrate form',
 ARRAY['Muscle function', 'Nerve function', 'Bone health', 'Heart rhythm'],
 ARRAY['Muscle cramps', 'Irregular heartbeat', 'Weakness', 'Personality changes'],
 ARRAY['Diarrhea', 'Nausea', 'Muscle weakness', 'Low blood pressure']),

('sodium', 'Sodium', 'mineral', 'electrolyte', 'mg', 2300, 2300, 2300, 'Essential for fluid balance and nerve function - Sodium chloride form',
 ARRAY['Fluid balance', 'Nerve function', 'Muscle contraction'],
 ARRAY['Muscle cramps', 'Headaches', 'Nausea', 'Fatigue'],
 ARRAY['High blood pressure', 'Heart disease', 'Stroke', 'Kidney disease']),

('potassium', 'Potassium', 'mineral', 'electrolyte', 'mg', 3400, 2600, NULL, 'Essential for heart rhythm and muscle function - Potassium chloride/citrate form',
 ARRAY['Heart rhythm', 'Muscle function', 'Blood pressure', 'Nerve function'],
 ARRAY['Muscle weakness', 'Irregular heartbeat', 'Fatigue', 'Constipation'],
 ARRAY['Heart rhythm problems', 'Muscle weakness', 'Nausea']),

-- Trace Minerals (Microminerals)
('chromium', 'Chromium', 'mineral', 'micromineral', 'mcg', 35, 25, NULL, 'Helps regulate blood sugar levels - Chromium picolinate/polynicotinate form',
 ARRAY['Blood sugar regulation', 'Metabolism', 'Weight management'],
 ARRAY['Poor blood sugar control', 'Weight loss', 'Nerve problems'],
 ARRAY['Rare - excess excreted in urine']);

-- Create indexes for vitamins and minerals table
CREATE INDEX IF NOT EXISTS idx_vitamins_minerals_name ON public.vitamins_minerals (name);
CREATE INDEX IF NOT EXISTS idx_vitamins_minerals_category ON public.vitamins_minerals (category);
CREATE INDEX IF NOT EXISTS idx_vitamins_minerals_subcategory ON public.vitamins_minerals (subcategory);
CREATE INDEX IF NOT EXISTS idx_vitamins_minerals_display_name ON public.vitamins_minerals (display_name);

-- Create views for easy querying
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

-- Add comments for documentation
COMMENT ON TABLE public.vitamins_minerals IS 'Reference table for vitamins and minerals found in workout supplements';
COMMENT ON COLUMN public.vitamins_minerals.rda_adult_male IS 'Recommended Daily Allowance for adult males (ages 19-70)';
COMMENT ON COLUMN public.vitamins_minerals.rda_adult_female IS 'Recommended Daily Allowance for adult females (ages 19-70)';
COMMENT ON COLUMN public.vitamins_minerals.ul_adult IS 'Upper Limit for adults - maximum safe daily intake';