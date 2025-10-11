package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

// ProductData represents the product structure for Supabase operations
type ProductData struct {
	Name        string                 `json:"name"`
	BrandName   string                 `json:"brand_name"`
	Flavor      string                 `json:"flavor"`
	Year        string                 `json:"year"`
	ImageURL    string                 `json:"image_url"`
	Ingredients []IngredientData       `json:"ingredients"`
	CreatedAt   string                 `json:"created_at"`
	UpdatedAt   string                 `json:"updated_at"`
	IsApproved  bool                   `json:"is_approved"`
	ApprovedBy  string                 `json:"approved_by"`
}

// IngredientData represents ingredient information
type IngredientData struct {
	Name   string  `json:"name"`
	Amount float64 `json:"amount"`
	Unit   string  `json:"unit"`
}

// SupabaseResponse represents the response from Supabase
type 	SupabaseResponse struct {
	Data    []ProductData `json:"data"`
	Error   interface{}   `json:"error"`
	Message string        `json:"message"`
}

// loadEnvFile loads environment variables from .env.local file
func loadEnvFile(filename string) error {
	file, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			// Remove quotes if present
			if len(value) >= 2 && ((value[0] == '"' && value[len(value)-1] == '"') || 
				(value[0] == '\'' && value[len(value)-1] == '\'')) {
				value = value[1 : len(value)-1]
			}
			os.Setenv(key, value)
		}
	}
	
	return scanner.Err()
}

// SupabaseClient handles all database operations with rate limiting and exponential backoff
type SupabaseClient struct {
	URL    string
	APIKey string
	Client *http.Client
	// Rate limiting to prevent overwhelming Supabase
	lastRequestTime time.Time
	minInterval     time.Duration
	// Exponential backoff configuration
	maxRetries      int
	baseDelay       time.Duration
	maxDelay        time.Duration
}

// NewSupabaseClient creates a new Supabase client with connection pooling and rate limiting
func NewSupabaseClient(url, apiKey string) *SupabaseClient {
	return &SupabaseClient{
		URL:    url,
		APIKey: apiKey,
		Client: &http.Client{
			Timeout: 30 * time.Second,
			// Limited connection pool to prevent rate limiting
			Transport: &http.Transport{
				MaxIdleConns:        5,  // Limited idle connections
				MaxIdleConnsPerHost: 2,  // Max 2 connections per host
				MaxConnsPerHost:     10, // Max 10 concurrent connections
				IdleConnTimeout:     30 * time.Second,
			},
		},
		// Rate limiting: minimum 100ms between requests
		minInterval: 100 * time.Millisecond,
		// Exponential backoff configuration
		maxRetries: 3,
		baseDelay:  1 * time.Second,
		maxDelay:   30 * time.Second,
	}
}

// rateLimit ensures minimum interval between requests to prevent rate limiting
func (s *SupabaseClient) rateLimit() {
	elapsed := time.Since(s.lastRequestTime)
	if elapsed < s.minInterval {
		sleepTime := s.minInterval - elapsed
		log.Printf("🕐 Rate limiting: sleeping for %v", sleepTime)
		time.Sleep(sleepTime)
	}
	s.lastRequestTime = time.Now()
}

// exponentialBackoff implements exponential backoff with jitter for retries
func (s *SupabaseClient) exponentialBackoff(attempt int) time.Duration {
	if attempt >= s.maxRetries {
		return s.maxDelay
	}
	
	// Calculate exponential delay: baseDelay * 2^attempt
	delay := s.baseDelay * time.Duration(1<<uint(attempt))
	
	// Cap at maxDelay
	if delay > s.maxDelay {
		delay = s.maxDelay
	}
	
	// Add jitter (±25% randomness to prevent thundering herd)
	jitter := time.Duration(float64(delay) * 0.25 * float64(time.Now().UnixNano()%2 - 1))
	delay += jitter
	
	if delay < 0 {
		delay = s.baseDelay
	}
	
	return delay
}

