package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

// Database connection and query execution
type DatabaseClient struct {
	db *sql.DB
}

// NewDatabaseClient creates a new database connection
func NewDatabaseClient() (*DatabaseClient, error) {
	// Get database connection string from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Construct from individual components if DATABASE_URL not provided
		host := getEnv("DB_HOST", "localhost")
		port := getEnv("DB_PORT", "5432")
		user := getEnv("DB_USER", "postgres")
		password := getEnv("DB_PASSWORD", "")
		dbname := getEnv("DB_NAME", "supplementiq")
		
		dbURL = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
			host, port, user, password, dbname)
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	// Configure connection pool for high concurrency
	db.SetMaxOpenConns(100)                // Maximum number of open connections
	db.SetMaxIdleConns(10)                 // Maximum number of idle connections
	db.SetConnMaxLifetime(30 * time.Minute) // Maximum connection lifetime

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("✅ Database connection established")
	return &DatabaseClient{db: db}, nil
}

// Close closes the database connection
func (d *DatabaseClient) Close() error {
	return d.db.Close()
}

// GetPaginatedProducts retrieves products with pagination and category filtering
func (d *DatabaseClient) GetPaginatedProducts(category string, page, limit int) ([]Product, int, error) {
	offset := (page - 1) * limit

	// Count query
	countQuery := `
		SELECT COUNT(*)
		FROM products p
		JOIN brands b ON p.brand_id = b.id
		WHERE ($1 = '' OR p.category = $1)
	`
	
	var total int
	err := d.db.QueryRow(countQuery, category).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count products: %v", err)
	}

	// Data query
	dataQuery := `
		SELECT p.id, p.brand_id, p.category, p.name, p.slug, p.release_year,
		       p.image_url, p.description, p.servings_per_container, p.price,
		       p.serving_size_g, p.transparency_score, p.confidence_level,
		       p.created_at, p.updated_at,
		       b.id as brand_id, b.name as brand_name, b.slug as brand_slug,
		       b.website as brand_website, b.product_count as brand_product_count,
		       b.created_at as brand_created_at
		FROM products p
		JOIN brands b ON p.brand_id = b.id
		WHERE ($1 = '' OR p.category = $1)
		ORDER BY p.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := d.db.Query(dataQuery, category, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query products: %v", err)
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		var brand Brand
		
		err := rows.Scan(
			&p.ID, &p.BrandID, &p.Category, &p.Name, &p.Slug, &p.ReleaseYear,
			&p.ImageURL, &p.Description, &p.ServingsPerContainer, &p.Price,
			&p.ServingSizeG, &p.TransparencyScore, &p.ConfidenceLevel,
			&p.CreatedAt, &p.UpdatedAt,
			&brand.ID, &brand.Name, &brand.Slug, &brand.Website,
			&brand.ProductCount, &brand.CreatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan product: %v", err)
		}

		p.Brand = &brand
		products = append(products, p)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating products: %v", err)
	}

	return products, total, nil
}

// SearchProducts performs full-text search on products
func (d *DatabaseClient) SearchProducts(query string, limit, offset int) ([]Product, int, error) {
	searchPattern := "%" + query + "%"

	// Count query
	countQuery := `
		SELECT COUNT(*)
		FROM products p
		JOIN brands b ON p.brand_id = b.id
		WHERE p.search_vector @@ plainto_tsquery('english', $1)
		OR p.name ILIKE $2
		OR b.name ILIKE $2
	`
	
	var total int
	err := d.db.QueryRow(countQuery, query, searchPattern).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count search results: %v", err)
	}

	// Data query
	dataQuery := `
		SELECT p.id, p.brand_id, p.category, p.name, p.slug, p.release_year,
		       p.image_url, p.description, p.servings_per_container, p.price,
		       p.serving_size_g, p.transparency_score, p.confidence_level,
		       p.created_at, p.updated_at,
		       b.id as brand_id, b.name as brand_name, b.slug as brand_slug,
		       b.website as brand_website, b.product_count as brand_product_count,
		       b.created_at as brand_created_at,
		       ts_rank(p.search_vector, plainto_tsquery('english', $1)) as rank
		FROM products p
		JOIN brands b ON p.brand_id = b.id
		WHERE p.search_vector @@ plainto_tsquery('english', $1)
		OR p.name ILIKE $2
		OR b.name ILIKE $2
		ORDER BY rank DESC, p.name ASC
		LIMIT $3 OFFSET $4
	`

	rows, err := d.db.Query(dataQuery, query, searchPattern, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to search products: %v", err)
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		var brand Brand
		var rank float64
		
		err := rows.Scan(
			&p.ID, &p.BrandID, &p.Category, &p.Name, &p.Slug, &p.ReleaseYear,
			&p.ImageURL, &p.Description, &p.ServingsPerContainer, &p.Price,
			&p.ServingSizeG, &p.TransparencyScore, &p.ConfidenceLevel,
			&p.CreatedAt, &p.UpdatedAt,
			&brand.ID, &brand.Name, &brand.Slug, &brand.Website,
			&brand.ProductCount, &brand.CreatedAt, &rank,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan search result: %v", err)
		}

		p.Brand = &brand
		products = append(products, p)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating search results: %v", err)
	}

	return products, total, nil
}

// FilterProducts applies multiple filters to products
func (d *DatabaseClient) FilterProducts(filters FilterRequest) ([]Product, int, error) {
	var conditions []string
	var args []interface{}
	argIndex := 1

	// Brand filter
	if len(filters.Brands) > 0 {
		brandConditions := make([]string, len(filters.Brands))
		for i, brand := range filters.Brands {
			brandConditions[i] = fmt.Sprintf("$%d", argIndex)
			args = append(args, brand)
			argIndex++
		}
		conditions = append(conditions, fmt.Sprintf("b.name IN (%s)", strings.Join(brandConditions, ",")))
	}

	// Category filter
	if len(filters.Categories) > 0 {
		categoryConditions := make([]string, len(filters.Categories))
		for i, category := range filters.Categories {
			categoryConditions[i] = fmt.Sprintf("$%d", argIndex)
			args = append(args, category)
			argIndex++
		}
		conditions = append(conditions, fmt.Sprintf("p.category IN (%s)", strings.Join(categoryConditions, ",")))
	}

	// Price filter
	if filters.PriceMin != nil {
		conditions = append(conditions, fmt.Sprintf("p.price >= $%d", argIndex))
		args = append(args, *filters.PriceMin)
		argIndex++
	}
	if filters.PriceMax != nil {
		conditions = append(conditions, fmt.Sprintf("p.price <= $%d", argIndex))
		args = append(args, *filters.PriceMax)
		argIndex++
	}

	// Build WHERE clause
	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Validate sort parameters
	validSortFields := map[string]bool{
		"price": true, "name": true, "transparency_score": true, 
		"created_at": true, "updated_at": true,
	}
	if !validSortFields[filters.SortBy] {
		filters.SortBy = "created_at"
	}
	if filters.SortOrder != "asc" && filters.SortOrder != "desc" {
		filters.SortOrder = "desc"
	}

	orderClause := fmt.Sprintf("ORDER BY p.%s %s", filters.SortBy, strings.ToUpper(filters.SortOrder))

	// Count query
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM products p
		JOIN brands b ON p.brand_id = b.id
		%s
	`, whereClause)
	
	var total int
	err := d.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count filtered products: %v", err)
	}

	// Data query
	dataQuery := fmt.Sprintf(`
		SELECT p.id, p.brand_id, p.category, p.name, p.slug, p.release_year,
		       p.image_url, p.description, p.servings_per_container, p.price,
		       p.serving_size_g, p.transparency_score, p.confidence_level,
		       p.created_at, p.updated_at,
		       b.id as brand_id, b.name as brand_name, b.slug as brand_slug,
		       b.website as brand_website, b.product_count as brand_product_count,
		       b.created_at as brand_created_at
		FROM products p
		JOIN brands b ON p.brand_id = b.id
		%s
		%s
		LIMIT $%d OFFSET $%d
	`, whereClause, orderClause, argIndex, argIndex+1)

	args = append(args, filters.Limit, filters.Offset)

	rows, err := d.db.Query(dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query filtered products: %v", err)
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		var brand Brand
		
		err := rows.Scan(
			&p.ID, &p.BrandID, &p.Category, &p.Name, &p.Slug, &p.ReleaseYear,
			&p.ImageURL, &p.Description, &p.ServingsPerContainer, &p.Price,
			&p.ServingSizeG, &p.TransparencyScore, &p.ConfidenceLevel,
			&p.CreatedAt, &p.UpdatedAt,
			&brand.ID, &brand.Name, &brand.Slug, &brand.Website,
			&brand.ProductCount, &brand.CreatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan filtered product: %v", err)
		}

		p.Brand = &brand
		products = append(products, p)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating filtered products: %v", err)
	}

	return products, total, nil
}

