package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test setup
func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	supabase := &SupabaseClient{}
	
	r := gin.New()
	
	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Next()
	})

	// API routes
	api := r.Group("/api/v1")
	{
		api.GET("/products", supabase.GetPaginatedProducts)
		api.GET("/search", supabase.SearchProducts)
		api.GET("/filter", supabase.FilterProducts)
		api.GET("/admin-cache", supabase.GetAdminCache)
		api.PUT("/products/:id", supabase.UpdateProduct)
		api.GET("/products/:id", supabase.GetProductWithDetails)
		api.GET("/brands", supabase.GetBrands)
		api.GET("/categories", supabase.GetCategories)
		api.GET("/stats", supabase.GetProductStats)
	}

	r.GET("/health", supabase.HealthCheck)
	return r
}

func TestHealthCheck(t *testing.T) {
	router := setupTestRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Equal(t, "healthy", response["status"])
	assert.Equal(t, "DataFetchingService", response["service"])
}

func TestGetPaginatedProducts(t *testing.T) {
	router := setupTestRouter()
	
	tests := []struct {
		name           string
		query          string
		expectedStatus int
	}{
		{
			name:           "Valid request with category",
			query:          "?category=protein&page=1&limit=10",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Valid request without category",
			query:          "?page=1&limit=5",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Default pagination",
			query:          "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid page number",
			query:          "?page=0&limit=10",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Large limit (should be capped)",
			query:          "?page=1&limit=1000",
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/v1/products"+tt.query, nil)
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.expectedStatus == http.StatusOK {
				var response PaginatedResponse
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				
				assert.GreaterOrEqual(t, response.Page, 1)
				assert.GreaterOrEqual(t, response.Limit, 1)
				assert.GreaterOrEqual(t, response.Total, 0)
				assert.GreaterOrEqual(t, response.TotalPages, 0)
			}
		})
	}
}

func TestSearchProducts(t *testing.T) {
	router := setupTestRouter()
	
	tests := []struct {
		name           string
		query          string
		expectedStatus int
	}{
		{
			name:           "Valid search query",
			query:          "?query=protein&limit=10",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Empty query (should fail)",
			query:          "?query=&limit=10",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Missing query parameter",
			query:          "?limit=10",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Search with offset",
			query:          "?query=whey&limit=5&offset=10",
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/v1/search"+tt.query, nil)
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.expectedStatus == http.StatusOK {
				var response SearchResponse
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				
				assert.GreaterOrEqual(t, response.Total, 0)
				assert.NotEmpty(t, response.Query)
			}
		})
	}
}

func TestFilterProducts(t *testing.T) {
	router := setupTestRouter()
	
	tests := []struct {
		name           string
		query          string
		expectedStatus int
	}{
		{
			name:           "Filter by brand",
			query:          "?brands=Optimum Nutrition&limit=10",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Filter by category",
			query:          "?categories=protein&limit=10",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Filter by price range",
			query:          "?price_min=10&price_max=50&limit=10",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Complex filter",
			query:          "?brands=MuscleTech&categories=pre-workout&price_min=20&price_max=60&sort_by=price&sort_order=asc&limit=5",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Default sorting",
			query:          "?limit=10",
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/v1/filter"+tt.query, nil)
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.expectedStatus == http.StatusOK {
				var response PaginatedResponse
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				
				assert.GreaterOrEqual(t, response.Total, 0)
			}
		})
	}
}

func TestGetAdminCache(t *testing.T) {
	router := setupTestRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/admin-cache", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response AdminCacheResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.GreaterOrEqual(t, response.Total, 0)
	assert.NotNil(t, response.Admins)
	assert.NotNil(t, response.Owners)
}

