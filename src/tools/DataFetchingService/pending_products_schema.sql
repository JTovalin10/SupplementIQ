-- Pending Products Schema Update
-- This updates the existing pending_products table to work with the new approval workflow

-- Add missing columns to existing pending_products table
ALTER TABLE public.pending_products 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update the status column to use the existing approval_status enum
-- (This should already exist based on your schema)

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_products_reviewed_by ON public.pending_products (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_pending_products_reviewed_at ON public.pending_products (reviewed_at);

-- Create view for easy querying of pending products
CREATE OR REPLACE VIEW pending_products_view AS
SELECT 
    pp.*,
    b.name as brand_name,
    b.slug as brand_slug,
    b.website as brand_website,
    u.username as submitted_by_username,
    r.username as reviewed_by_username
FROM public.pending_products pp
JOIN public.brands b ON pp.brand_id = b.id
LEFT JOIN public.users u ON pp.submitted_by = u.id
LEFT JOIN public.users r ON pp.reviewed_by = r.id
WHERE pp.status = 'pending'
ORDER BY pp.submitted_at ASC;

-- Create view for approved products ready for migration
CREATE OR REPLACE VIEW approved_products_view AS
SELECT 
    pp.*,
    b.name as brand_name,
    b.slug as brand_slug,
    b.website as brand_website,
    u.username as submitted_by_username,
    r.username as reviewed_by_username
FROM public.pending_products pp
JOIN public.brands b ON pp.brand_id = b.id
LEFT JOIN public.users u ON pp.submitted_by = u.id
LEFT JOIN public.users r ON pp.reviewed_by = r.id
WHERE pp.status = 'approved'
ORDER BY pp.reviewed_at ASC;

-- Create function to migrate approved product to main products table
CREATE OR REPLACE FUNCTION migrate_approved_product(pending_product_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_product_id INTEGER;
    pending_product RECORD;
BEGIN
    -- Get the pending product data
    SELECT * INTO pending_product FROM public.pending_products WHERE id = pending_product_id AND status = 'approved';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found or not approved', pending_product_id;
    END IF;
    
    -- Insert into main products table
    INSERT INTO public.products (
        brand_id, category, name, slug, release_year, image_url, description,
        servings_per_container, price, serving_size_g, transparency_score, confidence_level
    ) VALUES (
        pending_product.brand_id, pending_product.category, pending_product.name, pending_product.slug,
        pending_product.release_year, pending_product.image_url, pending_product.description,
        pending_product.servings_per_container, pending_product.price, pending_product.serving_size_g,
        pending_product.transparency_score, pending_product.confidence_level
    ) RETURNING id INTO new_product_id;
    
    -- Migrate category-specific details
    CASE pending_product.category
        WHEN 'pre-workout' THEN
            INSERT INTO public.preworkout_details 
            SELECT new_product_id as product_id, serving_scoops, serving_g, sugar_g, key_features,
                   l_citrulline_mg, creatine_monohydrate_mg, glycerpump_mg,
                   betaine_anhydrous_mg, agmatine_sulfate_mg, l_tyrosine_mg,
                   caffeine_anhydrous_mg, n_phenethyl_dimethylamine_citrate_mg,
                   kanna_extract_mg, huperzine_a_mcg, bioperine_mg
            FROM public.pending_preworkout_details 
            WHERE product_id = pending_product_id;
        WHEN 'non-stim-pre-workout' THEN
            INSERT INTO public.non_stim_preworkout_details 
            SELECT new_product_id as product_id, serving_scoops, serving_g, key_features, calories,
                   total_carbohydrate_g, niacin_mg, vitamin_b6_mg, vitamin_b12_mcg,
                   magnesium_mg, sodium_mg, potassium_mg, l_citrulline_mg,
                   creatine_monohydrate_mg, betaine_anhydrous_mg, glycerol_powder_mg,
                   malic_acid_mg, taurine_mg, sodium_nitrate_mg, agmatine_sulfate_mg,
                   vasodrive_ap_mg
            FROM public.pending_non_stim_preworkout_details 
            WHERE product_id = pending_product_id;
        WHEN 'energy-drink' THEN
            INSERT INTO public.energy_drink_details 
            SELECT new_product_id as product_id, serving_size_fl_oz, sugar_g, key_features, caffeine_mg,
                   n_acetyl_l_tyrosine_mg, alpha_gpc_mg, l_theanine_mg, huperzine_a_mcg,
                   uridine_monophosphate_mg, saffron_extract_mg, vitamin_c_mg,
                   niacin_b3_mg, vitamin_b6_mg, vitamin_b12_mcg, pantothenic_acid_b5_mg
            FROM public.pending_energy_drink_details 
            WHERE product_id = pending_product_id;
        WHEN 'protein' THEN
            INSERT INTO public.protein_details 
            SELECT new_product_id as product_id, protein_claim_g, effective_protein_g, whey_concentrate_g,
                   whey_isolate_g, whey_hydrolysate_g, casein_g, egg_protein_g, soy_protein_g
            FROM public.pending_protein_details 
            WHERE product_id = pending_product_id;
        WHEN 'bcaa', 'eaa' THEN
            INSERT INTO public.amino_acid_details 
            SELECT new_product_id as product_id, key_features, total_eaas_mg, l_leucine_mg, l_isoleucine_mg,
                   l_valine_mg, l_lysine_hcl_mg, l_threonine_mg, l_phenylalanine_mg,
                   l_tryptophan_mg, l_histidine_hcl_mg, l_methionine_mg,
                   betaine_anhydrous_mg, coconut_water_powder_mg, astragin_mg
            FROM public.pending_amino_acid_details 
            WHERE product_id = pending_product_id;
        WHEN 'fat-burner', 'appetite-suppressant' THEN
            INSERT INTO public.fat_burner_details 
            SELECT new_product_id as product_id, stimulant_based, key_features, l_carnitine_l_tartrate_mg,
                   green_tea_extract_mg, capsimax_mg, grains_of_paradise_mg,
                   ksm66_ashwagandha_mg, kelp_extract_mcg, selenium_mcg,
                   zinc_picolinate_mg, five_htp_mg, caffeine_anhydrous_mg,
                   halostachine_mg, rauwolscine_mcg, bioperine_mg
            FROM public.pending_fat_burner_details 
            WHERE product_id = pending_product_id;
    END CASE;
    
    -- Delete from pending tables
    DELETE FROM public.pending_products WHERE id = pending_product_id;
    
    RETURN new_product_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your security model)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_products TO authenticated;
-- GRANT SELECT ON pending_products_view TO authenticated;
-- GRANT SELECT ON approved_products_view TO authenticated;
-- GRANT EXECUTE ON FUNCTION migrate_approved_product TO authenticated;
