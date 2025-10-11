# Go Supabase Component

This Go component handles all Supabase database operations for the DailyUpdateService. It's designed to be fast, efficient, and focused solely on database interactions.

## Features

- **Duplicate Prevention**: Checks if product exists before inserting
- **New Product Addition**: Only adds new products to ensure database accuracy
- **Batch Operations**: Efficient batch processing for daily updates at 12 AM PST
- **Optimized Database Calls**: Single batch operation to check all products at once
- **Performance Optimized**: Fastest possible database operations for daily updates
- **Rate Limiting**: Built-in rate limiting to prevent overwhelming Supabase
- **Exponential Backoff**: Automatic retry with exponential backoff for resilience
- **Connection Pooling**: Limited connection pool to prevent rate limiting
- **Error Handling**: Comprehensive error handling with detailed logging
- **Environment Configuration**: Automatic configuration from environment variables

## Processing Logic

The component implements optimized batch processing to minimize database operations:

### Efficient Single-Check Batch Processing
1. **Collect Unique Products**: Gather all unique products from the queue (with optional year for reformulation detection)
2. **Single Batch Check**: One query to check all unique products at once
3. **Insert New Products**: Insert products that don't exist (brands are created automatically if they don't exist)
4. **Return Clean Set**: Return the set of newly inserted products for trie updates

### Year Parameter Support
- **Optional Year Field**: Products can include a year parameter for reformulation detection
- **NULL Handling**: Products without year use `NULL` in database (standard practice)
- **Key Generation**: Keys include year when provided: `"brand|name|flavor|year"` or `"brand|name|flavor|NULL"`
- **Query Logic**: Uses `year.eq.value` for specific years, `year.is.null` for products without year
- **Reformulation Detection**: Different years of the same product are treated as separate products

### Database Call Optimization
- **Before**: N individual database calls (one per product)
- **After**: 1 single query to check all products + individual inserts for new products
- **Efficiency**: Single query checks brand + product + year combination for all products at once
- **Logic**: One query returns all existing products, then insert only the ones that don't exist

### Step-by-Step Process
```
Input: 1000 products
├── Collect unique products (1000)
├── Single query: Check which products exist (brand + product + year combinations)
└── Insert new products (brands auto-created if they don't exist)
Total DB calls: 1 check + N inserts for new products only

Example Query:
SELECT brand_name, name, year FROM products 
WHERE (brand_name='Brand1' AND name='Product1' AND year='2023') 
   OR (brand_name='Brand2' AND name='Product2' AND year='2023')
   OR (brand_name='Brand3' AND name='Product3' AND year IS NULL)
```

### Purpose
- **Daily Update Service**: Only adds new products at 12 AM PST
- **Data Accuracy**: Ensures most accurate data is displayed on website
- **Edit Process**: Data edits go through normal approval workflow
- **Performance**: Minimizes database operations for large batches
- **Trie Integration**: Returns clean set of new products for autocomplete updates

## Trie Integration

