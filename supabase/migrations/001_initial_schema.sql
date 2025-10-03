-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE product_category AS ENUM (
  'protein_powder',
  'mass_gainer', 
  'pre_workout',
  'post_workout',
  'multivitamin',
  'omega_3',
  'creatine',
  'bcaa',
  'other'
);

CREATE TYPE ingredient_type AS ENUM (
  'protein_source',
  'carbohydrate',
  'fat',
  'vitamin',
  'mineral',
  'amino_acid',
  'sweetener',
  'flavoring',
  'preservative',
  'other'
);

CREATE TYPE contribution_type AS ENUM (
  'blend_ratios',
  'ingredient_list',
  'nutrition_facts',
  'product_image',
  'price_update',
  'transparency_improvement'
);

CREATE TYPE verification_level AS ENUM (
  'unverified',
  'verified',
  'expert',
  'moderator'
);

CREATE TYPE contribution_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'needs_review'
);

CREATE TYPE vote_type AS ENUM (
  'approve',
  'reject',
  'needs_changes'
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  reputation_score INTEGER DEFAULT 0,
  verification_level verification_level DEFAULT 'unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredients table
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type ingredient_type NOT NULL,
  protein_content DECIMAL(5,2) NOT NULL, -- percentage
  bioavailability DECIMAL(3,2) NOT NULL, -- 0-1 scale
  amino_acid_profile JSONB NOT NULL,
  allergens TEXT[] DEFAULT '{}',
  source TEXT CHECK (source IN ('plant', 'animal', 'synthetic')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category product_category NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  serving_size DECIMAL(8,2) NOT NULL,
  serving_unit TEXT NOT NULL,
  claimed_protein DECIMAL(8,2) NOT NULL,
  effective_protein DECIMAL(8,2) NOT NULL,
  bioavailability_score DECIMAL(3,2) NOT NULL,
  transparency_score DECIMAL(3,2) NOT NULL,
  cost_per_effective_gram DECIMAL(8,4),
  pdcaas_score DECIMAL(3,2),
  diaas_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_by UUID[] DEFAULT '{}'
);

-- Product ingredients junction table
CREATE TABLE product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  percentage DECIMAL(5,2),
  confidence DECIMAL(3,2) DEFAULT 0.5, -- 0-1 scale for estimation confidence
  source TEXT CHECK (source IN ('disclosed', 'estimated', 'community_verified')) DEFAULT 'estimated',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, ingredient_id)
);

-- Contributions table
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type contribution_type NOT NULL,
  data JSONB NOT NULL,
  status contribution_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification votes table
CREATE TABLE verification_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contribution_id UUID REFERENCES contributions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vote vote_type NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contribution_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_transparency_score ON products(transparency_score DESC);
CREATE INDEX idx_products_cost_per_effective_gram ON products(cost_per_effective_gram ASC);
CREATE INDEX idx_products_effective_protein ON products(effective_protein DESC);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_brand_trgm ON products USING gin(brand gin_trgm_ops);

CREATE INDEX idx_ingredients_name_trgm ON ingredients USING gin(name gin_trgm_ops);
CREATE INDEX idx_ingredients_type ON ingredients(type);
CREATE INDEX idx_ingredients_source ON ingredients(source);

CREATE INDEX idx_contributions_user_id ON contributions(user_id);
CREATE INDEX idx_contributions_product_id ON contributions(product_id);
CREATE INDEX idx_contributions_status ON contributions(status);
CREATE INDEX idx_contributions_type ON contributions(type);

CREATE INDEX idx_verification_votes_contribution_id ON verification_votes(contribution_id);
CREATE INDEX idx_verification_votes_user_id ON verification_votes(user_id);

CREATE INDEX idx_users_reputation_score ON users(reputation_score DESC);
CREATE INDEX idx_users_verification_level ON users(verification_level);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON contributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;

-- Users can read all users, but only update their own
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Products are publicly readable
CREATE POLICY "Products are publicly readable" ON products FOR SELECT USING (true);

-- Ingredients are publicly readable
CREATE POLICY "Ingredients are publicly readable" ON ingredients FOR SELECT USING (true);

-- Product ingredients are publicly readable
CREATE POLICY "Product ingredients are publicly readable" ON product_ingredients FOR SELECT USING (true);

-- Contributions policies
CREATE POLICY "Users can view all contributions" ON contributions FOR SELECT USING (true);
CREATE POLICY "Users can create contributions" ON contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contributions" ON contributions FOR UPDATE USING (auth.uid() = user_id);

-- Verification votes policies
CREATE POLICY "Users can view all verification votes" ON verification_votes FOR SELECT USING (true);
CREATE POLICY "Users can create verification votes" ON verification_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own verification votes" ON verification_votes FOR UPDATE USING (auth.uid() = user_id);
