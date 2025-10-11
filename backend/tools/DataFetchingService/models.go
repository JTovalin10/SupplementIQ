package main

import (
	"time"
)

// Database models based on the schema
type User struct {
	ID               string    `json:"id" db:"id"`
	Username         string    `json:"username" db:"username"`
	Email            string    `json:"email" db:"email"`
	ReputationPoints int       `json:"reputation_points" db:"reputation_points"`
	Role             string    `json:"role" db:"role"`
	Bio              *string   `json:"bio" db:"bio"`
	AvatarURL        *string   `json:"avatar_url" db:"avatar_url"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

type Brand struct {
	ID           int       `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	Slug         *string   `json:"slug" db:"slug"`
	Website      *string   `json:"website" db:"website"`
	ProductCount int       `json:"product_count" db:"product_count"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type Product struct {
	ID                 int       `json:"id" db:"id"`
	BrandID            int       `json:"brand_id" db:"brand_id"`
	Category           string    `json:"category" db:"category"`
	Name               string    `json:"name" db:"name"`
	Slug               string    `json:"slug" db:"slug"`
	ReleaseYear        *int      `json:"release_year" db:"release_year"`
	ImageURL           *string   `json:"image_url" db:"image_url"`
	Description        *string   `json:"description" db:"description"`
	ServingsPerContainer *int    `json:"servings_per_container" db:"servings_per_container"`
	Price              float64   `json:"price" db:"price"`
	ServingSizeG       *float64  `json:"serving_size_g" db:"serving_size_g"`
	TransparencyScore  int       `json:"transparency_score" db:"transparency_score"`
	ConfidenceLevel    string    `json:"confidence_level" db:"confidence_level"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
	Brand              *Brand    `json:"brand,omitempty"`
}

// PendingProduct represents a product pending approval (matches your schema)
type PendingProduct struct {
	ID                 int       `json:"id" db:"id"`
	ProductID          *int      `json:"product_id" db:"product_id"` // NULL for new products, set for updates
	SubmittedBy        string    `json:"submitted_by" db:"submitted_by"`
	Status             string    `json:"status" db:"status"` // pending, approved, rejected
	JobType            string    `json:"job_type" db:"job_type"` // add, update, delete
	BrandID            int       `json:"brand_id" db:"brand_id"`
	Category           string    `json:"category" db:"category"`
	Name               string    `json:"name" db:"name"`
	Slug               string    `json:"slug" db:"slug"`
	ReleaseYear        *int      `json:"release_year" db:"release_year"`
	ImageURL           *string   `json:"image_url" db:"image_url"`
	Description        *string   `json:"description" db:"description"`
	ServingsPerContainer *int    `json:"servings_per_container" db:"servings_per_container"`
	Price              float64   `json:"price" db:"price"`
	ServingSizeG       *float64  `json:"serving_size_g" db:"serving_size_g"`
	TransparencyScore  int       `json:"transparency_score" db:"transparency_score"`
	ConfidenceLevel    string    `json:"confidence_level" db:"confidence_level"`
	SubmittedAt        time.Time `json:"submitted_at" db:"submitted_at"`
	Notes              *string   `json:"notes" db:"notes"`
	
	// Approval workflow fields (added via schema update)
	ReviewedBy         *string   `json:"reviewed_by" db:"reviewed_by"`
	ReviewedAt         *time.Time `json:"reviewed_at" db:"reviewed_at"`
	RejectionReason    *string   `json:"rejection_reason" db:"rejection_reason"`
	
	Brand              *Brand    `json:"brand,omitempty"`
}

type ProductWithDetails struct {
	Product
	PreworkoutDetails     *PreworkoutDetails     `json:"preworkout_details,omitempty"`
	NonStimPreworkoutDetails *NonStimPreworkoutDetails `json:"non_stim_preworkout_details,omitempty"`
	EnergyDrinkDetails    *EnergyDrinkDetails    `json:"energy_drink_details,omitempty"`
	ProteinDetails        *ProteinDetails        `json:"protein_details,omitempty"`
	AminoAcidDetails      *AminoAcidDetails      `json:"amino_acid_details,omitempty"`
	FatBurnerDetails      *FatBurnerDetails      `json:"fat_burner_details,omitempty"`
}

