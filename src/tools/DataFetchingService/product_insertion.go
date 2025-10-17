package main

import (
	"database/sql"
	"fmt"
	"log"
	"strconv"
	"strings"
)

// ProductData structure for insertion
type ProductData struct {
	Name      string `json:"name"`
	BrandName string `json:"brand_name"`
	Flavor    string `json:"flavor"`
	Category  string `json:"category"`
	Year      string `json:"year,omitempty"`
}

// Product insertion functions for different product types
func (d *DatabaseClient) InsertProduct(productData ProductData) error {
	// First, check if product already exists
	exists, err := d.CheckProductExists(productData.BrandName, productData.Name, productData.Flavor)
	if err != nil {
		return fmt.Errorf("failed to check product existence: %v", err)
	}

	if exists {
		return fmt.Errorf("product already exists: %s (%s)", productData.Name, productData.BrandName)
	}

	// Start transaction
	tx, err := d.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %v", err)
	}
	defer tx.Rollback()

	// Get or create brand
	brandID, err := d.getOrCreateBrand(tx, productData.BrandName)
	if err != nil {
		return fmt.Errorf("failed to get/create brand: %v", err)
	}

	// Insert main product
	productQuery := `
		INSERT INTO products (brand_id, category, name, slug, release_year, price, transparency_score, confidence_level)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`

	var productID int
	slug := generateSlug(productData.Name)
	year := parseYear(productData.Year)

	err = tx.QueryRow(productQuery, brandID, productData.Category, productData.Name, slug, year, 0.0, 0, "estimated").Scan(&productID)
	if err != nil {
		return fmt.Errorf("failed to insert product: %v", err)
	}

	// Insert product-specific details based on category
	err = d.insertProductDetails(tx, productID, productData)
	if err != nil {
		return fmt.Errorf("failed to insert product details: %v", err)
	}

	// Update brand product count
	updateBrandQuery := `UPDATE brands SET product_count = product_count + 1 WHERE id = $1`
	_, err = tx.Exec(updateBrandQuery, brandID)
	if err != nil {
		return fmt.Errorf("failed to update brand product count: %v", err)
	}

	// Commit transaction
	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	log.Printf("✅ Successfully inserted product: %s (%s) with category: %s", productData.Name, productData.BrandName, productData.Category)
	return nil
}

// CheckProductExists checks if a product already exists in the database
func (d *DatabaseClient) CheckProductExists(brandName, productName, flavor string) (bool, error) {
	query := `
		SELECT COUNT(*) > 0
		FROM products p
		JOIN brands b ON p.brand_id = b.id
		WHERE b.name = $1 AND p.name = $2
	`

	var exists bool
	err := d.db.QueryRow(query, brandName, productName).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}

// getOrCreateBrand gets existing brand or creates a new one
func (d *DatabaseClient) getOrCreateBrand(tx *sql.Tx, brandName string) (int, error) {
	// First try to get existing brand
	var brandID int
	query := `SELECT id FROM brands WHERE name = $1`
	err := tx.QueryRow(query, brandName).Scan(&brandID)
	
	if err == nil {
		return brandID, nil // Brand exists
	}
	
	if err != sql.ErrNoRows {
		return 0, err // Database error
	}

	// Brand doesn't exist, create it
	insertQuery := `
		INSERT INTO brands (name, slug)
		VALUES ($1, $2)
		RETURNING id
	`
	
	slug := generateSlug(brandName)
	err = tx.QueryRow(insertQuery, brandName, slug).Scan(&brandID)
	if err != nil {
		return 0, err
	}

	log.Printf("🆕 Created new brand: %s", brandName)
	return brandID, nil
}

// insertProductDetails inserts category-specific product details
func (d *DatabaseClient) insertProductDetails(tx *sql.Tx, productID int, productData ProductData) error {
	switch productData.Category {
	case "pre-workout":
		return d.insertPreworkoutDetails(tx, productID)
	case "non-stim-pre-workout":
		return d.insertNonStimPreworkoutDetails(tx, productID)
	case "energy-drink":
		return d.insertEnergyDrinkDetails(tx, productID)
	case "protein":
		return d.insertProteinDetails(tx, productID)
	case "bcaa", "eaa":
		return d.insertAminoAcidDetails(tx, productID)
	case "fat-burner", "appetite-suppressant":
		return d.insertFatBurnerDetails(tx, productID)
	case "creatine":
		// Creatine doesn't have a specific details table, just return nil
		return nil
	default:
		return fmt.Errorf("unsupported product category: %s", productData.Category)
	}
}

// Insert functions for each product detail table
func (d *DatabaseClient) insertPreworkoutDetails(tx *sql.Tx, productID int) error {
	query := `
		INSERT INTO preworkout_details (
			product_id, serving_scoops, serving_g, sugar_g, key_features,
			l_citrulline_mg, creatine_monohydrate_mg, glycerpump_mg,
			betaine_anhydrous_mg, agmatine_sulfate_mg, l_tyrosine_mg,
			caffeine_anhydrous_mg, n_phenethyl_dimethylamine_citrate_mg,
			kanna_extract_mg, huperzine_a_mcg, bioperine_mg
		) VALUES (
			$1, 1, 30.0, -1, ARRAY['pump','endurance','focus','power'],
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
		)
	`
	
	_, err := tx.Exec(query, productID)
	return err
}

