package main

import (
	"database/sql"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"
)

// Temporary product database operations
func (d *DatabaseClient) SubmitTemporaryProduct(req TemporaryProductRequest) (*TemporaryProduct, error) {
	// Start transaction
	tx, err := d.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %v", err)
	}
	defer tx.Rollback()

	// Get or create brand
	brandID, err := d.getOrCreateBrand(tx, req.BrandName)
	if err != nil {
		return nil, fmt.Errorf("failed to get/create brand: %v", err)
	}

	// Generate slug
	slug := generateSlug(req.Name)
	year := parseYear(req.Year)

	// Insert temporary product
	query := `
		INSERT INTO temporary_products (
			brand_id, category, name, slug, release_year, image_url, description,
			servings_per_container, price, serving_size_g, transparency_score, confidence_level,
			status, submitted_by, submitted_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		) RETURNING id, created_at, updated_at
	`

	var tempProduct TemporaryProduct
	var createdAt, updatedAt time.Time

	err = tx.QueryRow(
		query,
		brandID, req.Category, req.Name, slug, year, req.ImageURL, req.Description,
		req.ServingsPerContainer, req.Price, req.ServingSizeG, req.TransparencyScore, req.ConfidenceLevel,
		"pending", req.SubmittedBy, time.Now(),
	).Scan(&tempProduct.ID, &createdAt, &updatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to insert temporary product: %v", err)
	}

	// Insert product-specific details based on category
	err = d.insertTemporaryProductDetails(tx, tempProduct.ID, req)
	if err != nil {
		return nil, fmt.Errorf("failed to insert temporary product details: %v", err)
	}

	// Commit transaction
	err = tx.Commit()
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Populate the response
	tempProduct.BrandID = brandID
	tempProduct.Category = req.Category
	tempProduct.Name = req.Name
	tempProduct.Slug = slug
	tempProduct.ReleaseYear = year
	tempProduct.ImageURL = req.ImageURL
	tempProduct.Description = req.Description
	tempProduct.ServingsPerContainer = req.ServingsPerContainer
	tempProduct.Price = req.Price
	tempProduct.ServingSizeG = req.ServingSizeG
	tempProduct.TransparencyScore = req.TransparencyScore
	tempProduct.ConfidenceLevel = req.ConfidenceLevel
	tempProduct.Status = "pending"
	tempProduct.SubmittedBy = &req.SubmittedBy
	tempProduct.SubmittedAt = time.Now()
	tempProduct.CreatedAt = createdAt
	tempProduct.UpdatedAt = updatedAt

	log.Printf("✅ Successfully submitted temporary product: %s (%s) with status: pending", req.Name, req.BrandName)
	return &tempProduct, nil
}

