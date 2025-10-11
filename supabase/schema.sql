-- ####################################################################
-- ## 1) ENUM TYPES
-- ####################################################################

CREATE TYPE user_role AS ENUM ('newcomer', 'contributor', 'trusted_editor', 'moderator', 'admin', 'owner');
CREATE TYPE contribution_status AS ENUM ('pending', 'approved', 'rejected', 'needs_review');
CREATE TYPE product_category AS ENUM ('protein', 'pre-workout', 'non-stim-pre-workout', 'energy-drink', 'bcaa', 'eaa', 'fat-burner', 'appetite-suppressant', 'creatine');

-- ENUMs for the new moderation queue
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE change_type AS ENUM ('add', 'update', 'delete');


-- ####################################################################
-- ## 2) PUBLIC "LIVE" TABLES
-- ####################################################################

CREATE TABLE IF NOT EXISTS public.users (
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

CREATE TABLE IF NOT EXISTS public.user_badges (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

CREATE TABLE IF NOT EXISTS public.brands (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE,
    website TEXT,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES public.brands(id),
    category product_category NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    release_year smallint,
    image_url TEXT,
    description TEXT,
    servings_per_container INTEGER,
    price decimal(5,2) NOT NULL,
    serving_size_g DECIMAL(5,2),
    transparency_score INTEGER DEFAULT 0 CHECK (transparency_score BETWEEN 0 AND 100),
    confidence_level TEXT DEFAULT 'estimated' CHECK (confidence_level IN ('verified', 'likely', 'estimated', 'unknown')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A')
    ) STORED
);

CREATE TABLE IF NOT EXISTS public.preworkout_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    serving_scoops INTEGER,
    serving_g NUMERIC(5,1),
    sugar_g INTEGER NOT NULL DEFAULT 0,
    key_features TEXT[] DEFAULT array['pump','endurance','focus','power'],
    l_citrulline_mg INTEGER NOT NULL DEFAULT 0,
    creatine_monohydrate_mg INTEGER NOT NULL DEFAULT 0,
    glycerpump_mg INTEGER NOT NULL DEFAULT 0,
    betaine_anhydrous_mg INTEGER NOT NULL DEFAULT 0,
    agmatine_sulfate_mg INTEGER NOT NULL DEFAULT 0,
    l_tyrosine_mg INTEGER NOT NULL DEFAULT 0,
    caffeine_anhydrous_mg INTEGER NOT NULL DEFAULT 0,
    n_phenethyl_dimethylamine_citrate_mg INTEGER NOT NULL DEFAULT 0,
    kanna_extract_mg INTEGER NOT NULL DEFAULT 0,
    huperzine_a_mcg INTEGER NOT NULL DEFAULT 0,
    bioperine_mg INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.non_stim_preworkout_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    serving_scoops INTEGER DEFAULT 2,
    serving_g NUMERIC(5,1) DEFAULT 40.2,
    key_features TEXT[] DEFAULT array['pump','endurance','focus','power', 'non-stim'],
    calories INTEGER NOT NULL DEFAULT 20,
    total_carbohydrate_g INTEGER NOT NULL DEFAULT 4,
    niacin_mg INTEGER NOT NULL DEFAULT 32,
    vitamin_b6_mg INTEGER NOT NULL DEFAULT 20,
    vitamin_b12_mcg INTEGER NOT NULL DEFAULT 250,
    magnesium_mg INTEGER NOT NULL DEFAULT 50,
    sodium_mg INTEGER NOT NULL DEFAULT 420,
    potassium_mg INTEGER NOT NULL DEFAULT 420,
    l_citrulline_mg INTEGER NOT NULL DEFAULT 10000,
    creatine_monohydrate_mg INTEGER NOT NULL DEFAULT 5000,
    betaine_anhydrous_mg INTEGER NOT NULL DEFAULT 4000,
    glycerol_powder_mg INTEGER NOT NULL DEFAULT 4000,
    malic_acid_mg INTEGER NOT NULL DEFAULT 3000,
    taurine_mg INTEGER NOT NULL DEFAULT 3000,
    sodium_nitrate_mg INTEGER NOT NULL DEFAULT 1500,
    agmatine_sulfate_mg INTEGER NOT NULL DEFAULT 1000,
    vasodrive_ap_mg INTEGER NOT NULL DEFAULT 508
);

CREATE TABLE IF NOT EXISTS public.energy_drink_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    serving_size_fl_oz INTEGER,
    sugar_g INTEGER NOT NULL DEFAULT 0,
    key_features TEXT[] DEFAULT array['focus','nootropics','mental clarity','sugar-free'],
    caffeine_mg INTEGER NOT NULL DEFAULT 0,
    n_acetyl_l_tyrosine_mg INTEGER NOT NULL DEFAULT 0,
    alpha_gpc_mg INTEGER NOT NULL DEFAULT 0,
    l_theanine_mg INTEGER NOT NULL DEFAULT 0,
    huperzine_a_mcg INTEGER NOT NULL DEFAULT 0,
    uridine_monophosphate_mg INTEGER NOT NULL DEFAULT 0,
    saffron_extract_mg INTEGER NOT NULL DEFAULT 0,
    vitamin_c_mg INTEGER NOT NULL DEFAULT 0,
    niacin_b3_mg INTEGER NOT NULL DEFAULT 0,
    vitamin_b6_mg INTEGER NOT NULL DEFAULT 0,
    vitamin_b12_mcg INTEGER NOT NULL DEFAULT 0,
    pantothenic_acid_b5_mg INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.protein_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    protein_claim_g DECIMAL(5,2) NOT NULL DEFAULT 0,
    effective_protein_g DECIMAL(5,2) NOT NULL DEFAULT 0,
    whey_concentrate_g DECIMAL(5,2) NOT NULL DEFAULT 0,
    whey_isolate_g DECIMAL(5,2) NOT NULL DEFAULT 0,
    whey_hydrolysate_g DECIMAL(5,2) NOT NULL DEFAULT 0,
    casein_g DECIMAL(5,2) NOT NULL DEFAULT 0,
    egg_protein_g DECIMAL(5,2) NOT NULL DEFAULT 0,
    soy_protein_g DECIMAL(5,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.amino_acid_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    key_features TEXT[] DEFAULT array['recovery','hydration','muscle protein synthesis'],
    total_eaas_mg INTEGER NOT NULL DEFAULT 0,
    l_leucine_mg INTEGER NOT NULL DEFAULT 0,
    l_isoleucine_mg INTEGER NOT NULL DEFAULT 0,
    l_valine_mg INTEGER NOT NULL DEFAULT 0,
    l_lysine_hcl_mg INTEGER NOT NULL DEFAULT 0,
    l_threonine_mg INTEGER NOT NULL DEFAULT 0,
    l_phenylalanine_mg INTEGER NOT NULL DEFAULT 0,
    l_tryptophan_mg INTEGER NOT NULL DEFAULT 0,
    l_histidine_hcl_mg INTEGER NOT NULL DEFAULT 0,
    l_methionine_mg INTEGER NOT NULL DEFAULT 0,
    betaine_anhydrous_mg INTEGER NOT NULL DEFAULT 0,
    coconut_water_powder_mg INTEGER NOT NULL DEFAULT 0,
    astragin_mg INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.fat_burner_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    stimulant_based BOOLEAN DEFAULT TRUE,
    key_features TEXT[] DEFAULT array['thermogenesis','appetite suppression','metabolism','energy'],
    l_carnitine_l_tartrate_mg INTEGER NOT NULL DEFAULT 0,
    green_tea_extract_mg INTEGER NOT NULL DEFAULT 0,
    capsimax_mg INTEGER NOT NULL DEFAULT 0,
    grains_of_paradise_mg INTEGER NOT NULL DEFAULT 0,
    ksm66_ashwagandha_mg INTEGER NOT NULL DEFAULT 0,
    kelp_extract_mcg INTEGER NOT NULL DEFAULT 0,
    selenium_mcg INTEGER NOT NULL DEFAULT 0,
    zinc_picolinate_mg INTEGER NOT NULL DEFAULT 0,
    five_htp_mg INTEGER NOT NULL DEFAULT 0,
    caffeine_anhydrous_mg INTEGER NOT NULL DEFAULT 0,
    halostachine_mg INTEGER NOT NULL DEFAULT 0,
    rauwolscine_mcg INTEGER NOT NULL DEFAULT 0,
    bioperine_mg INTEGER NOT NULL DEFAULT 0
);


-- ####################################################################
-- ## 3) PENDING "STAGING" TABLES FOR MODERATION
-- ####################################################################

CREATE TABLE public.pending_products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
    submitted_by UUID NOT NULL REFERENCES public.users(id),
    status approval_status DEFAULT 'pending',
    job_type change_type NOT NULL,
    brand_id INTEGER NOT NULL REFERENCES public.brands(id),
    category product_category NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    release_year smallint,
    image_url TEXT,
    description TEXT,
    servings_per_container INTEGER,
    price decimal(5,2) NOT NULL,
    serving_size_g DECIMAL(5,2),
    transparency_score INTEGER DEFAULT 0 CHECK (transparency_score BETWEEN 0 AND 100),
    confidence_level TEXT DEFAULT 'estimated' CHECK (confidence_level IN ('verified', 'likely', 'estimated', 'unknown')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

CREATE TABLE public.pending_preworkout_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.pending_products(id) ON DELETE CASCADE,
    serving_scoops INTEGER, serving_g NUMERIC(5,1), sugar_g INTEGER NOT NULL DEFAULT 0,
    key_features TEXT[] DEFAULT array['pump','endurance','focus','power'],
    l_citrulline_mg INTEGER NOT NULL DEFAULT 0, creatine_monohydrate_mg INTEGER NOT NULL DEFAULT 0,
    glycerpump_mg INTEGER NOT NULL DEFAULT 0, betaine_anhydrous_mg INTEGER NOT NULL DEFAULT 0,
    agmatine_sulfate_mg INTEGER NOT NULL DEFAULT 0, l_tyrosine_mg INTEGER NOT NULL DEFAULT 0,
    caffeine_anhydrous_mg INTEGER NOT NULL DEFAULT 0, n_phenethyl_dimethylamine_citrate_mg INTEGER NOT NULL DEFAULT 0,
    kanna_extract_mg INTEGER NOT NULL DEFAULT 0, huperzine_a_mcg INTEGER NOT NULL DEFAULT 0,
    bioperine_mg INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.pending_non_stim_preworkout_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.pending_products(id) ON DELETE CASCADE,
    serving_scoops INTEGER, serving_g NUMERIC(5,1), key_features TEXT[], calories INTEGER, total_carbohydrate_g INTEGER,
    niacin_mg INTEGER, vitamin_b6_mg INTEGER, vitamin_b12_mcg INTEGER, magnesium_mg INTEGER, sodium_mg INTEGER, potassium_mg INTEGER,
    l_citrulline_mg INTEGER, creatine_monohydrate_mg INTEGER, betaine_anhydrous_mg INTEGER, glycerol_powder_mg INTEGER,
    malic_acid_mg INTEGER, taurine_mg INTEGER, sodium_nitrate_mg INTEGER, agmatine_sulfate_mg INTEGER, vasodrive_ap_mg INTEGER
);

CREATE TABLE public.pending_energy_drink_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.pending_products(id) ON DELETE CASCADE,
    serving_size_fl_oz INTEGER, sugar_g INTEGER, key_features TEXT[], caffeine_mg INTEGER, n_acetyl_l_tyrosine_mg INTEGER,
    alpha_gpc_mg INTEGER, l_theanine_mg INTEGER, huperzine_a_mcg INTEGER, uridine_monophosphate_mg INTEGER,
    saffron_extract_mg INTEGER, vitamin_c_mg INTEGER, niacin_b3_mg INTEGER, vitamin_b6_mg INTEGER,
    vitamin_b12_mcg INTEGER, pantothenic_acid_b5_mg INTEGER
);

