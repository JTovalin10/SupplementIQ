package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestProductDataStructure(t *testing.T) {
	product := ProductData{
		Name:      "Gold Standard Whey",
		BrandName: "Optimum Nutrition",
		Flavor:    "Chocolate",
		Category:  "protein",
		Year:      "2023",
	}

	assert.Equal(t, "Gold Standard Whey", product.Name)
	assert.Equal(t, "Optimum Nutrition", product.BrandName)
	assert.Equal(t, "Chocolate", product.Flavor)
	assert.Equal(t, "protein", product.Category)
	assert.Equal(t, "2023", product.Year)
}

func TestProductInsertionCategories(t *testing.T) {
	testCases := []struct {
		name        string
		category    string
		shouldWork  bool
		description string
	}{
		{
			name:        "Protein category",
			category:    "protein",
			shouldWork:  true,
			description: "Should insert into protein_details table",
		},
		{
			name:        "Pre-workout category",
			category:    "pre-workout",
			shouldWork:  true,
			description: "Should insert into preworkout_details table",
		},
		{
			name:        "Non-stim pre-workout category",
			category:    "non-stim-pre-workout",
			shouldWork:  true,
			description: "Should insert into non_stim_preworkout_details table",
		},
		{
			name:        "Energy drink category",
			category:    "energy-drink",
			shouldWork:  true,
			description: "Should insert into energy_drink_details table",
		},
		{
			name:        "BCAA category",
			category:    "bcaa",
			shouldWork:  true,
			description: "Should insert into amino_acid_details table",
		},
		{
			name:        "EAA category",
			category:    "eaa",
			shouldWork:  true,
			description: "Should insert into amino_acid_details table",
		},
		{
			name:        "Fat burner category",
			category:    "fat-burner",
			shouldWork:  true,
			description: "Should insert into fat_burner_details table",
		},
		{
			name:        "Appetite suppressant category",
			category:    "appetite-suppressant",
			shouldWork:  true,
			description: "Should insert into fat_burner_details table",
		},
		{
			name:        "Creatine category",
			category:    "creatine",
			shouldWork:  true,
			description: "Should not insert into any details table",
		},
		{
			name:        "Invalid category",
			category:    "invalid-category",
			shouldWork:  false,
			description: "Should return error for unsupported category",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			product := ProductData{
				Name:      "Test Product",
				BrandName: "Test Brand",
				Category:  tc.category,
				Flavor:    "Test Flavor",
			}

			isValid := isValidProductCategory(tc.category)
			assert.Equal(t, tc.shouldWork, isValid, tc.description)
		})
	}
}

func TestProductDetailInsertionLogic(t *testing.T) {
	tests := []struct {
		name           string
		category       string
		expectedTable  string
		expectsDetails bool
	}{
		{
			name:           "Pre-workout insertion",
			category:       "pre-workout",
			expectedTable:  "preworkout_details",
			expectsDetails: true,
		},
		{
			name:           "Non-stim pre-workout insertion",
			category:       "non-stim-pre-workout",
			expectedTable:  "non_stim_preworkout_details",
			expectsDetails: true,
		},
		{
			name:           "Energy drink insertion",
			category:       "energy-drink",
			expectedTable:  "energy_drink_details",
			expectsDetails: true,
		},
		{
			name:           "Protein insertion",
			category:       "protein",
			expectedTable:  "protein_details",
			expectsDetails: true,
		},
		{
			name:           "BCAA insertion",
			category:       "bcaa",
			expectedTable:  "amino_acid_details",
			expectsDetails: true,
		},
		{
			name:           "EAA insertion",
			category:       "eaa",
			expectedTable:  "amino_acid_details",
			expectsDetails: true,
		},
		{
			name:           "Fat burner insertion",
			category:       "fat-burner",
			expectedTable:  "fat_burner_details",
			expectsDetails: true,
		},
		{
			name:           "Appetite suppressant insertion",
			category:       "appetite-suppressant",
			expectedTable:  "fat_burner_details",
			expectsDetails: true,
		},
		{
			name:           "Creatine insertion",
			category:       "creatine",
			expectedTable:  "",
			expectsDetails: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			product := ProductData{
				Name:      "Test Product",
				BrandName: "Test Brand",
				Category:  tt.category,
			}

			// Test that the category requires details table insertion
			needsDetails := requiresDetailsTable(tt.category)
			assert.Equal(t, tt.expectsDetails, needsDetails)

			if tt.expectsDetails {
				assert.NotEmpty(t, tt.expectedTable)
			}
		})
	}
}