func (d *DatabaseClient) insertNonStimPreworkoutDetails(tx *sql.Tx, productID int) error {
	query := `
		INSERT INTO non_stim_preworkout_details (
			product_id, serving_scoops, serving_g, key_features, calories,
			total_carbohydrate_g, niacin_mg, vitamin_b6_mg, vitamin_b12_mcg,
			magnesium_mg, sodium_mg, potassium_mg, l_citrulline_mg,
			creatine_monohydrate_mg, betaine_anhydrous_mg, glycerol_powder_mg,
			malic_acid_mg, taurine_mg, sodium_nitrate_mg, agmatine_sulfate_mg,
			vasodrive_ap_mg
		) VALUES (
			$1, 2, 40.2, ARRAY['pump','endurance','focus','power','non-stim'],
			20, 4, 32, 20, 250, 50, 420, 420, 10000, 5000, 4000,
			4000, 3000, 3000, 1500, 1000, 508
		)
	`
	
	_, err := tx.Exec(query, productID)
	return err
}

func (d *DatabaseClient) insertEnergyDrinkDetails(tx *sql.Tx, productID int) error {
	query := `
		INSERT INTO energy_drink_details (
			product_id, serving_size_fl_oz, sugar_g, key_features, caffeine_mg,
			n_acetyl_l_tyrosine_mg, alpha_gpc_mg, l_theanine_mg, huperzine_a_mcg,
			uridine_monophosphate_mg, saffron_extract_mg, vitamin_c_mg,
			niacin_b3_mg, vitamin_b6_mg, vitamin_b12_mcg, pantothenic_acid_b5_mg
		) VALUES (
			$1, 16, -1, ARRAY['focus','nootropics','mental clarity','sugar-free'],
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
		)
	`
	
	_, err := tx.Exec(query, productID)
	return err
}

func (d *DatabaseClient) insertProteinDetails(tx *sql.Tx, productID int) error {
	query := `
		INSERT INTO protein_details (
			product_id, protein_claim_g, effective_protein_g, whey_concentrate_g,
			whey_isolate_g, whey_hydrolysate_g, casein_g, egg_protein_g, soy_protein_g
		) VALUES (
			$1, -1, -1, -1, -1, -1, -1, -1, -1
		)
	`
	
	_, err := tx.Exec(query, productID)
	return err
}

func (d *DatabaseClient) insertAminoAcidDetails(tx *sql.Tx, productID int) error {
	query := `
		INSERT INTO amino_acid_details (
			product_id, key_features, total_eaas_mg, l_leucine_mg, l_isoleucine_mg,
			l_valine_mg, l_lysine_hcl_mg, l_threonine_mg, l_phenylalanine_mg,
			l_tryptophan_mg, l_histidine_hcl_mg, l_methionine_mg,
			betaine_anhydrous_mg, coconut_water_powder_mg, astragin_mg
		) VALUES (
			$1, ARRAY['recovery','hydration','muscle protein synthesis'],
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
		)
	`
	
	_, err := tx.Exec(query, productID)
	return err
}

func (d *DatabaseClient) insertFatBurnerDetails(tx *sql.Tx, productID int) error {
	query := `
		INSERT INTO fat_burner_details (
			product_id, stimulant_based, key_features, l_carnitine_l_tartrate_mg,
			green_tea_extract_mg, capsimax_mg, grains_of_paradise_mg,
			ksm66_ashwagandha_mg, kelp_extract_mcg, selenium_mcg,
			zinc_picolinate_mg, five_htp_mg, caffeine_anhydrous_mg,
			halostachine_mg, rauwolscine_mcg, bioperine_mg
		) VALUES (
			$1, true, ARRAY['thermogenesis','appetite suppression','metabolism','energy'],
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
		)
	`
	
	_, err := tx.Exec(query, productID)
	return err
}

// Batch insert function for multiple products
func (d *DatabaseClient) BatchInsertProducts(products []ProductData) ([]ProductData, error) {
	var insertedProducts []ProductData
	var errors []string

	for _, product := range products {
		err := d.InsertProduct(product)
		if err != nil {
			log.Printf("❌ Failed to insert product %s (%s): %v", product.Name, product.BrandName, err)
			errors = append(errors, fmt.Sprintf("%s (%s): %v", product.Name, product.BrandName, err))
			continue
		}

		// Add to inserted products list (without year for trie)
		insertedProduct := ProductData{
			Name:      product.Name,
			BrandName: product.BrandName,
			Flavor:    product.Flavor,
			Category:  product.Category,
			// Year excluded for trie updates
		}
		insertedProducts = append(insertedProducts, insertedProduct)
	}

	if len(errors) > 0 {
		log.Printf("⚠️ Some products failed to insert: %v", errors)
	}

	log.Printf("✅ Batch insert completed: %d/%d products inserted", len(insertedProducts), len(products))
	return insertedProducts, nil
}

// Helper functions
func generateSlug(name string) string {
	// Simple slug generation - in production, use a proper slug library
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "&", "and")
	return slug
}

func parseYear(yearStr string) *int {
	if yearStr == "" {
		return nil
	}
	
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		return nil
	}
	
	return &year
}
