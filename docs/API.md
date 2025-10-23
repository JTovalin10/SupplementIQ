# SupplementIQ API Documentation

## Overview

The SupplementIQ API provides comprehensive endpoints for managing supplements, ingredients, users, and administrative functions. The API is built with Next.js API routes and includes both versioned (`/api/v1/`) and direct (`/api/`) endpoints.

**Base URL**: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication via Supabase JWT tokens in the Authorization header:

```
Authorization: Bearer <supabase_jwt_token>
```

## API Structure

The API is organized into several main sections:
- **Authentication** (`/api/auth`) - User authentication and session management
- **Versioned API** (`/api/v1/`) - Comprehensive REST API with 16+ endpoints
- **Direct API** (`/api/`) - Additional endpoints for specific functionality
- **Admin API** (`/api/admin`) - Administrative functions
- **User Management** (`/api/users`) - User-related operations

## Authentication Endpoints (`/api/auth`)

### POST `/api/auth/login`
Authenticate user login with Supabase.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "newcomer",
    "username": "user123"
  },
  "session": {
    "access_token": "supabase_jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890,
    "expires_in": 3600,
    "token_type": "bearer"
  }
}
```

### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "user123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "user123",
    "role": "newcomer"
  }
}
```

### POST `/api/auth/logout`
Logout current user session.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### GET `/api/auth/me`
Get current authenticated user information.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "user123",
    "role": "contributor",
    "reputation_points": 150,
    "bio": "Supplement enthusiast",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST `/api/auth/refresh`
Refresh JWT token.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response (200):**
```json
{
  "success": true,
  "access_token": "new_jwt_token",
  "expires_in": 3600
}
```

## Products API (`/api/products`)

### GET `/api/products`
Get products with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 25)
- `category` (optional): Filter by product category
- `search` (optional): Search products by name
- `detailed` (optional): Include full product data (default: false)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Whey Protein Isolate",
      "image_url": "https://example.com/image.jpg",
      "transparency_score": 85,
      "confidence_level": "verified",
      "category": "protein",
      "dosage_rating": 90,
      "danger_rating": 10,
      "community_rating": 8.5,
      "total_reviews": 25,
      "brand": {
        "id": 1,
        "name": "Optimum Nutrition"
      },
      "community_comment": {
        "title": "Great protein quality",
        "comment": "Excellent taste and mixability...",
        "rating": 9,
        "user": {
          "username": "proteinlover",
          "reputation_points": 500
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 150
  }
}
```

### POST `/api/products`
Create a new product.

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "name": "New Protein Powder",
  "category": "protein",
  "brand_id": 1,
  "description": "High-quality protein supplement",
  "serving_size": 30,
  "serving_unit": "g",
  "nutrition_facts": {
    "protein": 25,
    "carbs": 3,
    "fat": 1
  },
  "ingredients": [
    {
      "name": "Whey Protein Isolate",
      "amount": 25,
      "unit": "g"
    }
  ],
  "transparency_score": 80,
  "created_by": "user_uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "New Protein Powder",
    "category": "protein",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET `/api/products/[id]`
Get detailed product information.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Whey Protein Isolate",
    "category": "protein",
    "description": "Premium whey protein isolate...",
    "transparency_score": 85,
    "confidence_level": "verified",
    "dosage_rating": 90,
    "danger_rating": 10,
    "community_rating": 8.5,
    "total_reviews": 25,
    "brand": {
      "id": 1,
      "name": "Optimum Nutrition",
      "website": "https://optimumnutrition.com",
      "brand_trust": "reputable"
    },
    "ingredients": [
      {
        "name": "Whey Protein Isolate",
        "amount": 25,
        "unit": "g",
        "verified": true
      }
    ],
    "reviews": [
      {
        "id": 1,
        "rating": 9,
        "title": "Excellent quality",
        "comment": "Great taste and mixability",
        "user": {
          "username": "proteinlover",
          "reputation_points": 500
        },
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

## Versioned API (`/api/v1/`)

### Authentication (`/api/v1/auth`)

#### POST `/api/v1/auth/login`
Enhanced login endpoint with additional features.

#### POST `/api/v1/auth/register`
Enhanced registration with username validation.

#### GET `/api/v1/auth/me`
Get current user with extended profile information.

### Products (`/api/v1/products`)

#### GET `/api/v1/products`
Advanced product listing with caching and performance optimization.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 25, max: 100)
- `category`: Filter by product category
- `search`: Search in product name and description
- `sort`: Sort field (name, created_at, rating, price)
- `order`: Sort order (asc, desc)

**Response includes caching headers:**
```
Cache-Control: public, max-age=3600
X-Cache-Status: hit
```

#### POST `/api/v1/products`
Create product with enhanced validation.

#### GET `/api/v1/products/[id]`
Get product with full details and relationships.

#### GET `/api/v1/products/search/[query]`
Advanced search with autocomplete support.

### Admin (`/api/v1/admin`)

#### GET `/api/v1/admin/dashboard/stats`
Get dashboard statistics.

**Headers:** `Authorization: Bearer <admin_jwt_token>`

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 1250,
    "pendingSubmissions": 15,
    "pendingEdits": 8,
    "totalProducts": 500,
    "recentActivity": 25,
    "systemHealth": 98
  }
}
```

