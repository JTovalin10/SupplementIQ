package main

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Updated handlers that use the database client
func (s *SupabaseClient) GetPaginatedProducts(c *gin.Context) {
	var req PaginatedProductsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set defaults
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 || req.Limit > 100 {
		req.Limit = 20
	}

	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Get products from database
	products, total, err := db.GetPaginatedProducts(req.Category, req.Page, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalPages := (total + req.Limit - 1) / req.Limit

	response := PaginatedResponse{
		Data:       products,
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      total,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, response)
}

func (s *SupabaseClient) SearchProducts(c *gin.Context) {
	var req SearchRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter is required"})
		return
	}

	// Set defaults
	if req.Limit <= 0 || req.Limit > 100 {
		req.Limit = 20
	}

	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Search products in database
	products, total, err := db.SearchProducts(req.Query, req.Limit, req.Offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := SearchResponse{
		Results: products,
		Total:   total,
		Query:   req.Query,
	}

	c.JSON(http.StatusOK, response)
}

func (s *SupabaseClient) FilterProducts(c *gin.Context) {
	var req FilterRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set defaults
	if req.Limit <= 0 || req.Limit > 100 {
		req.Limit = 20
	}
	if req.SortBy == "" {
		req.SortBy = "created_at"
	}
	if req.SortOrder == "" {
		req.SortOrder = "desc"
	}

	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Filter products in database
	products, total, err := db.FilterProducts(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := PaginatedResponse{
		Data:       products,
		Page:       (req.Offset / req.Limit) + 1,
		Limit:      req.Limit,
		Total:      total,
		TotalPages: (total + req.Limit - 1) / req.Limit,
	}

	c.JSON(http.StatusOK, response)
}

func (s *SupabaseClient) GetAdminCache(c *gin.Context) {
	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Get admin users from database
	admins, owners, err := db.GetAdminUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := AdminCacheResponse{
		Admins: admins,
		Owners: owners,
		Total:  len(admins) + len(owners),
	}

	c.JSON(http.StatusOK, response)
}

func (s *SupabaseClient) UpdateProduct(c *gin.Context) {
	// Parse product ID from URL
	productIDStr := c.Param("id")
	productID, err := strconv.Atoi(productIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req ProductUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set the ID from URL parameter
	req.ID = productID

	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Update product in database
	updatedProduct, err := db.UpdateProduct(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product updated successfully",
		"product": updatedProduct,
	})
}

// New handler for getting a single product with all details
func (s *SupabaseClient) GetProductWithDetails(c *gin.Context) {
	// Parse product ID from URL
	productIDStr := c.Param("id")
	productID, err := strconv.Atoi(productIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Get product with details from database
	product, err := db.GetProductWithDetails(productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, product)
}

// Handler for getting all brands (useful for filters)
func (s *SupabaseClient) GetBrands(c *gin.Context) {
	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Query brands
	query := `
		SELECT id, name, slug, website, product_count, created_at
		FROM brands
		ORDER BY name ASC
	`

	rows, err := db.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query brands"})
		return
	}
	defer rows.Close()

	var brands []Brand
	for rows.Next() {
		var brand Brand
		err := rows.Scan(
			&brand.ID, &brand.Name, &brand.Slug, &brand.Website,
			&brand.ProductCount, &brand.CreatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan brand"})
			return
		}
		brands = append(brands, brand)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating brands"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"brands": brands,
		"total":  len(brands),
	})
}

// Handler for getting product categories (useful for filters)
func (s *SupabaseClient) GetCategories(c *gin.Context) {
	categories := []string{
		"protein",
		"pre-workout",
		"non-stim-pre-workout",
		"energy-drink",
		"bcaa",
		"eaa",
		"fat-burner",
		"appetite-suppressant",
		"creatine",
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
		"total":      len(categories),
	})
}

// Handler for getting product statistics
func (s *SupabaseClient) GetProductStats(c *gin.Context) {
	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Get statistics
	statsQuery := `
		SELECT 
			COUNT(*) as total_products,
			COUNT(DISTINCT brand_id) as total_brands,
			AVG(price) as average_price,
			AVG(transparency_score) as average_transparency,
			COUNT(CASE WHEN confidence_level = 'verified' THEN 1 END) as verified_products
		FROM products
	`

	var stats struct {
		TotalProducts       int     `json:"total_products"`
		TotalBrands         int     `json:"total_brands"`
		AveragePrice        float64 `json:"average_price"`
		AverageTransparency float64 `json:"average_transparency"`
		VerifiedProducts    int     `json:"verified_products"`
	}

	err = db.db.QueryRow(statsQuery).Scan(
		&stats.TotalProducts, &stats.TotalBrands, &stats.AveragePrice,
		&stats.AverageTransparency, &stats.VerifiedProducts,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get statistics"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"statistics": stats,
		"timestamp":  time.Now().UTC(),
	})
}