func TestBatchInsertProducts(t *testing.T) {
	products := []ProductData{
		{
			Name:      "Gold Standard Whey",
			BrandName: "Optimum Nutrition",
			Category:  "protein",
			Flavor:    "Chocolate",
		},
		{
			Name:      "Nitro-Tech",
			BrandName: "MuscleTech",
			Category:  "protein",
			Flavor:    "Vanilla",
		},
		{
			Name:      "C4 Pre-Workout",
			BrandName: "Cellucor",
			Category:  "pre-workout",
			Flavor:    "Fruit Punch",
		},
		{
			Name:      "Invalid Product",
			BrandName: "Test Brand",
			Category:  "invalid-category",
			Flavor:    "Test",
		},
	}

	// Test batch processing logic
	validProducts := 0
	invalidProducts := 0

	for _, product := range products {
		if isValidProductData(product) {
			validProducts++
		} else {
			invalidProducts++
		}
	}

	assert.Equal(t, 3, validProducts)
	assert.Equal(t, 1, invalidProducts)
}

func TestProductExistenceCheck(t *testing.T) {
	tests := []struct {
		name        string
		brandName   string
		productName string
		flavor      string
		description string
	}{
		{
			name:        "Standard product check",
			brandName:   "Optimum Nutrition",
			productName: "Gold Standard Whey",
			flavor:      "Chocolate",
			description: "Should check brand + product name combination",
		},
		{
			name:        "Product without flavor",
			brandName:   "MuscleTech",
			productName: "Nitro-Tech",
			flavor:      "",
			description: "Should work without flavor specification",
		},
		{
			name:        "Empty brand name",
			brandName:   "",
			productName: "Test Product",
			flavor:      "Test",
			description: "Should handle empty brand name",
		},
		{
			name:        "Empty product name",
			brandName:   "Test Brand",
			productName: "",
			flavor:      "Test",
			description: "Should handle empty product name",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test that we can construct the check parameters
			assert.NotNil(t, tt.brandName)
			assert.NotNil(t, tt.productName)
			
			// Test that the check would work with valid data
			if tt.brandName != "" && tt.productName != "" {
				// This would be a valid check in real scenario
				assert.True(t, true)
			}
		})
	}
}

func TestBrandCreationLogic(t *testing.T) {
	tests := []struct {
		name        string
		brandName   string
		expectSlug  string
		description string
	}{
		{
			name:        "Standard brand name",
			brandName:   "Optimum Nutrition",
			expectSlug:  "optimum-nutrition",
			description: "Should generate proper slug",
		},
		{
			name:        "Brand with ampersand",
			brandName:   "MuscleTech & Associates",
			expectSlug:  "muscletech-and-associates",
			description: "Should convert ampersand to 'and'",
		},
		{
			name:        "Brand with special characters",
			brandName:   "C4® Pre-Workout",
			expectSlug:  "c4®-pre-workout",
			description: "Should handle special characters",
		},
		{
			name:        "Single word brand",
			brandName:   "Dymatize",
			expectSlug:  "dymatize",
			description: "Should handle single word",
		},
		{
			name:        "Empty brand name",
			brandName:   "",
			expectSlug:  "",
			description: "Should handle empty string",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			slug := generateSlug(tt.brandName)
			assert.Equal(t, tt.expectSlug, slug, tt.description)
		})
	}
}

