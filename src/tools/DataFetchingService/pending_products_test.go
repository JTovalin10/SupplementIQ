package main

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPendingProductSubmission(t *testing.T) {
	// Test data
	req := PendingProductRequest{
		Name:               "Test Protein",
		BrandName:          "Test Brand",
		Category:           "protein",
		JobType:            "add",
		Flavor:             "Chocolate",
		Year:               "2024",
		Price:              29.99,
		TransparencyScore:  85,
		ConfidenceLevel:    "likely",
		SubmittedBy:        "test-user-uuid",
		Notes:              stringPtr("Test submission"),
	}

	// Mock database client
	db := &MockDatabaseClient{}

	// Test submission
	product, err := db.SubmitPendingProduct(req)

	// Assertions
	require.NoError(t, err)
	assert.NotNil(t, product)
	assert.Equal(t, "Test Protein", product.Name)
	assert.Equal(t, "Test Brand", product.Brand.Name)
	assert.Equal(t, "protein", product.Category)
	assert.Equal(t, "pending", product.Status)
	assert.Equal(t, "add", product.JobType)
	assert.Equal(t, "test-user-uuid", product.SubmittedBy)
	assert.NotZero(t, product.SubmittedAt)
}

func TestPendingProductApproval(t *testing.T) {
	// Test approval request
	req := ProductApprovalRequest{
		ID:         1,
		Status:     "approved",
		ReviewedBy: "admin-uuid",
	}

	// Mock database client
	db := &MockDatabaseClient{}

	// Test approval
	product, err := db.ReviewPendingProduct(req)

	// Assertions
	require.NoError(t, err)
	assert.NotNil(t, product)
	assert.Equal(t, "approved", product.Status)
	assert.Equal(t, "admin-uuid", *product.ReviewedBy)
	assert.NotNil(t, product.ReviewedAt)
}

func TestPendingProductRejection(t *testing.T) {
	// Test rejection request
	rejectionReason := "Insufficient product information"
	req := ProductApprovalRequest{
		ID:              1,
		Status:          "rejected",
		ReviewedBy:      "admin-uuid",
		RejectionReason: &rejectionReason,
	}

	// Mock database client
	db := &MockDatabaseClient{}

	// Test rejection
	product, err := db.ReviewPendingProduct(req)

	// Assertions
	require.NoError(t, err)
	assert.NotNil(t, product)
	assert.Equal(t, "rejected", product.Status)
	assert.Equal(t, "admin-uuid", *product.ReviewedBy)
	assert.Equal(t, rejectionReason, *product.RejectionReason)
	assert.NotNil(t, product.ReviewedAt)
}

func TestGetPendingProducts(t *testing.T) {
	// Mock database client
	db := &MockDatabaseClient{}

	// Test getting pending products
	products, total, err := db.GetPendingProducts("pending", 1, 20)

	// Assertions
	require.NoError(t, err)
	assert.NotNil(t, products)
	assert.GreaterOrEqual(t, total, 0)
	assert.LessOrEqual(t, len(products), 20)
}

func TestGetPendingProductsWithStatusFilter(t *testing.T) {
	// Mock database client
	db := &MockDatabaseClient{}

	// Test getting approved products
	products, total, err := db.GetPendingProducts("approved", 1, 10)

	// Assertions
	require.NoError(t, err)
	assert.NotNil(t, products)
	assert.GreaterOrEqual(t, total, 0)
	
	// All returned products should be approved
	for _, product := range products {
		assert.Equal(t, "approved", product.Status)
	}
}

func TestProductMigration(t *testing.T) {
	// Mock database client
	db := &MockDatabaseClient{}

	// Test migrating approved product
	newProductID, err := db.migrateApprovedProduct(1)

	// Assertions
	require.NoError(t, err)
	assert.Greater(t, newProductID, 0)
}

func TestCategorySpecificDetailsInsertion(t *testing.T) {
	tests := []struct {
		name     string
		category string
	}{
		{"Pre-workout", "pre-workout"},
		{"Non-stim Pre-workout", "non-stim-pre-workout"},
		{"Energy Drink", "energy-drink"},
		{"Protein", "protein"},
		{"BCAA", "bcaa"},
		{"EAA", "eaa"},
		{"Fat Burner", "fat-burner"},
		{"Appetite Suppressant", "appetite-suppressant"},
		{"Creatine", "creatine"},
	}

	db := &MockDatabaseClient{}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := PendingProductRequest{
				Name:        "Test Product",
				BrandName:   "Test Brand",
				Category:    tt.category,
				JobType:     "add",
				Price:       29.99,
				SubmittedBy: "test-user-uuid",
			}

			// Test submission
			product, err := db.SubmitPendingProduct(req)

			// Assertions
			require.NoError(t, err)
			assert.NotNil(t, product)
			assert.Equal(t, tt.category, product.Category)
		})
	}
}