// Product detail tables
type PreworkoutDetails struct {
	ProductID                           int     `json:"product_id" db:"product_id"`
	ServingScoops                       *int    `json:"serving_scoops" db:"serving_scoops"`
	ServingG                            *float64 `json:"serving_g" db:"serving_g"`
	SugarG                              int     `json:"sugar_g" db:"sugar_g"`
	KeyFeatures                         []string `json:"key_features" db:"key_features"`
	LCitrullineMg                       int     `json:"l_citrulline_mg" db:"l_citrulline_mg"`
	CreatineMonohydrateMg               int     `json:"creatine_monohydrate_mg" db:"creatine_monohydrate_mg"`
	GlycerpumpMg                        int     `json:"glycerpump_mg" db:"glycerpump_mg"`
	BetaineAnhydrousMg                  int     `json:"betaine_anhydrous_mg" db:"betaine_anhydrous_mg"`
	AgmatineSulfateMg                   int     `json:"agmatine_sulfate_mg" db:"agmatine_sulfate_mg"`
	LTyrosineMg                         int     `json:"l_tyrosine_mg" db:"l_tyrosine_mg"`
	CaffeineAnhydrousMg                 int     `json:"caffeine_anhydrous_mg" db:"caffeine_anhydrous_mg"`
	NPhenethylDimethylamineCitrateMg    int     `json:"n_phenethyl_dimethylamine_citrate_mg" db:"n_phenethyl_dimethylamine_citrate_mg"`
	KannaExtractMg                      int     `json:"kanna_extract_mg" db:"kanna_extract_mg"`
	HuperzineAMcg                       int     `json:"huperzine_a_mcg" db:"huperzine_a_mcg"`
	BioperineMg                         int     `json:"bioperine_mg" db:"bioperine_mg"`
}

type NonStimPreworkoutDetails struct {
	ProductID          int      `json:"product_id" db:"product_id"`
	ServingScoops      int      `json:"serving_scoops" db:"serving_scoops"`
	ServingG           float64  `json:"serving_g" db:"serving_g"`
	KeyFeatures        []string `json:"key_features" db:"key_features"`
	Calories           int      `json:"calories" db:"calories"`
	TotalCarbohydrateG int      `json:"total_carbohydrate_g" db:"total_carbohydrate_g"`
	NiacinMg           int      `json:"niacin_mg" db:"niacin_mg"`
	VitaminB6Mg        int      `json:"vitamin_b6_mg" db:"vitamin_b6_mg"`
	VitaminB12Mcg      int      `json:"vitamin_b12_mcg" db:"vitamin_b12_mcg"`
	MagnesiumMg        int      `json:"magnesium_mg" db:"magnesium_mg"`
	SodiumMg           int      `json:"sodium_mg" db:"sodium_mg"`
	PotassiumMg        int      `json:"potassium_mg" db:"potassium_mg"`
	LCitrullineMg      int      `json:"l_citrulline_mg" db:"l_citrulline_mg"`
	CreatineMonohydrateMg int   `json:"creatine_monohydrate_mg" db:"creatine_monohydrate_mg"`
	BetaineAnhydrousMg int      `json:"betaine_anhydrous_mg" db:"betaine_anhydrous_mg"`
	GlycerolPowderMg   int      `json:"glycerol_powder_mg" db:"glycerol_powder_mg"`
	MalicAcidMg        int      `json:"malic_acid_mg" db:"malic_acid_mg"`
	TaurineMg          int      `json:"taurine_mg" db:"taurine_mg"`
	SodiumNitrateMg    int      `json:"sodium_nitrate_mg" db:"sodium_nitrate_mg"`
	AgmatineSulfateMg  int      `json:"agmatine_sulfate_mg" db:"agmatine_sulfate_mg"`
	VasodriveAPMg      int      `json:"vasodrive_ap_mg" db:"vasodrive_ap_mg"`
}

type EnergyDrinkDetails struct {
	ProductID                int      `json:"product_id" db:"product_id"`
	ServingSizeFlOz          *int     `json:"serving_size_fl_oz" db:"serving_size_fl_oz"`
	SugarG                   int      `json:"sugar_g" db:"sugar_g"`
	KeyFeatures              []string `json:"key_features" db:"key_features"`
	CaffeineMg               int      `json:"caffeine_mg" db:"caffeine_mg"`
	NAcetylLTyrosineMg       int      `json:"n_acetyl_l_tyrosine_mg" db:"n_acetyl_l_tyrosine_mg"`
	AlphaGpcMg               int      `json:"alpha_gpc_mg" db:"alpha_gpc_mg"`
	LTheanineMg              int      `json:"l_theanine_mg" db:"l_theanine_mg"`
	HuperzineAMcg            int      `json:"huperzine_a_mcg" db:"huperzine_a_mcg"`
	UridineMonophosphateMg   int      `json:"uridine_monophosphate_mg" db:"uridine_monophosphate_mg"`
	SaffronExtractMg         int      `json:"saffron_extract_mg" db:"saffron_extract_mg"`
	VitaminCMg               int      `json:"vitamin_c_mg" db:"vitamin_c_mg"`
	NiacinB3Mg               int      `json:"niacin_b3_mg" db:"niacin_b3_mg"`
	VitaminB6Mg              int      `json:"vitamin_b6_mg" db:"vitamin_b6_mg"`
	VitaminB12Mcg            int      `json:"vitamin_b12_mcg" db:"vitamin_b12_mcg"`
	PantothenicAcidB5Mg      int      `json:"pantothenic_acid_b5_mg" db:"pantothenic_acid_b5_mg"`
}