// GetAdminUsers retrieves all admin and owner users
func (d *DatabaseClient) GetAdminUsers() ([]User, []User, error) {
	query := `
		SELECT id, username, email, role, reputation_points, bio, avatar_url,
		       created_at, updated_at
		FROM users
		WHERE role IN ('admin', 'owner')
		ORDER BY 
			CASE role 
				WHEN 'owner' THEN 1 
				WHEN 'admin' THEN 2 
				ELSE 3 
			END,
			reputation_points DESC
	`

	rows, err := d.db.Query(query)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query admin users: %v", err)
	}
	defer rows.Close()

	var admins []User
	var owners []User

	for rows.Next() {
		var user User
		err := rows.Scan(
			&user.ID, &user.Username, &user.Email, &user.Role,
			&user.ReputationPoints, &user.Bio, &user.AvatarURL,
			&user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to scan user: %v", err)
		}

		if user.Role == "admin" {
			admins = append(admins, user)
		} else if user.Role == "owner" {
			owners = append(owners, user)
		}
	}

	if err = rows.Err(); err != nil {
		return nil, nil, fmt.Errorf("error iterating users: %v", err)
	}

	return admins, owners, nil
}

// UpdateProduct updates product information
func (d *DatabaseClient) UpdateProduct(updateReq ProductUpdateRequest) (*Product, error) {
	// Build dynamic UPDATE query
	var setParts []string
	var args []interface{}
	argIndex := 1

	if updateReq.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *updateReq.Name)
		argIndex++
	}

	if updateReq.Description != nil {
		setParts = append(setParts, fmt.Sprintf("description = $%d", argIndex))
		args = append(args, *updateReq.Description)
		argIndex++
	}

	if updateReq.Price != nil {
		setParts = append(setParts, fmt.Sprintf("price = $%d", argIndex))
		args = append(args, *updateReq.Price)
		argIndex++
	}

	if updateReq.ImageURL != nil {
		setParts = append(setParts, fmt.Sprintf("image_url = $%d", argIndex))
		args = append(args, *updateReq.ImageURL)
		argIndex++
	}

	if updateReq.TransparencyScore != nil {
		setParts = append(setParts, fmt.Sprintf("transparency_score = $%d", argIndex))
		args = append(args, *updateReq.TransparencyScore)
		argIndex++
	}

	if updateReq.ConfidenceLevel != nil {
		setParts = append(setParts, fmt.Sprintf("confidence_level = $%d", argIndex))
		args = append(args, *updateReq.ConfidenceLevel)
		argIndex++
	}

	if len(setParts) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	// Add updated_at
	setParts = append(setParts, "updated_at = NOW()")
	
	// Add WHERE clause
	whereClause := fmt.Sprintf("WHERE id = $%d", argIndex)
	args = append(args, updateReq.ID)

	query := fmt.Sprintf(`
		UPDATE products 
		SET %s
		%s
		RETURNING id, brand_id, category, name, slug, release_year,
		          image_url, description, servings_per_container, price,
		          serving_size_g, transparency_score, confidence_level,
		          created_at, updated_at
	`, strings.Join(setParts, ", "), whereClause)

	var product Product
	err := d.db.QueryRow(query, args...).Scan(
		&product.ID, &product.BrandID, &product.Category, &product.Name,
		&product.Slug, &product.ReleaseYear, &product.ImageURL,
		&product.Description, &product.ServingsPerContainer, &product.Price,
		&product.ServingSizeG, &product.TransparencyScore, &product.ConfidenceLevel,
		&product.CreatedAt, &product.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("product with ID %d not found", updateReq.ID)
		}
		return nil, fmt.Errorf("failed to update product: %v", err)
	}

	return &product, nil
}