// Handler for health check with database connectivity
func (s *SupabaseClient) HealthCheck(c *gin.Context) {
	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":    "unhealthy",
			"service":   "DataFetchingService",
			"error":     "Database connection failed",
			"timestamp": time.Now().UTC(),
		})
		return
	}
	defer db.Close()

	// Test database connection
	err = db.db.Ping()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":    "unhealthy",
			"service":   "DataFetchingService",
			"error":     "Database ping failed",
			"timestamp": time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":      "healthy",
		"service":     "DataFetchingService",
		"database":    "connected",
		"timestamp":   time.Now().UTC(),
		"version":     "1.0.0",
		"concurrency": "optimized_for_thousands",
	})
}

// Temporary Products Workflow Handlers

// SubmitTemporaryProduct handles product submission for approval
func (s *SupabaseClient) SubmitTemporaryProduct(c *gin.Context) {
	var req TemporaryProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Submit temporary product
	tempProduct, err := db.SubmitTemporaryProduct(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Product submitted for approval",
		"product": tempProduct,
	})
}

// GetTemporaryProducts retrieves temporary products with filtering
func (s *SupabaseClient) GetTemporaryProducts(c *gin.Context) {
	// Parse query parameters
	status := c.Query("status") // pending, accepted, denied, or empty for all
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	// Validate parameters
	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	// Validate status
	if status != "" && status != "pending" && status != "accepted" && status != "denied" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Must be 'pending', 'accepted', 'denied', or empty"})
		return
	}

	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Get temporary products
	products, total, err := db.GetTemporaryProducts(status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalPages := (total + limit - 1) / limit

	response := TemporaryProductsResponse{
		Products:   products,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// ReviewTemporaryProduct handles product approval/denial
func (s *SupabaseClient) ReviewTemporaryProduct(c *gin.Context) {
	var req ProductApprovalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	if req.Status != "accepted" && req.Status != "denied" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status must be 'accepted' or 'denied'"})
		return
	}

	// If denied, rejection reason should be provided
	if req.Status == "denied" && (req.RejectionReason == nil || *req.RejectionReason == "") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rejection reason is required when denying a product"})
		return
	}

	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Review temporary product
	product, err := db.ReviewTemporaryProduct(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	statusMessage := "Product approved and migrated to main database"
	if req.Status == "denied" {
		statusMessage = "Product denied"
	}

	response := ProductApprovalResponse{
		Message: statusMessage,
		Product: *product,
	}

	c.JSON(http.StatusOK, response)
}

// GetPendingProductsCount returns count of pending products for admin dashboard
func (s *SupabaseClient) GetPendingProductsCount(c *gin.Context) {
	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Count pending products
	query := `SELECT COUNT(*) FROM temporary_products WHERE status = 'pending'`
	var count int
	err = db.db.QueryRow(query).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count pending products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pending_count": count,
		"timestamp":     time.Now().UTC(),
	})
}

// GetTemporaryProductById gets a specific temporary product by ID
func (s *SupabaseClient) GetTemporaryProductById(c *gin.Context) {
	// Parse product ID from URL
	productIDStr := c.Param("id")
	productID, err := strconv.Atoi(productIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Get database client
	db, err := NewDatabaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed"})
		return
	}
	defer db.Close()

	// Get temporary product
	query := `
		SELECT tp.id, tp.brand_id, tp.category, tp.name, tp.slug, tp.release_year,
		       tp.image_url, tp.description, tp.servings_per_container, tp.price,
		       tp.serving_size_g, tp.transparency_score, tp.confidence_level,
		       tp.status, tp.submitted_by, tp.submitted_at, tp.reviewed_by,
		       tp.reviewed_at, tp.rejection_reason, tp.created_at, tp.updated_at,
		       b.name as brand_name, b.slug as brand_slug, b.website as brand_website
		FROM temporary_products tp
		JOIN brands b ON tp.brand_id = b.id
		WHERE tp.id = $1
	`

	var tp TemporaryProduct
	var brand Brand
	var submittedBy, reviewedBy, rejectionReason sql.NullString
	var reviewedAt sql.NullTime

	err = db.db.QueryRow(query, productID).Scan(
		&tp.ID, &tp.BrandID, &tp.Category, &tp.Name, &tp.Slug, &tp.ReleaseYear,
		&tp.ImageURL, &tp.Description, &tp.ServingsPerContainer, &tp.Price,
		&tp.ServingSizeG, &tp.TransparencyScore, &tp.ConfidenceLevel,
		&tp.Status, &submittedBy, &tp.SubmittedAt, &reviewedBy,
		&reviewedAt, &rejectionReason, &tp.CreatedAt, &tp.UpdatedAt,
		&brand.Name, &brand.Slug, &brand.Website,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Temporary product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get temporary product"})
		return
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

	c.JSON(http.StatusOK, tp)
}