// makeRequestWithRetry makes an HTTP request with exponential backoff retry logic
func (s *SupabaseClient) makeRequestWithRetry(req *http.Request) (*http.Response, error) {
	var lastErr error
	
	for attempt := 0; attempt <= s.maxRetries; attempt++ {
		if attempt > 0 {
			delay := s.exponentialBackoff(attempt - 1)
			log.Printf("🔄 Retry attempt %d/%d after %v delay", attempt, s.maxRetries, delay)
			time.Sleep(delay)
		}
		
		resp, err := s.Client.Do(req)
		if err != nil {
			lastErr = err
			log.Printf("❌ Request failed (attempt %d/%d): %v", attempt+1, s.maxRetries+1, err)
			continue
		}
		
		// Check for rate limiting (HTTP 429) or server errors (5xx)
		if resp.StatusCode == 429 || resp.StatusCode >= 500 {
			resp.Body.Close()
			lastErr = fmt.Errorf("server returned status %d", resp.StatusCode)
			log.Printf("⚠️ Server error (attempt %d/%d): status %d", attempt+1, s.maxRetries+1, resp.StatusCode)
			continue
		}
		
		// Success or client error (4xx, not 429)
		return resp, nil
	}
	
	return nil, fmt.Errorf("request failed after %d attempts: %v", s.maxRetries+1, lastErr)
}