// GetProductWithDetails retrieves a product with all its detail information
func (d *DatabaseClient) GetProductWithDetails(productID int) (*ProductWithDetails, error) {
	// Get basic product info
	productQuery := `
		SELECT p.id, p.brand_id, p.category, p.name, p.slug, p.release_year,
		       p.image_url, p.description, p.servings_per_container, p.price,
		       p.serving_size_g, p.transparency_score, p.confidence_level,
		       p.created_at, p.updated_at,
		       b.id as brand_id, b.name as brand_name, b.slug as brand_slug,
		       b.website as brand_website, b.product_count as brand_product_count,
		       b.created_at as brand_created_at
		FROM products p
		JOIN brands b ON p.brand_id = b.id
		WHERE p.id = $1
	`

	var product Product
	var brand Brand
	err := d.db.QueryRow(productQuery, productID).Scan(
		&product.ID, &product.BrandID, &product.Category, &product.Name,
		&product.Slug, &product.ReleaseYear, &product.ImageURL,
		&product.Description, &product.ServingsPerContainer, &product.Price,
		&product.ServingSizeG, &product.TransparencyScore, &product.ConfidenceLevel,
		&product.CreatedAt, &product.UpdatedAt,
		&brand.ID, &brand.Name, &brand.Slug, &brand.Website,
		&brand.ProductCount, &brand.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("product with ID %d not found", productID)
		}
		return nil, fmt.Errorf("failed to get product: %v", err)
	}

	product.Brand = &brand

	// Create ProductWithDetails
	productWithDetails := &ProductWithDetails{
		Product: product,
	}

	// Get category-specific details based on product category
	switch product.Category {
	case "pre-workout":
		details, err := d.getPreworkoutDetails(productID)
		if err != nil {
			log.Printf("Warning: Failed to get preworkout details for product %d: %v", productID, err)
		} else {
			productWithDetails.PreworkoutDetails = details
		}

	case "non-stim-pre-workout":
		details, err := d.getNonStimPreworkoutDetails(productID)
		if err != nil {
			log.Printf("Warning: Failed to get non-stim preworkout details for product %d: %v", productID, err)
		} else {
			productWithDetails.NonStimPreworkoutDetails = details
		}

	case "energy-drink":
		details, err := d.getEnergyDrinkDetails(productID)
		if err != nil {
			log.Printf("Warning: Failed to get energy drink details for product %d: %v", productID, err)
		} else {
			productWithDetails.EnergyDrinkDetails = details
		}

	case "protein":
		details, err := d.getProteinDetails(productID)
		if err != nil {
			log.Printf("Warning: Failed to get protein details for product %d: %v", productID, err)
		} else {
			productWithDetails.ProteinDetails = details
		}

	case "bcaa", "eaa":
		details, err := d.getAminoAcidDetails(productID)
		if err != nil {
			log.Printf("Warning: Failed to get amino acid details for product %d: %v", productID, err)
		} else {
			productWithDetails.AminoAcidDetails = details
		}

	case "fat-burner", "appetite-suppressant":
		details, err := d.getFatBurnerDetails(productID)
		if err != nil {
			log.Printf("Warning: Failed to get fat burner details for product %d: %v", productID, err)
		} else {
			productWithDetails.FatBurnerDetails = details
		}
	}

	return productWithDetails, nil
}

