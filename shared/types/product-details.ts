/**
 * Product detail type definitions
 * Defines category-specific product detail interfaces with nullable ingredient amounts
 * All ingredient amounts are nullable since not all products contain all ingredients
 */

/**
 * Pre-workout supplement details
 * Contains specific ingredient amounts for pre-workout supplements
 */
export interface PreworkoutDetails {
  product_id: number;
  serving_scoops: number;
  serving_g: number;
  sugar_g: number;
  key_features: string[];
  l_citrulline_mg: number | null;
  creatine_monohydrate_mg: number | null;
  glycerpump_mg: number | null;
  betaine_anhydrous_mg: number | null;
  agmatine_sulfate_mg: number | null;
  l_tyrosine_mg: number | null;
  caffeine_anhydrous_mg: number | null;
  n_phenethyl_dimethylamine_citrate_mg: number | null;
  kanna_extract_mg: number | null;
  huperzine_a_mcg: number | null;
  bioperine_mg: number | null;
}

/**
 * Energy drink supplement details
 * Contains specific ingredient amounts for energy drink supplements
 */
export interface EnergyDrinkDetails {
  product_id: number;
  serving_size_fl_oz: number;
  sugar_g: number;
  key_features: string[];
  caffeine_mg: number | null;
  n_acetyl_l_tyrosine_mg: number | null;
  alpha_gpc_mg: number | null;
  l_theanine_mg: number | null;
  huperzine_a_mcg: number | null;
  uridine_monophosphate_mg: number | null;
  saffron_extract_mg: number | null;
  vitamin_c_mg: number | null;
  niacin_b3_mg: number | null;
  vitamin_b6_mg: number | null;
  vitamin_b12_mcg: number | null;
  pantothenic_acid_b5_mg: number | null;
}

/**
 * Protein supplement details
 * Contains protein-specific information
 */
export interface ProteinDetails {
  product_id: number;
  protein_claim_g: number;
  protein_type?: string;
  effective_protein_g: number | null;
}

/**
 * Amino acid supplement details
 * Contains specific amino acid amounts
 */
export interface AminoAcidDetails {
  product_id: number;
  key_features: string[];
  total_eaas_mg: number;
  l_leucine_mg: number | null;
  l_isoleucine_mg: number | null;
  l_valine_mg: number | null;
  l_lysine_hcl_mg: number | null;
  l_threonine_mg: number | null;
  l_phenylalanine_mg: number | null;
  l_tryptophan_mg: number | null;
  l_histidine_hcl_mg: number | null;
  l_methionine_mg: number | null;
  betaine_anhydrous_mg: number | null;
  coconut_water_powder_mg: number | null;
  astragin_mg: number | null;
}

/**
 * Fat burner supplement details
 * Contains thermogenic and fat-burning ingredient amounts
 */
export interface FatBurnerDetails {
  product_id: number;
  stimulant_based: boolean;
  key_features: string[];
  l_carnitine_l_tartrate_mg?: number;
  green_tea_extract_mg?: number;
  capsimax_mg?: number;
  grains_of_paradise_mg?: number;
  ksm66_ashwagandha_mg?: number;
  kelp_extract_mcg?: number;
  selenium_mcg?: number;
  zinc_picolinate_mg?: number;
  five_htp_mg?: number;
  caffeine_anhydrous_mg?: number;
  halostachine_mg?: number;
  rauwolscine_mcg?: number;
  bioperine_mg?: number;
}