// Get temporary products with filtering and pagination
func (d *DatabaseClient) GetTemporaryProducts(status string, page, limit int) ([]TemporaryProduct, int, error) {
	offset := (page - 1) * limit

	// Count query
	countQuery := `
		SELECT COUNT(*)
		FROM temporary_products tp
		JOIN brands b ON tp.brand_id = b.id
		WHERE ($1 = '' OR tp.status = $1)
	`
	
	var total int
	err := d.db.QueryRow(countQuery, status).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count temporary products: %v", err)
	}

	// Data query
	dataQuery := `
		SELECT tp.id, tp.brand_id, tp.category, tp.name, tp.slug, tp.release_year,
		       tp.image_url, tp.description, tp.servings_per_container, tp.price,
		       tp.serving_size_g, tp.transparency_score, tp.confidence_level,
		       tp.status, tp.submitted_by, tp.submitted_at, tp.reviewed_by,
		       tp.reviewed_at, tp.rejection_reason, tp.created_at, tp.updated_at,
		       b.id as brand_id, b.name as brand_name, b.slug as brand_slug,
		       b.website as brand_website, b.product_count as brand_product_count,
		       b.created_at as brand_created_at
		FROM temporary_products tp
		JOIN brands b ON tp.brand_id = b.id
		WHERE ($1 = '' OR tp.status = $1)
		ORDER BY tp.submitted_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := d.db.Query(dataQuery, status, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query temporary products: %v", err)
	}
	defer rows.Close()

	var products []TemporaryProduct
	for rows.Next() {
		var tp TemporaryProduct
		var brand Brand
		var submittedBy, reviewedBy, rejectionReason sql.NullString
		var reviewedAt sql.NullTime
		
		err := rows.Scan(
			&tp.ID, &tp.BrandID, &tp.Category, &tp.Name, &tp.Slug, &tp.ReleaseYear,
			&tp.ImageURL, &tp.Description, &tp.ServingsPerContainer, &tp.Price,
			&tp.ServingSizeG, &tp.TransparencyScore, &tp.ConfidenceLevel,
			&tp.Status, &submittedBy, &tp.SubmittedAt, &reviewedBy,
			&reviewedAt, &rejectionReason, &tp.CreatedAt, &tp.UpdatedAt,
			&brand.ID, &brand.Name, &brand.Slug, &brand.Website,
			&brand.ProductCount, &brand.CreatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan temporary product: %v", err)
		}

		if submittedBy.Valid {
			tp.SubmittedBy = &submittedBy.String
		}
		if reviewedBy.Valid {
			tp.ReviewedBy = &reviewedBy.String
		}
		if reviewedAt.Valid {
			tp.ReviewedAt = &reviewedAt.Time
		}
		if rejectionReason.Valid {
			tp.RejectionReason = &rejectionReason.String
		}

		tp.Brand = &brand
		products = append(products, tp)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating temporary products: %v", err)
	}

	return products, total, nil
}

// Approve or deny a temporary product
func (d *DatabaseClient) ReviewTemporaryProduct(req ProductApprovalRequest) (*TemporaryProduct, error) {
	// Start transaction
	tx, err := d.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %v", err)
	}
	defer tx.Rollback()

	// Update the temporary product status
	updateQuery := `
		UPDATE temporary_products 
		SET status = $1, reviewed_by = $2, reviewed_at = $3, rejection_reason = $4, updated_at = NOW()
		WHERE id = $5 AND status = 'pending'
		RETURNING id, brand_id, category, name, slug, release_year, image_url, description,
		          servings_per_container, price, serving_size_g, transparency_score, confidence_level,
		          status, submitted_by, submitted_at, reviewed_by, reviewed_at, rejection_reason,
		          created_at, updated_at
	`

	var tp TemporaryProduct
	var submittedBy, reviewedBy, rejectionReason sql.NullString
	var reviewedAt sql.NullTime

	err = tx.QueryRow(
		updateQuery,
		req.Status, req.ReviewedBy, time.Now(), req.RejectionReason, req.ID,
	).Scan(
		&tp.ID, &tp.BrandID, &tp.Category, &tp.Name, &tp.Slug, &tp.ReleaseYear,
		&tp.ImageURL, &tp.Description, &tp.ServingsPerContainer, &tp.Price,
		&tp.ServingSizeG, &tp.TransparencyScore, &tp.ConfidenceLevel,
		&tp.Status, &submittedBy, &tp.SubmittedAt, &reviewedBy,
		&reviewedAt, &rejectionReason, &tp.CreatedAt, &tp.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("temporary product with ID %d not found or already reviewed", req.ID)
		}
		return nil, fmt.Errorf("failed to update temporary product: %v", err)
	}

	if submittedBy.Valid {
		tp.SubmittedBy = &submittedBy.String
	}
	if reviewedBy.Valid {
		tp.ReviewedBy = &reviewedBy.String
	}
	if reviewedAt.Valid {
		tp.ReviewedAt = &reviewedAt.Time
	}
	if rejectionReason.Valid {
		tp.RejectionReason = &rejectionReason.String
	}

	// If approved, migrate to main products table
	if req.Status == "accepted" {
		newProductID, err := d.migrateAcceptedProduct(tx, req.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to migrate approved product: %v", err)
		}
		log.Printf("✅ Product migrated to main table with ID: %d", newProductID)
	}

	// Commit transaction
	err = tx.Commit()
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	log.Printf("✅ Successfully reviewed temporary product %d with status: %s", req.ID, req.Status)
	return &tp, nil
}

// Migrate accepted product to main products table
func (d *DatabaseClient) migrateAcceptedProduct(tx *sql.Tx, tempProductID int) (int, error) {
	// Get the temporary product data
	var tempProduct TemporaryProduct
	query := `SELECT * FROM temporary_products WHERE id = $1 AND status = 'accepted'`
	
	err := tx.QueryRow(query, tempProductID).Scan(
		&tempProduct.ID, &tempProduct.BrandID, &tempProduct.Category, &tempProduct.Name,
		&tempProduct.Slug, &tempProduct.ReleaseYear, &tempProduct.ImageURL,
		&tempProduct.Description, &tempProduct.ServingsPerContainer, &tempProduct.Price,
		&tempProduct.ServingSizeG, &tempProduct.TransparencyScore, &tempProduct.ConfidenceLevel,
		&tempProduct.Status, &tempProduct.SubmittedBy, &tempProduct.SubmittedAt,
		&tempProduct.ReviewedBy, &tempProduct.ReviewedAt, &tempProduct.RejectionReason,
		&tempProduct.CreatedAt, &tempProduct.UpdatedAt,
	)
	if err != nil {
		return 0, fmt.Errorf("temporary product not found or not accepted: %v", err)
	}

	// Insert into main products table
	insertQuery := `
		INSERT INTO products (
			brand_id, category, name, slug, release_year, image_url, description,
			servings_per_container, price, serving_size_g, transparency_score, confidence_level
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
		) RETURNING id
	`

	var newProductID int
	err = tx.QueryRow(insertQuery,
		tempProduct.BrandID, tempProduct.Category, tempProduct.Name, tempProduct.Slug,
		tempProduct.ReleaseYear, tempProduct.ImageURL, tempProduct.Description,
		tempProduct.ServingsPerContainer, tempProduct.Price, tempProduct.ServingSizeG,
		tempProduct.TransparencyScore, tempProduct.ConfidenceLevel,
	).Scan(&newProductID)

	if err != nil {
		return 0, fmt.Errorf("failed to insert into main products table: %v", err)
	}

	// Migrate category-specific details
	err = d.migrateProductDetails(tx, tempProductID, newProductID, tempProduct.Category)
	if err != nil {
		return 0, fmt.Errorf("failed to migrate product details: %v", err)
	}

	// Delete from temporary tables
	deleteQuery := `DELETE FROM temporary_products WHERE id = $1`
	_, err = tx.Exec(deleteQuery, tempProductID)
	if err != nil {
		return 0, fmt.Errorf("failed to delete temporary product: %v", err)
	}

	return newProductID, nil
}

// Insert temporary product details based on category
func (d *DatabaseClient) insertTemporaryProductDetails(tx *sql.Tx, productID int, req TemporaryProductRequest) error {
	switch req.Category {
	case "pre-workout":
		return d.insertTemporaryPreworkoutDetails(tx, productID)
	case "non-stim-pre-workout":
		return d.insertTemporaryNonStimPreworkoutDetails(tx, productID)
	case "energy-drink":
		return d.insertTemporaryEnergyDrinkDetails(tx, productID)
	case "protein":
		return d.insertTemporaryProteinDetails(tx, productID)
	case "bcaa", "eaa":
		return d.insertTemporaryAminoAcidDetails(tx, productID)
	case "fat-burner", "appetite-suppressant":
		return d.insertTemporaryFatBurnerDetails(tx, productID)
	case "creatine":
		// Creatine doesn't have a specific details table
		return nil
	default:
		return fmt.Errorf("unsupported product category: %s", req.Category)
	}
}

// Insert functions for each temporary product detail table
func (d *DatabaseClient) insertTemporaryPreworkoutDetails(tx *sql.Tx, productID int) error {
	query := `
		INSERT INTO temporary_preworkout_details (
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

func (d *DatabaseClient) insertTemporaryNonStimPreworkoutDetails(tx *sql.Tx, productID int) error {
	query := `
		INSERT INTO temporary_non_stim_preworkout_details (
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

func (d *DatabaseClient) insertTemporaryEnergyDrinkDetails(tx *sql.Tx, productID int) error {
	query := `
		INSERT INTO temporary_energy_drink_details (
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

func (d *DatabaseClient) insertTemporaryProteinDetails(tx *sql.Tx, productID int) error {
	query := `
		INSERT INTO temporary_protein_details (
			product_id, protein_claim_g, effective_protein_g, whey_concentrate_g,
			whey_isolate_g, whey_hydrolysate_g, casein_g, egg_protein_g, soy_protein_g
		) VALUES (
			$1, -1, -1, -1, -1, -1, -1, -1, -1
		)
	`
	_, err := tx.Exec(query, productID)
	return err
}

func (d *DatabaseClient) insertTemporaryAminoAcidDetails(tx *sql.Tx, productID int) error {
	query := `
		INSERT INTO temporary_amino_acid_details (
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

func (d *DatabaseClient) insertTemporaryFatBurnerDetails(tx *sql.Tx, productID int) error {
	query := `
		INSERT INTO temporary_fat_burner_details (
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

// Migrate product details from temporary to main tables
func (d *DatabaseClient) migrateProductDetails(tx *sql.Tx, tempProductID, newProductID int, category string) error {
	switch category {
	case "pre-workout":
		return d.migratePreworkoutDetails(tx, tempProductID, newProductID)
	case "non-stim-pre-workout":
		return d.migrateNonStimPreworkoutDetails(tx, tempProductID, newProductID)
	case "energy-drink":
		return d.migrateEnergyDrinkDetails(tx, tempProductID, newProductID)
	case "protein":
		return d.migrateProteinDetails(tx, tempProductID, newProductID)
	case "bcaa", "eaa":
		return d.migrateAminoAcidDetails(tx, tempProductID, newProductID)
	case "fat-burner", "appetite-suppressant":
		return d.migrateFatBurnerDetails(tx, tempProductID, newProductID)
	case "creatine":
		return nil // No details table
	default:
		return fmt.Errorf("unsupported product category: %s", category)
	}
}

// Migration functions for each detail table
func (d *DatabaseClient) migratePreworkoutDetails(tx *sql.Tx, tempProductID, newProductID int) error {
	query := `
		INSERT INTO preworkout_details 
		SELECT $1 as product_id, serving_scoops, serving_g, sugar_g, key_features,
		       l_citrulline_mg, creatine_monohydrate_mg, glycerpump_mg,
		       betaine_anhydrous_mg, agmatine_sulfate_mg, l_tyrosine_mg,
		       caffeine_anhydrous_mg, n_phenethyl_dimethylamine_citrate_mg,
		       kanna_extract_mg, huperzine_a_mcg, bioperine_mg
		FROM temporary_preworkout_details 
		WHERE product_id = $2
	`
	_, err := tx.Exec(query, newProductID, tempProductID)
	return err
}

func (d *DatabaseClient) migrateNonStimPreworkoutDetails(tx *sql.Tx, tempProductID, newProductID int) error {
	query := `
		INSERT INTO non_stim_preworkout_details 
		SELECT $1 as product_id, serving_scoops, serving_g, key_features, calories,
		       total_carbohydrate_g, niacin_mg, vitamin_b6_mg, vitamin_b12_mcg,
		       magnesium_mg, sodium_mg, potassium_mg, l_citrulline_mg,
		       creatine_monohydrate_mg, betaine_anhydrous_mg, glycerol_powder_mg,
		       malic_acid_mg, taurine_mg, sodium_nitrate_mg, agmatine_sulfate_mg,
		       vasodrive_ap_mg
		FROM temporary_non_stim_preworkout_details 
		WHERE product_id = $2
	`
	_, err := tx.Exec(query, newProductID, tempProductID)
	return err
}

func (d *DatabaseClient) migrateEnergyDrinkDetails(tx *sql.Tx, tempProductID, newProductID int) error {
	query := `
		INSERT INTO energy_drink_details 
		SELECT $1 as product_id, serving_size_fl_oz, sugar_g, key_features, caffeine_mg,
		       n_acetyl_l_tyrosine_mg, alpha_gpc_mg, l_theanine_mg, huperzine_a_mcg,
		       uridine_monophosphate_mg, saffron_extract_mg, vitamin_c_mg,
		       niacin_b3_mg, vitamin_b6_mg, vitamin_b12_mcg, pantothenic_acid_b5_mg
		FROM temporary_energy_drink_details 
		WHERE product_id = $2
	`
	_, err := tx.Exec(query, newProductID, tempProductID)
	return err
}

func (d *DatabaseClient) migrateProteinDetails(tx *sql.Tx, tempProductID, newProductID int) error {
	query := `
		INSERT INTO protein_details 
		SELECT $1 as product_id, protein_claim_g, effective_protein_g, whey_concentrate_g,
		       whey_isolate_g, whey_hydrolysate_g, casein_g, egg_protein_g, soy_protein_g
		FROM temporary_protein_details 
		WHERE product_id = $2
	`
	_, err := tx.Exec(query, newProductID, tempProductID)
	return err
}

func (d *DatabaseClient) migrateAminoAcidDetails(tx *sql.Tx, tempProductID, newProductID int) error {
	query := `
		INSERT INTO amino_acid_details 
		SELECT $1 as product_id, key_features, total_eaas_mg, l_leucine_mg, l_isoleucine_mg,
		       l_valine_mg, l_lysine_hcl_mg, l_threonine_mg, l_phenylalanine_mg,
		       l_tryptophan_mg, l_histidine_hcl_mg, l_methionine_mg,
		       betaine_anhydrous_mg, coconut_water_powder_mg, astragin_mg
		FROM temporary_amino_acid_details 
		WHERE product_id = $2
	`
	_, err := tx.Exec(query, newProductID, tempProductID)
	return err
}

func (d *DatabaseClient) migrateFatBurnerDetails(tx *sql.Tx, tempProductID, newProductID int) error {
	query := `
		INSERT INTO fat_burner_details 
		SELECT $1 as product_id, stimulant_based, key_features, l_carnitine_l_tartrate_mg,
		       green_tea_extract_mg, capsimax_mg, grains_of_paradise_mg,
		       ksm66_ashwagandha_mg, kelp_extract_mcg, selenium_mcg,
		       zinc_picolinate_mg, five_htp_mg, caffeine_anhydrous_mg,
		       halostachine_mg, rauwolscine_mcg, bioperine_mg
		FROM temporary_fat_burner_details 
		WHERE product_id = $2
	`
	_, err := tx.Exec(query, newProductID, tempProductID)
	return err
}