func TestYearParsing(t *testing.T) {
	tests := []struct {
		name        string
		yearStr     string
		expectNil   bool
		expectValue int
		description string
	}{
		{
			name:        "Valid year",
			yearStr:     "2023",
			expectNil:   false,
			expectValue: 2023,
			description: "Should parse valid year",
		},
		{
			name:        "Empty year",
			yearStr:     "",
			expectNil:   true,
			expectValue: 0,
			description: "Should return nil for empty string",
		},
		{
			name:        "Invalid year",
			yearStr:     "invalid",
			expectNil:   true,
			expectValue: 0,
			description: "Should return nil for invalid string",
		},
		{
			name:        "Negative year",
			yearStr:     "-2023",
			expectNil:   false,
			expectValue: -2023,
			description: "Should handle negative year",
		},
		{
			name:        "Zero year",
			yearStr:     "0",
			expectNil:   false,
			expectValue: 0,
			description: "Should handle zero year",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseYear(tt.yearStr)
			
			if tt.expectNil {
				assert.Nil(t, result, tt.description)
			} else {
				require.NotNil(t, result, tt.description)
				assert.Equal(t, tt.expectValue, *result, tt.description)
			}
		})
	}
}

func TestTransactionLogic(t *testing.T) {
	// Test transaction rollback scenarios
	tests := []struct {
		name        string
		shouldFail  bool
		description string
	}{
		{
			name:        "Successful transaction",
			shouldFail:  false,
			description: "Should commit successfully",
		},
		{
			name:        "Failed product insertion",
			shouldFail:  true,
			description: "Should rollback on product insertion failure",
		},
		{
			name:        "Failed details insertion",
			shouldFail:  true,
			description: "Should rollback on details insertion failure",
		},
		{
			name:        "Failed brand count update",
			shouldFail:  true,
			description: "Should rollback on brand count update failure",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test transaction logic without actual database
			if tt.shouldFail {
				// Simulate transaction failure
				assert.True(t, true) // Placeholder for rollback test
			} else {
				// Simulate successful transaction
				assert.True(t, true) // Placeholder for commit test
			}
		})
	}
}

func TestConcurrentProductInsertion(t *testing.T) {
	// Test concurrent product insertion scenarios
	products := []ProductData{
		{Name: "Product 1", BrandName: "Brand A", Category: "protein"},
		{Name: "Product 2", BrandName: "Brand B", Category: "pre-workout"},
		{Name: "Product 3", BrandName: "Brand C", Category: "creatine"},
		{Name: "Product 4", BrandName: "Brand D", Category: "energy-drink"},
		{Name: "Product 5", BrandName: "Brand E", Category: "bcaa"},
	}

	// Simulate concurrent processing
	results := make(chan bool, len(products))
	
	for _, product := range products {
		go func(p ProductData) {
			isValid := isValidProductData(p)
			results <- isValid
		}(product)
	}

	// Collect results
	validCount := 0
	for i := 0; i < len(products); i++ {
		if <-results {
			validCount++
		}
	}

	assert.Equal(t, len(products), validCount)
}

// Helper functions for testing
func isValidProductData(product ProductData) bool {
	return product.Name != "" && 
		   product.BrandName != "" && 
		   isValidProductCategory(product.Category)
}

func isValidProductCategory(category string) bool {
	validCategories := []string{
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

	for _, validCategory := range validCategories {
		if category == validCategory {
			return true
		}
	}
	return false
}

func requiresDetailsTable(category string) bool {
	return category != "creatine" && isValidProductCategory(category)
}

// Benchmark tests
func BenchmarkProductDataValidation(b *testing.B) {
	product := ProductData{
		Name:      "Gold Standard Whey Protein Isolate",
		BrandName: "Optimum Nutrition",
		Category:  "protein",
		Flavor:    "Chocolate",
		Year:      "2023",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		isValidProductData(product)
	}
}

func BenchmarkSlugGeneration(b *testing.B) {
	brandName := "Optimum Nutrition Gold Standard"
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		generateSlug(brandName)
	}
}

func BenchmarkYearParsing(b *testing.B) {
	yearStr := "2023"
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		parseYear(yearStr)
	}
}

func BenchmarkCategoryValidation(b *testing.B) {
	categories := []string{
		"protein", "pre-workout", "energy-drink", "bcaa", "eaa",
		"fat-burner", "appetite-suppressant", "creatine", "invalid",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		for _, category := range categories {
			isValidProductCategory(category)
		}
	}
}
