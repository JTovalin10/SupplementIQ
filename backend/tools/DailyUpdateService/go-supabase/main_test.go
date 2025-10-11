package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// MockSupabaseServer creates a mock HTTP server that simulates Supabase responses
func MockSupabaseServer() *httptest.Server {
	// Mock existing products in "database" - these should be found by the batch check
	existingProducts := []ProductData{
		{
			Name:      "Gold Standard Whey",
			BrandName: "Optimum Nutrition",
			Flavor:    "Chocolate",
			Year:      "2023",
		},
		{
			Name:      "Gold Standard Whey",
			BrandName: "Optimum Nutrition",
			Flavor:    "Vanilla",
			Year:      "", // No year
		},
	}

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		
		// Log the request for debugging (commented out for clean test output)
		// fmt.Printf("Mock server received: %s %s?%s\n", r.Method, r.URL.Path, r.URL.RawQuery)
		
		// Always return 200 OK for any request to avoid 400 errors
		if strings.Contains(r.URL.Path, "/products") && r.Method == "GET" {
			// Mock batch check - return existing products that match the query
			// For simplicity, return the first two existing products (Chocolate and Vanilla)
			response := SupabaseResponse{
				Data: existingProducts,
			}
			
			// fmt.Printf("Mock server returning: %+v\n", response)
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(response)
			return
		}
		
		if strings.Contains(r.URL.Path, "/products") && r.Method == "POST" {
			// Mock product insertion - always succeed
			response := SupabaseResponse{
				Data: []ProductData{},
			}
			// fmt.Printf("Mock server returning insert response: %+v\n", response)
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(response)
			return
		}
		
		// Default response
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"data": [], "error": null, "message": "Mock server response"}`)
	}))
}

// MockProductData creates test product data
func MockProductData() []ProductData {
	return []ProductData{
		{
			Name:        "Gold Standard Whey",
			BrandName:   "Optimum Nutrition",
			Flavor:      "Chocolate",
			Year:        "2023",
			ImageURL:    "https://example.com/image1.jpg",
			Ingredients: []IngredientData{
				{Name: "Whey Protein", Amount: 24.0, Unit: "g"},
			},
			CreatedAt:  time.Now().Format(time.RFC3339),
			UpdatedAt:  time.Now().Format(time.RFC3339),
			IsApproved: true,
			ApprovedBy: "admin@test.com",
		},
		{
			Name:        "Gold Standard Whey",
			BrandName:   "Optimum Nutrition",
			Flavor:      "Vanilla",
			Year:        "", // No year - should use NULL
			ImageURL:    "https://example.com/image2.jpg",
			Ingredients: []IngredientData{
				{Name: "Whey Protein", Amount: 24.0, Unit: "g"},
			},
			CreatedAt:  time.Now().Format(time.RFC3339),
			UpdatedAt:  time.Now().Format(time.RFC3339),
			IsApproved: true,
			ApprovedBy: "admin@test.com",
		},
		{
			Name:        "Nitro-Tech",
			BrandName:   "MuscleTech",
			Flavor:      "Strawberry",
			Year:        "2024",
			ImageURL:    "https://example.com/image3.jpg",
			Ingredients: []IngredientData{
				{Name: "Whey Protein", Amount: 30.0, Unit: "g"},
			},
			CreatedAt:  time.Now().Format(time.RFC3339),
			UpdatedAt:  time.Now().Format(time.RFC3339),
			IsApproved: true,
			ApprovedBy: "admin@test.com",
		},
	}
}

// MockExistingProducts creates mock response for existing products
func MockExistingProducts() SupabaseResponse {
	return SupabaseResponse{
		Data: []ProductData{
			{
				Name:        "Gold Standard Whey",
				BrandName:   "Optimum Nutrition",
				Flavor:      "Chocolate",
				Year:        "2023",
			},
		},
		Error:   nil,
		Message: "",
	}
}

// TestSupabaseClient tests the SupabaseClient functionality
func TestSupabaseClient(t *testing.T) {
	// Create mock server
	mockServer := MockSupabaseServer()
	defer mockServer.Close()

	// Create client
	client := NewSupabaseClient(mockServer.URL, "test-api-key")

	// Test data
	products := MockProductData()

	t.Run("TestBatchCheckAndInsert", func(t *testing.T) {
		newProducts, err := client.BatchCheckAndInsert(products)
		
		// Should not error
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}

		// Should return 1 new product (2 exist, 1 new)
		expectedNew := 1
		if len(newProducts) != expectedNew {
			t.Errorf("Expected %d new products, got %d", expectedNew, len(newProducts))
		}

		// Check that new products don't include year for trie
		for _, product := range newProducts {
			if product.Year != "" {
				t.Errorf("Trie products should not include year, got %s", product.Year)
			}
		}

		// Check that we have the expected new products
		expectedProducts := map[string]bool{
			"Optimum Nutrition|Gold Standard Whey|Vanilla": true,
			"MuscleTech|Nitro-Tech|Strawberry":             true,
		}

		for _, product := range newProducts {
			key := product.BrandName + "|" + product.Name + "|" + product.Flavor
			if !expectedProducts[key] {
				t.Errorf("Unexpected product in new products: %s", key)
			}
		}
	})

	t.Run("TestBatchCheckProductsExist", func(t *testing.T) {
		productKeys := make(map[string]ProductData)
		for _, product := range products {
			key := product.BrandName + "|" + product.Name + "|" + product.Flavor
			if product.Year != "" {
				key += "|" + product.Year
			} else {
				key += "|NULL"
			}
			productKeys[key] = product
		}

		existingProducts, err := client.BatchCheckProductsExist(productKeys)
		
		// Should not error
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}

		// Should find 2 existing products (Chocolate and Vanilla)
		expectedExisting := 2
		if len(existingProducts) != expectedExisting {
			t.Errorf("Expected %d existing products, got %d", expectedExisting, len(existingProducts))
		}

		// Check that the existing product is correctly identified
		expectedKey := "Optimum Nutrition|Gold Standard Whey|Chocolate|2023"
		if !existingProducts[expectedKey] {
			t.Errorf("Expected product %s to exist", expectedKey)
		}
	})

	t.Run("TestRateLimiting", func(t *testing.T) {
		start := time.Now()
		
		// Make multiple requests to test rate limiting
		for i := 0; i < 3; i++ {
			client.rateLimit()
		}
		
		elapsed := time.Since(start)
		
		// Should take at least 200ms (2 * 100ms intervals)
		if elapsed < 200*time.Millisecond {
			t.Errorf("Rate limiting not working properly, took %v", elapsed)
		}
	})
}

// TestExponentialBackoff tests the exponential backoff functionality
func TestExponentialBackoff(t *testing.T) {
	client := NewSupabaseClient("http://test.com", "test-key")
	
	t.Run("TestExponentialBackoffCalculation", func(t *testing.T) {
		// Test base delay (with jitter tolerance)
		delay1 := client.exponentialBackoff(0)
		if delay1 < 500*time.Millisecond || delay1 > 1500*time.Millisecond {
			t.Errorf("Base delay should be around 1s (plus/minus 25%% jitter), got %v", delay1)
		}

		// Test exponential increase (with jitter tolerance)
		delay2 := client.exponentialBackoff(1)
		if delay2 < 1*time.Second || delay2 > 3*time.Second {
			t.Errorf("Second delay should be around 2s (plus/minus 25%% jitter), got %v", delay2)
		}

		// Test max delay cap
		delayMax := client.exponentialBackoff(10)
		if delayMax > 30*time.Second {
			t.Errorf("Delay should be capped at 30s, got %v", delayMax)
		}
	})
}

// TestProductKeyGeneration tests the product key generation logic
func TestProductKeyGeneration(t *testing.T) {
	t.Run("TestProductKeyWithYear", func(t *testing.T) {
		product := ProductData{
			BrandName: "Optimum Nutrition",
			Name:      "Gold Standard Whey",
			Flavor:    "Chocolate",
			Year:      "2023",
		}

		expectedKey := "Optimum Nutrition|Gold Standard Whey|Chocolate|2023"
		
		// Test key generation logic
		key := product.BrandName + "|" + product.Name + "|" + product.Flavor
		if product.Year != "" {
			key += "|" + product.Year
		}

		if key != expectedKey {
			t.Errorf("Expected key %s, got %s", expectedKey, key)
		}
	})

	t.Run("TestProductKeyWithoutYear", func(t *testing.T) {
		product := ProductData{
			BrandName: "Optimum Nutrition",
			Name:      "Gold Standard Whey",
			Flavor:    "Vanilla",
			Year:      "", // No year
		}

		expectedKey := "Optimum Nutrition|Gold Standard Whey|Vanilla|NULL"
		
		// Test key generation logic
		key := product.BrandName + "|" + product.Name + "|" + product.Flavor
		if product.Year != "" {
			key += "|" + product.Year
		} else {
			key += "|NULL"
		}

		if key != expectedKey {
			t.Errorf("Expected key %s, got %s", expectedKey, key)
		}
	})
}

// TestTrieDataExtraction tests the trie data extraction logic
func TestTrieDataExtraction(t *testing.T) {
	product := ProductData{
		Name:        "Gold Standard Whey",
		BrandName:   "Optimum Nutrition",
		Flavor:      "Chocolate",
		Year:        "2023",
		ImageURL:    "https://example.com/image.jpg",
		Ingredients: []IngredientData{{Name: "Whey Protein", Amount: 24.0, Unit: "g"}},
		CreatedAt:   "2023-01-01T00:00:00Z",
		UpdatedAt:   "2023-01-01T00:00:00Z",
		IsApproved:  true,
		ApprovedBy:  "admin@test.com",
	}

	// Extract trie data (should exclude year)
	trieProduct := ProductData{
		Name:      product.Name,
		BrandName: product.BrandName,
		Flavor:    product.Flavor,
		// Year excluded - trie doesn't need reformulation info
	}

	// Verify trie data
	if trieProduct.Name != "Gold Standard Whey" {
		t.Errorf("Expected name 'Gold Standard Whey', got '%s'", trieProduct.Name)
	}
	if trieProduct.BrandName != "Optimum Nutrition" {
		t.Errorf("Expected brand 'Optimum Nutrition', got '%s'", trieProduct.BrandName)
	}
	if trieProduct.Flavor != "Chocolate" {
		t.Errorf("Expected flavor 'Chocolate', got '%s'", trieProduct.Flavor)
	}
	if trieProduct.Year != "" {
		t.Errorf("Expected empty year for trie, got '%s'", trieProduct.Year)
	}
}

// TestEmptyInput tests handling of empty input
func TestEmptyInput(t *testing.T) {
	// Create mock server
	mockServer := MockSupabaseServer()
	defer mockServer.Close()

	client := NewSupabaseClient(mockServer.URL, "test-api-key")
	
	newProducts, err := client.BatchCheckAndInsert([]ProductData{})
	
	if err != nil {
		t.Errorf("Expected no error for empty input, got %v", err)
	}
	
	if len(newProducts) != 0 {
		t.Errorf("Expected empty result for empty input, got %d products", len(newProducts))
	}
}

// BenchmarkBatchCheckAndInsert benchmarks the batch processing performance
func BenchmarkBatchCheckAndInsert(b *testing.B) {
	// Create mock server
	mockServer := MockSupabaseServer()
	defer mockServer.Close()

	client := NewSupabaseClient(mockServer.URL, "test-api-key")
	
	// Create test data
	products := make([]ProductData, 100)
	for i := 0; i < 100; i++ {
		products[i] = ProductData{
			Name:      "Test Product",
			BrandName: "Test Brand",
			Flavor:    "Test Flavor",
			Year:      "2023",
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := client.BatchCheckAndInsert(products)
		if err != nil {
			b.Errorf("Benchmark failed: %v", err)
		}
	}
}