#### GET `/api/v1/admin/dashboard/pending-submissions`
Get pending product submissions.

#### GET `/api/v1/admin/dashboard/recent-activity`
Get recent system activity.

### Autocomplete (`/api/v1/autocomplete`)

#### GET `/api/v1/autocomplete/products`
Get product autocomplete suggestions.

**Query Parameters:**
- `q`: Search query
- `limit`: Number of suggestions (default: 10)

#### GET `/api/v1/autocomplete/brands`
Get brand autocomplete suggestions.

#### GET `/api/v1/autocomplete/flavors`
Get flavor autocomplete suggestions.

## Admin API (`/api/admin`)

### POST `/api/admin/update-role`
Update user role (Admin/Owner only).

**Headers:** `Authorization: Bearer <admin_jwt_token>`

**Request Body:**
```json
{
  "userId": "user_uuid",
  "newRole": "moderator",
  "reason": "Promoted for excellent contributions"
}
```

### GET `/api/admin/users`
Get all users with pagination.

### POST `/api/admin/update-ratings`
Update product ratings (Admin only).

## User Management (`/api/users`)

### GET `/api/users/[id]`
Get user profile by ID.

### PUT `/api/users/[id]`
Update user profile.

### GET `/api/users/privileged`
Get users with privileged roles.

## Contributions API (`/api/contributions`)

### GET `/api/contributions`
Get user contributions.

### POST `/api/contributions`
Submit new contribution.

### GET `/api/contributions/[id]`
Get contribution details.

### POST `/api/contributions/[id]/vote`
Vote on contribution (Moderator+ only).

## Rankings API (`/api/rankings`)

### GET `/api/rankings`
Get product rankings by category.

**Query Parameters:**
- `category` (optional): Filter by category
- `sort` (optional): Sort by (transparency, cost, rating)

### POST `/api/rankings/refresh`
Refresh rankings cache (Admin only).

## Brands API (`/api/brands`)

### GET `/api/brands`
Get all brands.

### GET `/api/brands/[id]`
Get brand details.

## Health & Debug (`/api/health`, `/api/debug-auth`)

### GET `/api/health`
Health check endpoint.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

### GET `/api/debug-auth`
Debug authentication status (Development only).

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

## Rate Limiting

- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 1000 requests per minute
- **Admin endpoints**: 100 requests per day per admin

## Caching

- **Product listings**: First 2 pages cached for 1 hour
- **User profiles**: Cached for 30 minutes
- **Rankings**: Cached for 6 hours
- **Autocomplete**: Cached for 24 hours

## Webhooks

The API supports webhooks for real-time updates:

- **Product approved**: `POST /webhooks/product-approved`
- **User role changed**: `POST /webhooks/role-changed`
- **New contribution**: `POST /webhooks/contribution-submitted`

## SDKs and Libraries

- **JavaScript/TypeScript**: Use Supabase client
- **React**: Use provided hooks (`useAuth`, `useProducts`, etc.)
- **Node.js**: Use Supabase server client

## Support

For API support:
- Check the documentation in `docs/`
- Review error messages and status codes
- Create an issue in the repository
- Contact the development team

---

**API Version**: 1.0.0  
**Last Updated**: 2024-01-01  
**Base URL**: `https://your-domain.com/api`