type ProteinDetails struct {
	ProductID           int      `json:"product_id" db:"product_id"`
	ProteinClaimG       float64  `json:"protein_claim_g" db:"protein_claim_g"`
	EffectiveProteinG   float64  `json:"effective_protein_g" db:"effective_protein_g"`
	WheyConcentrateG    float64  `json:"whey_concentrate_g" db:"whey_concentrate_g"`
	WheyIsolateG        float64  `json:"whey_isolate_g" db:"whey_isolate_g"`
	WheyHydrolysateG    float64  `json:"whey_hydrolysate_g" db:"whey_hydrolysate_g"`
	CaseinG             float64  `json:"casein_g" db:"casein_g"`
	EggProteinG         float64  `json:"egg_protein_g" db:"egg_protein_g"`
	SoyProteinG         float64  `json:"soy_protein_g" db:"soy_protein_g"`
}

type AminoAcidDetails struct {
	ProductID             int      `json:"product_id" db:"product_id"`
	KeyFeatures           []string `json:"key_features" db:"key_features"`
	TotalEaasMg           int      `json:"total_eaas_mg" db:"total_eaas_mg"`
	LLeucineMg            int      `json:"l_leucine_mg" db:"l_leucine_mg"`
	LIsoleucineMg         int      `json:"l_isoleucine_mg" db:"l_isoleucine_mg"`
	LValineMg             int      `json:"l_valine_mg" db:"l_valine_mg"`
	LLysineHclMg          int      `json:"l_lysine_hcl_mg" db:"l_lysine_hcl_mg"`
	LThreonineMg          int      `json:"l_threonine_mg" db:"l_threonine_mg"`
	LPhenylalanineMg      int      `json:"l_phenylalanine_mg" db:"l_phenylalanine_mg"`
	LTryptophanMg         int      `json:"l_tryptophan_mg" db:"l_tryptophan_mg"`
	LHistidineHclMg       int      `json:"l_histidine_hcl_mg" db:"l_histidine_hcl_mg"`
	LMethionineMg         int      `json:"l_methionine_mg" db:"l_methionine_mg"`
	BetaineAnhydrousMg    int      `json:"betaine_anhydrous_mg" db:"betaine_anhydrous_mg"`
	CoconutWaterPowderMg  int      `json:"coconut_water_powder_mg" db:"coconut_water_powder_mg"`
	AstraginMg            int      `json:"astragin_mg" db:"astragin_mg"`
}

type FatBurnerDetails struct {
	ProductID              int      `json:"product_id" db:"product_id"`
	StimulantBased         bool     `json:"stimulant_based" db:"stimulant_based"`
	KeyFeatures            []string `json:"key_features" db:"key_features"`
	LCarnitineLTartrateMg  int      `json:"l_carnitine_l_tartrate_mg" db:"l_carnitine_l_tartrate_mg"`
	GreenTeaExtractMg      int      `json:"green_tea_extract_mg" db:"green_tea_extract_mg"`
	CapsimaxMg             int      `json:"capsimax_mg" db:"capsimax_mg"`
	GrainsOfParadiseMg     int      `json:"grains_of_paradise_mg" db:"grains_of_paradise_mg"`
	Ksm66AshwagandhaMg     int      `json:"ksm66_ashwagandha_mg" db:"ksm66_ashwagandha_mg"`
	KelpExtractMcg         int      `json:"kelp_extract_mcg" db:"kelp_extract_mcg"`
	SeleniumMcg            int      `json:"selenium_mcg" db:"selenium_mcg"`
	ZincPicolinateMg       int      `json:"zinc_picolinate_mg" db:"zinc_picolinate_mg"`
	FiveHtpMg              int      `json:"five_htp_mg" db:"five_htp_mg"`
	CaffeineAnhydrousMg    int      `json:"caffeine_anhydrous_mg" db:"caffeine_anhydrous_mg"`
	HalostachineMg         int      `json:"halostachine_mg" db:"halostachine_mg"`
	RauwolscineMcg         int      `json:"rauwolscine_mcg" db:"rauwolscine_mcg"`
	BioperineMg            int      `json:"bioperine_mg" db:"bioperine_mg"`
}