func TestValidationErrors(t *testing.T) {
	tests := []struct {
		name        string
		req         PendingProductRequest
		expectError bool
	}{
		{
			name: "Missing required fields",
			req: PendingProductRequest{
				// Missing name, brand_name, category, etc.
			},
			expectError: true,
		},
		{
			name: "Invalid category",
			req: PendingProductRequest{
				Name:        "Test Product",
				BrandName:   "Test Brand",
				Category:    "invalid-category",
				JobType:     "add",
				Price:       29.99,
				SubmittedBy: "test-user-uuid",
			},
			expectError: true,
		},
		{
			name: "Invalid job type",
			req: PendingProductRequest{
				Name:        "Test Product",
				BrandName:   "Test Brand",
				Category:    "protein",
				JobType:     "invalid-job-type",
				Price:       29.99,
				SubmittedBy: "test-user-uuid",
			},
			expectError: true,
		},
		{
			name: "Negative price",
			req: PendingProductRequest{
				Name:        "Test Product",
				BrandName:   "Test Brand",
				Category:    "protein",
				JobType:     "add",
				Price:       -10.00,
				SubmittedBy: "test-user-uuid",
			},
			expectError: true,
		},
		{
			name: "Valid request",
			req: PendingProductRequest{
				Name:        "Test Product",
				BrandName:   "Test Brand",
				Category:    "protein",
				JobType:     "add",
				Price:       29.99,
				SubmittedBy: "test-user-uuid",
			},
			expectError: false,
		},
	}

	db := &MockDatabaseClient{}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := db.SubmitPendingProduct(tt.req)

			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestApprovalValidationErrors(t *testing.T) {
	tests := []struct {
		name        string
		req         ProductApprovalRequest
		expectError bool
	}{
		{
			name: "Invalid status",
			req: ProductApprovalRequest{
				ID:         1,
				Status:     "invalid-status",
				ReviewedBy: "admin-uuid",
			},
			expectError: true,
		},
		{
			name: "Missing rejection reason for rejection",
			req: ProductApprovalRequest{
				ID:         1,
				Status:     "rejected",
				ReviewedBy: "admin-uuid",
				// Missing rejection_reason
			},
			expectError: true,
		},
		{
			name: "Empty rejection reason for rejection",
			req: ProductApprovalRequest{
				ID:              1,
				Status:          "rejected",
				ReviewedBy:      "admin-uuid",
				RejectionReason: stringPtr(""),
			},
			expectError: true,
		},
		{
			name: "Valid approval",
			req: ProductApprovalRequest{
				ID:         1,
				Status:     "approved",
				ReviewedBy: "admin-uuid",
			},
			expectError: false,
		},
		{
			name: "Valid rejection with reason",
			req: ProductApprovalRequest{
				ID:              1,
				Status:          "rejected",
				ReviewedBy:      "admin-uuid",
				RejectionReason: stringPtr("Insufficient information"),
			},
			expectError: false,
		},
	}

	db := &MockDatabaseClient{}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := db.ReviewPendingProduct(tt.req)

			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// MockDatabaseClient for testing
type MockDatabaseClient struct {
	pendingProducts []PendingProduct
	nextID          int
}

func (m *MockDatabaseClient) SubmitPendingProduct(req PendingProductRequest) (*PendingProduct, error) {
	// Validation
	if req.Name == "" || req.BrandName == "" || req.Category == "" || req.JobType == "" || req.SubmittedBy == "" {
		return nil, assert.AnError
	}

	validCategories := []string{"protein", "pre-workout", "non-stim-pre-workout", "energy-drink", "bcaa", "eaa", "fat-burner", "appetite-suppressant", "creatine"}
	validJobTypes := []string{"add", "update", "delete"}

	if !contains(validCategories, req.Category) || !contains(validJobTypes, req.JobType) {
		return nil, assert.AnError
	}

	if req.Price <= 0 {
		return nil, assert.AnError
	}

	m.nextID++
	product := &PendingProduct{
		ID:                 m.nextID,
		BrandID:            1, // Mock brand ID
		Category:           req.Category,
		Name:               req.Name,
		Slug:               "test-product-slug",
		Price:              req.Price,
		TransparencyScore:  req.TransparencyScore,
		ConfidenceLevel:    req.ConfidenceLevel,
		Status:             "pending",
		JobType:            req.JobType,
		SubmittedBy:        req.SubmittedBy,
		SubmittedAt:        time.Now(),
		Notes:              req.Notes,
		Brand: &Brand{
			ID:   1,
			Name: req.BrandName,
		},
	}

	m.pendingProducts = append(m.pendingProducts, *product)
	return product, nil
}

func (m *MockDatabaseClient) ReviewPendingProduct(req ProductApprovalRequest) (*PendingProduct, error) {
	// Validation
	if req.Status != "approved" && req.Status != "rejected" {
		return nil, assert.AnError
	}

	if req.Status == "rejected" && (req.RejectionReason == nil || *req.RejectionReason == "") {
		return nil, assert.AnError
	}

	// Find product
	for i, product := range m.pendingProducts {
		if product.ID == req.ID && product.Status == "pending" {
			m.pendingProducts[i].Status = req.Status
			m.pendingProducts[i].ReviewedBy = &req.ReviewedBy
			now := time.Now()
			m.pendingProducts[i].ReviewedAt = &now
			m.pendingProducts[i].RejectionReason = req.RejectionReason
			return &m.pendingProducts[i], nil
		}
	}

	return nil, assert.AnError
}

func (m *MockDatabaseClient) GetPendingProducts(status string, page, limit int) ([]PendingProduct, int, error) {
	var filtered []PendingProduct

	if status == "" {
		filtered = m.pendingProducts
	} else {
		for _, product := range m.pendingProducts {
			if product.Status == status {
				filtered = append(filtered, product)
			}
		}
	}

	start := (page - 1) * limit
	end := start + limit

	if start >= len(filtered) {
		return []PendingProduct{}, len(filtered), nil
	}

	if end > len(filtered) {
		end = len(filtered)
	}

	return filtered[start:end], len(filtered), nil
}

func (m *MockDatabaseClient) migrateApprovedProduct(productID int) (int, error) {
	for _, product := range m.pendingProducts {
		if product.ID == productID && product.Status == "approved" {
			// Mock migration - return new product ID
			return productID + 1000, nil
		}
	}
	return 0, assert.AnError
}

// Helper functions
func stringPtr(s string) *string {
	return &s
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