func TestUpdateProduct(t *testing.T) {
	router := setupTestRouter()
	
	tests := []struct {
		name           string
		productID      string
		requestBody    interface{}
		expectedStatus int
	}{
		{
			name:      "Valid update request",
			productID: "1",
			requestBody: map[string]interface{}{
				"name":              "Updated Product Name",
				"description":       "Updated description",
				"price":             29.99,
				"transparency_score": 85,
				"confidence_level":  "verified",
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid product ID",
			productID:      "invalid",
			requestBody:    map[string]interface{}{"name": "Test"},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Empty update request",
			productID:      "1",
			requestBody:    map[string]interface{}{},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jsonBody, _ := json.Marshal(tt.requestBody)
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/api/v1/products/"+tt.productID, bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

func TestGetProductWithDetails(t *testing.T) {
	router := setupTestRouter()
	
	tests := []struct {
		name           string
		productID      string
		expectedStatus int
	}{
		{
			name:           "Valid product ID",
			productID:      "1",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid product ID",
			productID:      "invalid",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Non-existent product ID",
			productID:      "99999",
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/v1/products/"+tt.productID, nil)
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

func TestGetBrands(t *testing.T) {
	router := setupTestRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/brands", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Contains(t, response, "brands")
	assert.Contains(t, response, "total")
	assert.GreaterOrEqual(t, response["total"], float64(0))
}

func TestGetCategories(t *testing.T) {
	router := setupTestRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/categories", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Contains(t, response, "categories")
	assert.Contains(t, response, "total")
	
	categories, ok := response["categories"].([]interface{})
	require.True(t, ok)
	assert.Greater(t, len(categories), 0)
}

func TestGetProductStats(t *testing.T) {
	router := setupTestRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/stats", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Contains(t, response, "statistics")
	assert.Contains(t, response, "timestamp")
	
	stats, ok := response["statistics"].(map[string]interface{})
	require.True(t, ok)
	assert.Contains(t, stats, "total_products")
	assert.Contains(t, stats, "total_brands")
	assert.Contains(t, stats, "average_price")
}

func TestCORSHeaders(t *testing.T) {
	router := setupTestRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
}

func TestInvalidRoutes(t *testing.T) {
	router := setupTestRouter()
	
	tests := []struct {
		name           string
		method         string
		path           string
		expectedStatus int
	}{
		{
			name:           "Non-existent route",
			method:         "GET",
			path:           "/api/v1/nonexistent",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "Wrong method",
			method:         "POST",
			path:           "/api/v1/products",
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest(tt.method, tt.path, nil)
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

// Benchmark tests
func BenchmarkGetPaginatedProducts(b *testing.B) {
	router := setupTestRouter()
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/products?page=1&limit=20", nil)
		router.ServeHTTP(w, req)
	}
}

func BenchmarkSearchProducts(b *testing.B) {
	router := setupTestRouter()
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/search?query=protein&limit=10", nil)
		router.ServeHTTP(w, req)
	}
}

func BenchmarkFilterProducts(b *testing.B) {
	router := setupTestRouter()
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/filter?categories=protein&price_min=10&price_max=50", nil)
		router.ServeHTTP(w, req)
	}
}

// Test main function (this will fail in test environment, but we can test the setup)
func TestMainFunction(t *testing.T) {
	// This test verifies that the main function can be called without panicking
	// In a real test environment, we'd mock the database connection
	defer func() {
		if r := recover(); r != nil {
			// Expected to panic due to missing environment variables
			assert.Contains(t, fmt.Sprintf("%v", r), "Missing required Supabase configuration")
		}
	}()

	// This should panic due to missing environment variables
	// In a real scenario, we'd set up test environment variables
	supabase := NewSupabaseClient()
	assert.NotNil(t, supabase)
}

// Integration test helpers
func TestEnvironmentSetup(t *testing.T) {
	// Test that we can detect missing environment variables
	originalEnv := os.Getenv("SUPABASE_PROJECT_ID")
	defer os.Setenv("SUPABASE_PROJECT_ID", originalEnv)
	
	os.Unsetenv("SUPABASE_PROJECT_ID")
	
	// This should fail gracefully
	defer func() {
		if r := recover(); r != nil {
			assert.Contains(t, fmt.Sprintf("%v", r), "Missing required Supabase configuration")
		}
	}()
	
	NewSupabaseClient()
}