CREATE TABLE public.pending_protein_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.pending_products(id) ON DELETE CASCADE,
    protein_claim_g DECIMAL(5,2), effective_protein_g DECIMAL(5,2), whey_concentrate_g DECIMAL(5,2),
    whey_isolate_g DECIMAL(5,2), whey_hydrolysate_g DECIMAL(5,2), casein_g DECIMAL(5,2),
    egg_protein_g DECIMAL(5,2), soy_protein_g DECIMAL(5,2)
);

CREATE TABLE public.pending_amino_acid_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.pending_products(id) ON DELETE CASCADE,
    key_features TEXT[], total_eaas_mg INTEGER, l_leucine_mg INTEGER, l_isoleucine_mg INTEGER, l_valine_mg INTEGER,
    l_lysine_hcl_mg INTEGER, l_threonine_mg INTEGER, l_phenylalanine_mg INTEGER, l_tryptophan_mg INTEGER,
    l_histidine_hcl_mg INTEGER, l_methionine_mg INTEGER, betaine_anhydrous_mg INTEGER,
    coconut_water_powder_mg INTEGER, astragin_mg INTEGER
);

CREATE TABLE public.pending_fat_burner_details (
    product_id INTEGER PRIMARY KEY REFERENCES public.pending_products(id) ON DELETE CASCADE,
    stimulant_based BOOLEAN, key_features TEXT[], l_carnitine_l_tartrate_mg INTEGER, green_tea_extract_mg INTEGER,
    capsimax_mg INTEGER, grains_of_paradise_mg INTEGER, ksm66_ashwagandha_mg INTEGER, kelp_extract_mcg INTEGER,
    selenium_mcg INTEGER, zinc_picolinate_mg INTEGER, five_htp_mg INTEGER, caffeine_anhydrous_mg INTEGER,
    halostachine_mg INTEGER, rauwolscine_mcg INTEGER, bioperine_mg INTEGER
);


-- ####################################################################
-- ## 4) FUNCTIONS & TRIGGERS
-- ####################################################################

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

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS users_sync_trigger ON auth.users;
CREATE TRIGGER users_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION auth.sync_user_to_public();


-- ####################################################################
-- ## 5) BACKFILL & INDEXES
-- ####################################################################

-- Backfill public.users from existing auth.users
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

-- Indexes for new pending table
CREATE INDEX IF NOT EXISTS idx_pending_products_submitted_by ON public.pending_products (submitted_by);
CREATE INDEX IF NOT EXISTS idx_pending_products_status ON public.pending_products (status);