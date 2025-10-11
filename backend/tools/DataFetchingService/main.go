package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	// Initialize Supabase client
	supabase := NewSupabaseClient()

	// Set up Gin router
	r := gin.Default()

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// API routes
	api := r.Group("/api/v1")
	{
		// 1. Get paginated products by category
		api.GET("/products", supabase.GetPaginatedProducts)
		
		// 2. Search products by name, brand, and flavor
		api.GET("/search", supabase.SearchProducts)
		
		// 3. Filter products by brand, price, product type
		api.GET("/filter", supabase.FilterProducts)
		
		// 4. Get admin and owner data for cache
		api.GET("/admin-cache", supabase.GetAdminCache)
		
		// 5. Update product information
		api.PUT("/products/:id", supabase.UpdateProduct)
		
		// Additional endpoints
		api.GET("/products/:id", supabase.GetProductWithDetails)
		api.GET("/brands", supabase.GetBrands)
		api.GET("/categories", supabase.GetCategories)
		api.GET("/stats", supabase.GetProductStats)
		
		// Temporary Products Workflow (replaces queue system)
		api.POST("/temp-products", supabase.SubmitTemporaryProduct)           // Submit product for approval
		api.GET("/temp-products", supabase.GetTemporaryProducts)              // Get temporary products with filtering
		api.GET("/temp-products/:id", supabase.GetTemporaryProductById)       // Get specific temporary product
		api.PUT("/temp-products/:id/review", supabase.ReviewTemporaryProduct) // Approve/deny product
		api.GET("/temp-products/pending/count", supabase.GetPendingProductsCount) // Get pending count for dashboard
	}

	// Health check endpoint
	r.GET("/health", supabase.HealthCheck)

	// Start server
	port := getEnv("PORT", "8080")
	log.Printf("🚀 DataFetchingService starting on port %s", port)
	log.Printf("📊 Ready to handle thousands of concurrent connections")
	
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}