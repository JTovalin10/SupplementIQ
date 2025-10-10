-- 1) Drop dependent objects and tables (destructive)
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.preworkout_details CASCADE;
DROP TABLE IF EXISTS public.non_stim_preworkout_details CASCADE; -- Added this line
DROP TABLE IF EXISTS public.energy_drink_details CASCADE;
DROP TABLE IF EXISTS public.protein_details CASCADE;
DROP TABLE IF EXISTS public.amino_acid_details CASCADE;
DROP TABLE IF EXISTS public.fat_burner_details CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop types if they exist (to recreate cleanly)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        DROP TYPE user_role;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contribution_status') THEN
        DROP TYPE contribution_status;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category') THEN
        DROP TYPE product_category;
    END IF;
END $$;

-- 2) Create ENUM types
CREATE TYPE user_role AS ENUM ('newcomer', 'contributor', 'trusted_editor', 'moderator', 'admin', 'owner');
CREATE TYPE contribution_status AS ENUM ('pending', 'approved', 'rejected', 'needs_review');
-- UPDATED: Added 'non-stim-pre-workout' to the list
CREATE TYPE product_category AS ENUM ('protein', 'pre-workout', 'non-stim-pre-workout', 'energy-drink', 'bcaa', 'eaa', 'fat-burner', 'appetite-suppressant', 'creatine');

-- 3) Recreate tables
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    reputation_points INTEGER DEFAULT 0,
    role user_role DEFAULT 'newcomer',
    bio TEXT,
    avatar_url TEXT,
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
    transparency_score INTEGER DEFAULT 0 CHECK (transparency_score BETWEEN 0 AND 100),
    confidence_level TEXT DEFAULT 'estimated' CHECK (confidence_level IN ('verified', 'likely', 'estimated', 'unknown')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A')
    ) STORED
);

CREATE TABLE public.preworkout_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
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

-- NEW TABLE ADDED: Based on the provided image (2-scoop serving)
CREATE TABLE public.non_stim_preworkout_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
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

CREATE TABLE public.energy_drink_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
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

CREATE TABLE public.protein_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    protein_claim_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (protein_claim_g >= 0 OR protein_claim_g = -1),
    effective_protein_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (effective_protein_g >= 0 OR effective_protein_g = -1),
    whey_concentrate_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (whey_concentrate_g >= 0 OR whey_concentrate_g = -1),
    whey_isolate_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (whey_isolate_g >= 0 OR whey_isolate_g = -1),
    whey_hydrolysate_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (whey_hydrolysate_g >= 0 OR whey_hydrolysate_g = -1),
    casein_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (casein_g >= 0 OR casein_g = -1),
    egg_protein_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (egg_protein_g >= 0 OR egg_protein_g = -1),
    soy_protein_g DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (soy_protein_g >= 0 OR soy_protein_g = -1)
);

CREATE TABLE public.amino_acid_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
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

CREATE TABLE public.fat_burner_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
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

-- 4) Create sync function in auth schema (SECURITY DEFINER) to upsert into public.users
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

-- Revoke execute for safety (the trigger will run it)
REVOKE EXECUTE ON FUNCTION auth.sync_user_to_public() FROM PUBLIC;

-- 5) Create triggers on auth.users
DROP TRIGGER IF EXISTS users_sync_trigger ON auth.users;
CREATE TRIGGER users_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION auth.sync_user_to_public();

-- 6) Backfill public.users from existing auth.users
INSERT INTO public.users (id, username, email, created_at, updated_at)
SELECT id,
       COALESCE(raw_user_meta_data ->> 'username', split_part(email, '@', 1)) AS username,
       email,
       created_at,
       updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Indexes for RLS/performance
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON public.products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges (user_id);

-- Validate: show count placeholders (will be returned to client)
SELECT 'tables_created' AS action, count(*) AS cnt FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users','products','brands');