// Helper methods for getting category-specific details
func (d *DatabaseClient) getPreworkoutDetails(productID int) (*PreworkoutDetails, error) {
	query := `SELECT * FROM preworkout_details WHERE product_id = $1`
	details := &PreworkoutDetails{}
	
	err := d.db.QueryRow(query, productID).Scan(
		&details.ProductID, &details.ServingScoops, &details.ServingG,
		&details.SugarG, &details.KeyFeatures, &details.LCitrullineMg,
		&details.CreatineMonohydrateMg, &details.GlycerpumpMg,
		&details.BetaineAnhydrousMg, &details.AgmatineSulfateMg,
		&details.LTyrosineMg, &details.CaffeineAnhydrousMg,
		&details.NPhenethylDimethylamineCitrateMg, &details.KannaExtractMg,
		&details.HuperzineAMcg, &details.BioperineMg,
	)
	if err != nil {
		return nil, err
	}
	
	return details, nil
}

func (d *DatabaseClient) getNonStimPreworkoutDetails(productID int) (*NonStimPreworkoutDetails, error) {
	query := `SELECT * FROM non_stim_preworkout_details WHERE product_id = $1`
	details := &NonStimPreworkoutDetails{}
	
	err := d.db.QueryRow(query, productID).Scan(
		&details.ProductID, &details.ServingScoops, &details.ServingG,
		&details.KeyFeatures, &details.Calories, &details.TotalCarbohydrateG,
		&details.NiacinMg, &details.VitaminB6Mg, &details.VitaminB12Mcg,
		&details.MagnesiumMg, &details.SodiumMg, &details.PotassiumMg,
		&details.LCitrullineMg, &details.CreatineMonohydrateMg,
		&details.BetaineAnhydrousMg, &details.GlycerolPowderMg,
		&details.MalicAcidMg, &details.TaurineMg, &details.SodiumNitrateMg,
		&details.AgmatineSulfateMg, &details.VasodriveAPMg,
	)
	if err != nil {
		return nil, err
	}
	
	return details, nil
}