### Clean Set for Autocomplete Updates
- **Duplicate Removal**: Set automatically removes products that already exist in database
- **User-Focused Data**: Only brand, product name, and flavor (year excluded - users don't search by reformulation)
- **Unique Data**: Only truly new products are returned for trie updates
- **JSON Backup**: Trie saves new products to JSON before updating (system outage protection)
- **Efficient Updates**: Trie only processes new, unique data without reformulation info

### Workflow
```
1. Collect unique products from queue (with year for database operations)
2. Check database for existing products (single query with year)
3. Remove duplicates from set
4. Insert new products to database (with year)
5. Extract trie data (brand + name + flavor only, year excluded for user search)
6. Return clean set for trie updates
7. Trie saves to JSON (backup)
8. Trie updates with new unique autocomplete data
```

## Rate Limiting & Resilience

### Rate Limiting
- **Minimum Interval**: 100ms between requests to prevent overwhelming Supabase
- **Connection Pooling**: Limited to 10 concurrent connections maximum
- **Idle Connections**: Maximum 5 idle connections to conserve resources

### Exponential Backoff
- **Automatic Retries**: Up to 3 retry attempts for failed requests
- **Base Delay**: 1 second initial delay between retries
- **Maximum Delay**: 30 seconds maximum delay cap
- **Jitter**: ±25% randomness to prevent thundering herd effect
- **Retry Triggers**: HTTP 429 (Rate Limited) and 5xx server errors

### Connection Management
```go
Transport: &http.Transport{
    MaxIdleConns:        5,  // Limited idle connections
    MaxIdleConnsPerHost: 2,  // Max 2 connections per host
    MaxConnsPerHost:     10, // Max 10 concurrent connections
    IdleConnTimeout:     30 * time.Second,
}
```

## Batch Functions

### BatchCheckProductsExist
Checks multiple products in a single database query using Supabase's `or` operator. Supports optional year parameter for reformulation detection:
```go
productKeys := map[string]ProductData{
    "Optimum Nutrition|Gold Standard Whey|Chocolate": {...},
    "Optimum Nutrition|Gold Standard Whey|Chocolate|2023": {...}, // With year
    "MuscleTech|Nitro-Tech|Vanilla": {...},
}
existingProducts, err := client.BatchCheckProductsExist(productKeys)
// Returns: map[string]bool{"Optimum Nutrition|Gold Standard Whey|Chocolate": true, ...}
```

## Use Cases

### Daily Update Service (12 AM PST)
```go
// Process all pending products - only add new ones
products := loadProductsFromQueue()
newProducts, err := client.BatchCheckAndInsert(products)
if err != nil {
    log.Printf("Error processing products: %v", err)
    return
}

// Pass new products to trie for autocomplete updates
if len(newProducts) > 0 {
    updateTrieWithNewProducts(newProducts)
}
```

### Single Product Processing
```go
// Check and insert individual product (only if new)
err := client.CheckAndInsertProduct(product)
```

### Data Editing Workflow
- **New Products**: Added via daily update service
- **Data Edits**: Go through approval process to ensure accuracy
- **Website Display**: Always shows most accurate data

## Usage

### Environment Variables

Set these environment variables:

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Daily Update Processing

```go
package main

import (
    "log"
    "daily-update-supabase"
)

func main() {
    // Initialize client from environment
    client, err := daily-update-supabase.InitializeFromEnv()
    if err != nil {
        log.Fatal(err)
    }

    // Check and insert product (only if it doesn't exist)
    product := ProductData{
        Name:       "Whey Protein",
        BrandName:  "Optimum Nutrition",
        Flavor:     "Vanilla",
        Year:       "2024",
        ImageURL:   "https://example.com/image.jpg",
        Ingredients: []IngredientData{
            {Name: "Whey Protein", Amount: 25.0, Unit: "g"},
            {Name: "Creatine", Amount: 5.0, Unit: "g"},
        },
        IsApproved: true,
    }
    
    // This will insert new product or skip if it already exists
    if err := client.CheckAndInsertProduct(product); err != nil {
        log.Printf("Failed to process product: %v", err)
    }
}
```

### Batch Operations

```go
// Process multiple products for daily update (12 AM PST)
products := []ProductData{
    {Name: "Product 1", BrandName: "Brand A", Flavor: "Vanilla"},
    {Name: "Product 2", BrandName: "Brand B", Flavor: "Chocolate"},
}

// Check each product and insert only if it doesn't exist
if err := client.BatchCheckAndInsert(products); err != nil {
    log.Printf("Batch processing failed: %v", err)
}
```

### Verification

```go
// Check if product exists (any year)
exists, err := client.VerifyProductExists("Whey Protein", "Optimum Nutrition", "Vanilla", "")
if err != nil {
    log.Printf("Verification failed: %v", err)
} else {
    log.Printf("Product exists (any year): %t", exists)
}

// Check if product exists (specific year for reformulation detection)
existsWithYear, err := client.VerifyProductExists("Whey Protein", "Optimum Nutrition", "Vanilla", "2024")
if err != nil {
    log.Printf("Verification failed: %v", err)
} else {
    log.Printf("Product exists (2024): %t", existsWithYear)
}

// Check if brand exists
brandExists, err := client.VerifyBrandExists("Optimum Nutrition")
if err != nil {
    log.Printf("Brand verification failed: %v", err)
} else {
    log.Printf("Brand exists: %t", brandExists)
}
```

## Building

```bash
cd go-supabase
go build -o supabase-client main.go
```

## Integration with C++ Component

The Go component is designed to be called by the C++ component through:

1. **Command Line Interface**: The Go binary can be called with specific commands
2. **HTTP API**: The Go component can run as a local HTTP server
3. **Shared Files**: Communication through JSON files in a shared directory

### Command Line Interface

```bash
# Insert product
./supabase-client insert --name "Whey Protein" --brand "ON" --flavor "Vanilla"

# Verify product
./supabase-client verify --name "Whey Protein" --brand "ON" --flavor "Vanilla"

# Batch insert
./supabase-client batch-insert --file products.json
```

### HTTP API Mode

```bash
# Start HTTP server
./supabase-client server --port 8080

# Then make HTTP requests from C++ component
curl -X POST http://localhost:8080/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Whey Protein","brand_name":"ON","flavor":"Vanilla"}'
```

## Performance

- **Single Product Insert**: ~50-100ms
- **Batch Insert (100 products)**: ~500ms-1s
- **Verification Query**: ~20-50ms
- **Memory Usage**: ~5-10MB

## Error Handling

All operations return detailed error messages and log comprehensive information:

- **Network Errors**: Connection timeouts, DNS failures
- **Authentication Errors**: Invalid API keys, expired tokens
- **Data Errors**: Invalid JSON, missing required fields
- **Supabase Errors**: Database constraints, duplicate keys

## Security

- **API Key Masking**: API keys are masked in logs
- **HTTPS Only**: All requests use HTTPS
- **Timeout Protection**: All requests have 30-second timeouts
- **Input Validation**: All inputs are validated before sending

## Testing

```bash
# Run tests
go test ./...

# Run with verbose output
go test -v ./...

# Run specific test
go test -run TestInsertProduct
```

## Monitoring

The component logs all operations with structured logging:

```
2024-01-15T10:30:00Z INFO ✅ Successfully inserted product: Whey Protein (ON)
2024-01-15T10:30:01Z INFO 🔍 Product verification: Whey Protein (ON) - exists: true
2024-01-15T10:30:02Z INFO 📦 Retrieved 5 products for brand: ON
```

## Future Enhancements

- **Connection Pooling**: Reuse HTTP connections for better performance
- **Retry Logic**: Automatic retry for failed requests
- **Metrics Collection**: Prometheus metrics for monitoring
- **Circuit Breaker**: Prevent cascading failures
- **Caching**: Local caching for frequently accessed data