// InsertProduct inserts a product into the Supabase database
func (s *SupabaseClient) InsertProduct(product ProductData) error {
	// Apply rate limiting to prevent overwhelming Supabase
	s.rateLimit()
	
	// Prepare JSON payload
	jsonData, err := json.Marshal(product)
	if err != nil {
		return fmt.Errorf("failed to marshal product data: %v", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", s.URL+"/products", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=minimal")

	// Make request with exponential backoff retry logic
	resp, err := s.makeRequestWithRetry(req)
	if err != nil {
		return fmt.Errorf("failed to make request after retries: %v", err)
	}
	defer resp.Body.Close()

	// Check response status (should be 200-299 after retries)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase request failed with status %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("✅ Successfully inserted product: %s (%s)", product.Name, product.BrandName)
	return nil
}

// InsertProductsBatch inserts multiple products in a batch
func (s *SupabaseClient) InsertProductsBatch(products []ProductData) error {
	if len(products) == 0 {
		return nil
	}

	// Prepare JSON payload for batch insert
	jsonData, err := json.Marshal(products)
	if err != nil {
		return fmt.Errorf("failed to marshal products data: %v", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", s.URL+"/products", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=minimal")

	// Make request
	resp, err := s.Client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase batch insert failed with status %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("✅ Successfully inserted %d products in batch", len(products))
	return nil
}

// VerifyProductExists checks if a product already exists in the database
// year is optional - if provided, checks for exact match including year (for reformulations)
func (s *SupabaseClient) VerifyProductExists(name, brand, flavor, year string) (bool, error) {
	// Build query parameters
	query := fmt.Sprintf("name=eq.%s&brand_name=eq.%s&flavor=eq.%s", name, brand, flavor)
	
	// Add year to query if provided (for reformulation detection)
	if year != "" {
		query += fmt.Sprintf("&year=eq.%s", year)
	}
	
	// Create HTTP request
	req, err := http.NewRequest("GET", s.URL+"/products?"+query, nil)
	if err != nil {
		return false, fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.APIKey)
	req.Header.Set("Accept", "application/json")

	// Make request with exponential backoff retry logic
	resp, err := s.makeRequestWithRetry(req)
	if err != nil {
		return false, fmt.Errorf("failed to make request after retries: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, fmt.Errorf("failed to read response: %v", err)
	}

	// Parse response
	var response SupabaseResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return false, fmt.Errorf("failed to parse response: %v", err)
	}

	// Check if product exists
	exists := len(response.Data) > 0
	if year != "" {
		log.Printf("🔍 Product verification (with year): %s (%s) - %s - exists: %t", name, brand, year, exists)
	} else {
		log.Printf("🔍 Product verification: %s (%s) - exists: %t", name, brand, exists)
	}
	
	return exists, nil
}

// CheckAndInsertProduct checks if product exists and inserts if it doesn't
// This is the main function for the daily update service - only adds new products
func (s *SupabaseClient) CheckAndInsertProduct(product ProductData) error {
	// Step 1: Check if product exists (brand + name + flavor)
	exists, err := s.VerifyProductExists(product.Name, product.BrandName, product.Flavor, "")
	if err != nil {
		return fmt.Errorf("failed to check if product exists: %v", err)
	}

	// Step 2: If product doesn't exist, insert it
	if !exists {
		log.Printf("🆕 Product doesn't exist - inserting new product: %s (%s)", product.Name, product.BrandName)
		return s.InsertProduct(product)
	}

	// Step 3: Product already exists - skip insertion
	log.Printf("⏭️ Product already exists - skipping: %s (%s)", product.Name, product.BrandName)
	return nil
}

// BatchCheckAndInsert processes multiple products with efficient single-check approach
// This is the main function for the daily update service at 12 AM PST
// Checks if products exist, then inserts new products (brands are created automatically if they don't exist)
// Returns the set of new products that were inserted (for trie updates)
func (s *SupabaseClient) BatchCheckAndInsert(products []ProductData) ([]ProductData, error) {
	log.Printf("🚀 Starting efficient batch processing for %d products", len(products))
	
	if len(products) == 0 {
		log.Printf("📭 No products to process")
		return []ProductData{}, nil
	}

	// Step 1: Collect unique products for batch checking
	log.Printf("📊 Collecting unique products for batch checking...")
	
	productKeys := make(map[string]ProductData) // key: "brand|name|flavor" or "brand|name|flavor|year"
	
	for _, product := range products {
		// Collect unique product keys (include year if provided, otherwise NULL)
		key := fmt.Sprintf("%s|%s|%s", product.BrandName, product.Name, product.Flavor)
		if product.Year != "" {
			key += "|" + product.Year
		} else {
			key += "|NULL"  // Use NULL for products without year
		}
		productKeys[key] = product
	}

	// Step 2: Single batch check for all products
	log.Printf("🔍 Batch checking %d unique products...", len(productKeys))
	existingProducts, err := s.BatchCheckProductsExist(productKeys)
	if err != nil {
		log.Printf("❌ Error checking products: %v", err)
		return []ProductData{}, err
	}

	// Step 3: Insert only new products and collect them for trie updates
	log.Printf("📦 Processing products - inserting new products...")
	inserted := 0
	skipped := 0
	errors := 0
	newProducts := []ProductData{} // Collect new products for trie updates

	for key, product := range productKeys {
		// Check if product already exists
		if existingProducts[key] {
			log.Printf("⏭️ Product already exists: %s (%s)", product.Name, product.BrandName)
			skipped++
			continue
		}

		// Insert new product (brand will be created automatically if it doesn't exist)
		log.Printf("🆕 Inserting new product: %s (%s)", product.Name, product.BrandName)
		err := s.InsertProduct(product)
		if err != nil {
			log.Printf("❌ Error inserting product %s: %v", product.Name, err)
			errors++
			continue
		}
		
		inserted++
		
		// Add to trie update set (trie only needs brand, name, flavor - no year)
		// Users search for "Gorilla Mode" not "Gorilla Mode 2023" - year is internal DB info
		trieProduct := ProductData{
			Name:      product.Name,
			BrandName: product.BrandName,
			Flavor:    product.Flavor,
			// Year excluded - users don't search by reformulation year
		}
		newProducts = append(newProducts, trieProduct)
		
		// Apply rate limiting between inserts
		s.rateLimit()
	}

	log.Printf("✅ Efficient batch processing completed:")
	log.Printf("   📊 New products inserted: %d", inserted)
	log.Printf("   ⏭️ Existing products skipped: %d", skipped)
	log.Printf("   ❌ Errors: %d", errors)
	log.Printf("   📈 Total processed: %d", len(products))
	log.Printf("   🔍 Unique products checked: %d", len(productKeys))
	log.Printf("   🌳 New products for trie update: %d", len(newProducts))

	return newProducts, nil
}


// BatchCheckProductsExist checks multiple products in a single database query
func (s *SupabaseClient) BatchCheckProductsExist(productKeys map[string]ProductData) (map[string]bool, error) {
	if len(productKeys) == 0 {
		return make(map[string]bool), nil
	}

	// Apply rate limiting
	s.rateLimit()

	// Build single query to check all products at once
	// Format: SELECT brand_name, name, year FROM products WHERE (brand_name=brand1 AND name=prod1 AND year=year1) OR (brand_name=brand2 AND name=prod2 AND year=year2) OR ...
	var conditions []string
	for _, product := range productKeys {
		// Build condition: brand_name=brand AND name=product AND flavor=flavor AND year=year
		condition := fmt.Sprintf("and(brand_name.eq.%s,name.eq.%s,flavor.eq.%s", 
			product.BrandName, product.Name, product.Flavor)
		
		// Add year to condition - use NULL check if year is empty
		if product.Year != "" {
			condition += fmt.Sprintf(",year.eq.%s", product.Year)
		} else {
			condition += ",year.is.null"  // Check for NULL year
		}
		condition += ")"
		
		conditions = append(conditions, condition)
	}

	// Join with 'or' operator to check all products in one query
	query := "or=" + strings.Join(conditions, ",")
	
	// URL encode the query to handle spaces and special characters
	encodedQuery := url.QueryEscape(query)
	
	// Create HTTP request
	requestURL := s.URL + "/products?" + encodedQuery
	// log.Printf("🔗 Making request to: %s", requestURL)
	
	req, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.APIKey)
	req.Header.Set("Accept", "application/json")

	// Make request with exponential backoff retry logic
	resp, err := s.makeRequestWithRetry(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request after retries: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}
	
	// log.Printf("📥 Response status: %d", resp.StatusCode)
	// log.Printf("📥 Response body: %s", string(body))

	// Parse response
	var response SupabaseResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	// Build map of existing products using the same key format
	existingProducts := make(map[string]bool)
	for _, product := range response.Data {
		// Create key with same format as in BatchCheckAndInsert
		key := fmt.Sprintf("%s|%s|%s", product.BrandName, product.Name, product.Flavor)
		if product.Year != "" {
			key += "|" + product.Year
		} else {
			key += "|NULL"  // Use NULL for products without year
		}
		existingProducts[key] = true
	}

	log.Printf("✅ Batch product check completed: %d/%d products exist", len(existingProducts), len(productKeys))
	return existingProducts, nil
}

// VerifyBrandExists checks if a brand already exists in the database
func (s *SupabaseClient) VerifyBrandExists(brand string) (bool, error) {
	// Build query parameters
	query := fmt.Sprintf("brand_name=eq.%s", brand)
	
	// Create HTTP request
	req, err := http.NewRequest("GET", s.URL+"/products?"+query, nil)
	if err != nil {
		return false, fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.APIKey)
	req.Header.Set("Accept", "application/json")

	// Make request with exponential backoff retry logic
	resp, err := s.makeRequestWithRetry(req)
	if err != nil {
		return false, fmt.Errorf("failed to make request after retries: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, fmt.Errorf("failed to read response: %v", err)
	}

	// Parse response
	var response SupabaseResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return false, fmt.Errorf("failed to parse response: %v", err)
	}

	// Check if brand exists
	exists := len(response.Data) > 0
	log.Printf("🔍 Brand verification: %s - exists: %t (%d products)", brand, exists, len(response.Data))
	
	return exists, nil
}

// GetProductsByBrand retrieves all products for a specific brand
func (s *SupabaseClient) GetProductsByBrand(brand string) ([]ProductData, error) {
	// Build query parameters
	query := fmt.Sprintf("brand_name=eq.%s", brand)
	
	// Create HTTP request
	req, err := http.NewRequest("GET", s.URL+"/products?"+query, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.APIKey)
	req.Header.Set("Accept", "application/json")

	// Make request
	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	// Parse response
	var response SupabaseResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	log.Printf("📦 Retrieved %d products for brand: %s", len(response.Data), brand)
	return response.Data, nil
}

// UpdateProduct updates an existing product in the database
func (s *SupabaseClient) UpdateProduct(name, brand, flavor string, updates ProductData) error {
	// Build query parameters for the product to update
	query := fmt.Sprintf("name=eq.%s&brand_name=eq.%s&flavor=eq.%s", name, brand, flavor)
	
	// Prepare JSON payload
	jsonData, err := json.Marshal(updates)
	if err != nil {
		return fmt.Errorf("failed to marshal update data: %v", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("PATCH", s.URL+"/products?"+query, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=minimal")

	// Make request
	resp, err := s.Client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase update failed with status %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("✅ Successfully updated product: %s (%s)", name, brand)
	return nil
}

// DeleteProduct removes a product from the database
func (s *SupabaseClient) DeleteProduct(name, brand, flavor string) error {
	// Build query parameters
	query := fmt.Sprintf("name=eq.%s&brand_name=eq.%s&flavor=eq.%s", name, brand, flavor)
	
	// Create HTTP request
	req, err := http.NewRequest("DELETE", s.URL+"/products?"+query, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.APIKey)
	req.Header.Set("Prefer", "return=minimal")

	// Make request
	resp, err := s.Client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase delete failed with status %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("✅ Successfully deleted product: %s (%s)", name, brand)
	return nil
}

// InitializeFromEnv loads configuration from environment variables
func InitializeFromEnv() (*SupabaseClient, error) {
	url := os.Getenv("NEXT_PUBLIC_SUPABASE_URL")
	apiKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if url == "" || apiKey == "" {
		return nil, fmt.Errorf("missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
	}

	log.Printf("✅ Supabase client initialized from environment variables")
	log.Printf("📊 Database URL: %s", url)
	log.Printf("🔑 API Key: %s", maskAPIKey(apiKey))

	return NewSupabaseClient(url, apiKey), nil
}

// maskAPIKey masks the API key for logging
func maskAPIKey(apiKey string) string {
	if len(apiKey) <= 8 {
		return "***"
	}
	return apiKey[:4] + "..." + apiKey[len(apiKey)-4:]
}

func main() {
	// Load environment variables from .env file in project root
	// Try multiple possible locations
	envPaths := []string{
		".env",
		"../../../.env", 
		"../../../../.env",
		"/media/justin/5097c696-f857-40b2-9846-2fbd234bc6e7/Code/SupplementIQ-1/.env",
	}
	
	envLoaded := false
	for _, path := range envPaths {
		if err := loadEnvFile(path); err == nil {
			log.Printf("✅ Loaded environment variables from %s", path)
			envLoaded = true
			break
		}
	}
	
	if !envLoaded {
		log.Printf("⚠️ Warning: Could not load .env file from any location. Using system environment variables.")
	}
	
	// Example usage
	client, err := InitializeFromEnv()
	if err != nil {
		log.Fatalf("Failed to initialize Supabase client: %v", err)
	}

	// Example: Check and insert a test product (only if it doesn't exist)
	testProduct := ProductData{
		Name:       "Test Whey Protein",
		BrandName:  "Test Brand",
		Flavor:     "Vanilla",
		Year:       "2024",
		ImageURL:   "https://example.com/image.jpg",
		Ingredients: []IngredientData{
			{Name: "Whey Protein", Amount: 25.0, Unit: "g"},
			{Name: "Creatine", Amount: 5.0, Unit: "g"},
		},
		CreatedAt:  time.Now().UTC().Format(time.RFC3339),
		UpdatedAt:  time.Now().UTC().Format(time.RFC3339),
		IsApproved: true,
		ApprovedBy: "system",
	}

	// Check if product exists and insert if it doesn't
	if err := client.CheckAndInsertProduct(testProduct); err != nil {
		log.Printf("Failed to check and insert product: %v", err)
	} else {
		log.Println("Product processed successfully!")
	}

	// Example: Batch processing for daily update service
	testProducts := []ProductData{
		testProduct,
		{
			Name:       "New Product",
			BrandName:  "New Brand",
			Flavor:     "Chocolate",
			Year:       "2024",
			ImageURL:   "https://example.com/chocolate.jpg",
			Ingredients: []IngredientData{
				{Name: "Casein Protein", Amount: 20.0, Unit: "g"},
			},
			CreatedAt:  time.Now().UTC().Format(time.RFC3339),
			UpdatedAt:  time.Now().UTC().Format(time.RFC3339),
			IsApproved: true,
			ApprovedBy: "system",
		},
		{
			Name:       "Another Product",
			BrandName:  "Another Brand",
			Flavor:     "Strawberry",
			Year:       "2024",
			ImageURL:   "https://example.com/strawberry.jpg",
			Ingredients: []IngredientData{
				{Name: "Whey Protein Isolate", Amount: 30.0, Unit: "g"},
				{Name: "BCAA", Amount: 8.0, Unit: "g"},
			},
			CreatedAt:  time.Now().UTC().Format(time.RFC3339),
			UpdatedAt:  time.Now().UTC().Format(time.RFC3339),
			IsApproved: true,
			ApprovedBy: "system",
		},
	}

	// Batch process products for daily update (12 AM PST)
	newProducts, err := client.BatchCheckAndInsert(testProducts)
	if err != nil {
		log.Printf("Failed to batch process products: %v", err)
	} else {
		log.Printf("Daily update batch processing completed successfully! %d new products added.", len(newProducts))
		// Pass newProducts to trie for autocomplete updates
		if len(newProducts) > 0 {
			log.Printf("New products for trie update: %+v", newProducts)
		}
	}
}