func (d *DatabaseClient) getEnergyDrinkDetails(productID int) (*EnergyDrinkDetails, error) {
	query := `SELECT * FROM energy_drink_details WHERE product_id = $1`
	details := &EnergyDrinkDetails{}
	
	err := d.db.QueryRow(query, productID).Scan(
		&details.ProductID, &details.ServingSizeFlOz, &details.SugarG,
		&details.KeyFeatures, &details.CaffeineMg, &details.NAcetylLTyrosineMg,
		&details.AlphaGpcMg, &details.LTheanineMg, &details.HuperzineAMcg,
		&details.UridineMonophosphateMg, &details.SaffronExtractMg,
		&details.VitaminCMg, &details.NiacinB3Mg, &details.VitaminB6Mg,
		&details.VitaminB12Mcg, &details.PantothenicAcidB5Mg,
	)
	if err != nil {
		return nil, err
	}
	
	return details, nil
}

func (d *DatabaseClient) getProteinDetails(productID int) (*ProteinDetails, error) {
	query := `SELECT * FROM protein_details WHERE product_id = $1`
	details := &ProteinDetails{}
	
	err := d.db.QueryRow(query, productID).Scan(
		&details.ProductID, &details.ProteinClaimG, &details.EffectiveProteinG,
		&details.WheyConcentrateG, &details.WheyIsolateG, &details.WheyHydrolysateG,
		&details.CaseinG, &details.EggProteinG, &details.SoyProteinG,
	)
	if err != nil {
		return nil, err
	}
	
	return details, nil
}

func (d *DatabaseClient) getAminoAcidDetails(productID int) (*AminoAcidDetails, error) {
	query := `SELECT * FROM amino_acid_details WHERE product_id = $1`
	details := &AminoAcidDetails{}
	
	err := d.db.QueryRow(query, productID).Scan(
		&details.ProductID, &details.KeyFeatures, &details.TotalEaasMg,
		&details.LLeucineMg, &details.LIsoleucineMg, &details.LValineMg,
		&details.LLysineHclMg, &details.LThreonineMg, &details.LPhenylalanineMg,
		&details.LTryptophanMg, &details.LHistidineHclMg, &details.LMethionineMg,
		&details.BetaineAnhydrousMg, &details.CoconutWaterPowderMg, &details.AstraginMg,
	)
	if err != nil {
		return nil, err
	}
	
	return details, nil
}

func (d *DatabaseClient) getFatBurnerDetails(productID int) (*FatBurnerDetails, error) {
	query := `SELECT * FROM fat_burner_details WHERE product_id = $1`
	details := &FatBurnerDetails{}
	
	err := d.db.QueryRow(query, productID).Scan(
		&details.ProductID, &details.StimulantBased, &details.KeyFeatures,
		&details.LCarnitineLTartrateMg, &details.GreenTeaExtractMg, &details.CapsimaxMg,
		&details.GrainsOfParadiseMg, &details.Ksm66AshwagandhaMg, &details.KelpExtractMcg,
		&details.SeleniumMcg, &details.ZincPicolinateMg, &details.FiveHtpMg,
		&details.CaffeineAnhydrousMg, &details.HalostachineMg, &details.RauwolscineMcg,
		&details.BioperineMg,
	)
	if err != nil {
		return nil, err
	}
	
	return details, nil
}