// Request/Response structures
type PaginatedProductsRequest struct {
	Category string `json:"category" form:"category"`
	Page     int    `json:"page" form:"page"`
	Limit    int    `json:"limit" form:"limit"`
}

type SearchRequest struct {
	Query  string `json:"query" form:"query"`
	Limit  int    `json:"limit" form:"limit"`
	Offset int    `json:"offset" form:"offset"`
}

type FilterRequest struct {
	Brands      []string  `json:"brands" form:"brands"`
	PriceMin    *float64  `json:"price_min" form:"price_min"`
	PriceMax    *float64  `json:"price_max" form:"price_max"`
	Categories  []string  `json:"categories" form:"categories"`
	Limit       int       `json:"limit" form:"limit"`
	Offset      int       `json:"offset" form:"offset"`
	SortBy      string    `json:"sort_by" form:"sort_by"` // price, name, transparency_score, created_at
	SortOrder   string    `json:"sort_order" form:"sort_order"` // asc, desc
}

type ProductUpdateRequest struct {
	ID                int      `json:"id" binding:"required"`
	Name              *string  `json:"name,omitempty"`
	Description       *string  `json:"description,omitempty"`
	Price             *float64 `json:"price,omitempty"`
	ImageURL          *string  `json:"image_url,omitempty"`
	TransparencyScore *int     `json:"transparency_score,omitempty"`
	ConfidenceLevel   *string  `json:"confidence_level,omitempty"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	Total      int         `json:"total"`
	TotalPages int         `json:"total_pages"`
}

type SearchResponse struct {
	Results []Product `json:"results"`
	Total   int       `json:"total"`
	Query   string    `json:"query"`
}

type AdminCacheResponse struct {
	Admins []User `json:"admins"`
	Owners []User `json:"owners"`
	Total  int    `json:"total"`
}

// Pending product request/response structures
type PendingProductRequest struct {
	ProductID          *int     `json:"product_id,omitempty"` // NULL for new products, set for updates
	Name               string   `json:"name" binding:"required"`
	BrandName          string   `json:"brand_name" binding:"required"`
	Category           string   `json:"category" binding:"required"`
	JobType            string   `json:"job_type" binding:"required"` // add, update, delete
	Flavor             string   `json:"flavor"`
	Year               string   `json:"year,omitempty"`
	ImageURL           *string  `json:"image_url,omitempty"`
	Description        *string  `json:"description,omitempty"`
	ServingsPerContainer *int   `json:"servings_per_container,omitempty"`
	Price              float64  `json:"price" binding:"required"`
	ServingSizeG       *float64 `json:"serving_size_g,omitempty"`
	TransparencyScore  int      `json:"transparency_score"`
	ConfidenceLevel    string   `json:"confidence_level"`
	SubmittedBy        string   `json:"submitted_by" binding:"required"`
	Notes              *string  `json:"notes,omitempty"`
}

type ProductApprovalRequest struct {
	ID              int     `json:"id" binding:"required"`
	Status          string  `json:"status" binding:"required"` // "approved" or "rejected"
	ReviewedBy      string  `json:"reviewed_by" binding:"required"`
	RejectionReason *string `json:"rejection_reason,omitempty"`
}

type PendingProductsResponse struct {
	Products []PendingProduct `json:"products"`
	Total    int              `json:"total"`
	Page     int              `json:"page"`
	Limit    int              `json:"limit"`
	TotalPages int            `json:"total_pages"`
}

type ProductApprovalResponse struct {
	Message string `json:"message"`
	Product PendingProduct `json:"product"`
}

// Supabase client for database operations
type SupabaseClient struct {
	URL    string
	APIKey string
}

func NewSupabaseClient() *SupabaseClient {
	// Load environment variables
	err := godotenv.Load("../../../.env")
	if err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
	}

	// Get Supabase configuration from environment
	projectID := getEnv("SUPABASE_PROJECT_ID", "")
	apiKey := getEnv("SUPABASE_PUBLIC_API_KEY", "")

	if projectID == "" || apiKey == "" {
		log.Fatal("Missing required Supabase configuration")
	}

	return &SupabaseClient{
		URL:    fmt.Sprintf("https://%s.supabase.co/rest/v1", projectID),
		APIKey: apiKey,
	}
}
