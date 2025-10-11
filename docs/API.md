# SupplementIQ API Documentation

## Overview

The SupplementIQ API provides comprehensive endpoints for managing supplements, ingredients, users, and administrative functions. All endpoints are versioned under `/api/v1/`.

**Base URL**: `https://your-domain.com/api/v1`

## Authentication

Most endpoints require authentication via JWT tokens in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication (`/api/v1/auth`)

#### POST `/api/v1/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "full_name": "John Doe"
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST `/api/v1/auth/login`
Authenticate user login.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "full_name": "John Doe"
    }
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890,
    "expires_in": 3600,
    "token_type": "bearer"
  }
}
```

#### POST `/api/v1/auth/logout`
Logout current user session.

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

#### GET `/api/v1/auth/me`
Get current authenticated user information.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "full_name": "John Doe"
    },
    "app_metadata": {
      "provider": "email",
      "role": "user"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST `/api/v1/auth/refresh`
Refresh user authentication token.

**Request Body:**
```json
{
  "refresh_token": "refresh_token_string"
}
```

**Response (200):**
```json
{
  "session": {
    "access_token": "new_jwt_token",
    "refresh_token": "new_refresh_token",
    "expires_at": 1234567890,
    "expires_in": 3600,
    "token_type": "bearer"
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Products (`/api/v1/products`)

#### GET `/api/v1/products`
Get products with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `category` (optional): Filter by category
- `search` (optional): Search query
- `sort` (optional): Sort field (default: 'created_at')
- `order` (optional): Sort order 'asc' or 'desc' (default: 'desc')

**Response (200):**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Whey Protein Isolate",
      "brand": "Optimum Nutrition",
      "category": "protein",
      "image_url": "https://example.com/image.jpg",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### GET `/api/v1/products/:id`
Get product by ID with detailed information.

**Response (200):**
```json
{
  "product": {
    "id": "uuid",
    "name": "Whey Protein Isolate",
    "brand": "Optimum Nutrition",
    "category": "protein",
    "ingredients": [
      {
        "name": "Whey Protein Isolate",
        "amount": "25g",
        "unit": "grams"
      }
    ],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Ingredients (`/api/v1/ingredients`)

#### GET `/api/v1/ingredients`
Get ingredients with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `type` (optional): Filter by ingredient type
- `search` (optional): Search query

**Response (200):**
```json
{
  "ingredients": [
    {
      "id": "uuid",
      "name": "Whey Protein Isolate",
      "type": "protein",
      "description": "High-quality protein source",
      "ingredient_types": {
        "name": "Protein"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  }
}
```

#### GET `/api/v1/ingredients/:id`
Get ingredient by ID with detailed information.

**Response (200):**
```json
{
  "ingredient": {
    "id": "uuid",
    "name": "Whey Protein Isolate",
    "type": "protein",
    "description": "High-quality protein source",
    "ingredient_types": {
      "name": "Protein"
    },
    "products": [
      {
        "id": "uuid",
        "name": "Gold Standard Whey",
        "brand": "Optimum Nutrition",
        "ingredients": [
          {
            "amount": "25g",
            "unit": "grams"
          }
        ]
      }
    ]
  }
}
```

### Contributions (`/api/v1/contributions`)

#### GET `/api/v1/contributions`
Get contributions with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `product_id` (optional): Filter by product ID
- `type` (optional): Filter by contribution type

**Response (200):**
```json
{
  "contributions": [
    {
      "id": "uuid",
      "type": "review",
      "content": "Great product!",
      "rating": 5,
      "created_at": "2024-01-01T00:00:00Z",
      "users": {
        "full_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "products": {
        "name": "Whey Protein",
        "brand": "Optimum Nutrition"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### POST `/api/v1/contributions`
Create a new contribution.

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "product_id": "uuid",
  "type": "review",
  "content": "Great product!",
  "rating": 5,
  "transparency_score": 85
}
```

**Response (201):**
```json
{
  "message": "Contribution created successfully",
  "contribution": {
    "id": "uuid",
    "type": "review",
    "content": "Great product!",
    "rating": 5,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST `/api/v1/contributions/:id/vote`
Vote on a contribution.

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "vote_type": "upvote"
}
```

**Response (200/201):**
```json
{
  "message": "Vote created/updated successfully",
  "vote": {
    "id": "uuid",
    "vote_type": "upvote",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Users (`/api/v1/users`)

#### GET `/api/v1/users/profile`
Get current user's profile.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "bio": "Supplement enthusiast",
    "avatar_url": "https://example.com/avatar.jpg",
    "contributions": [
      {
        "id": "uuid",
        "type": "review",
        "content": "Great product!",
        "rating": 5,
        "created_at": "2024-01-01T00:00:00Z",
        "products": {
          "name": "Whey Protein",
          "brand": "Optimum Nutrition"
        }
      }
    ]
  }
}
```

#### PUT `/api/v1/users/profile`
Update current user's profile.

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "full_name": "John Smith",
  "bio": "Updated bio",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "full_name": "John Smith",
    "bio": "Updated bio",
    "avatar_url": "https://example.com/new-avatar.jpg"
  }
}
```

#### GET `/api/v1/users/contributions`
Get current user's contributions.

**Headers:** `Authorization: Bearer <jwt_token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "contributions": [
    {
      "id": "uuid",
      "type": "review",
      "content": "Great product!",
      "rating": 5,
      "created_at": "2024-01-01T00:00:00Z",
      "products": {
        "name": "Whey Protein",
        "brand": "Optimum Nutrition",
        "image_url": "https://example.com/image.jpg"
      },
      "contribution_votes": [
        {
          "vote_type": "upvote"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### Rankings (`/api/v1/rankings`)

#### GET `/api/v1/rankings`
Get product rankings and leaderboards.

**Response (200):**
```json
{
  "rankings": {
    "top_products": [
      {
        "id": "uuid",
        "name": "Whey Protein",
        "brand": "Optimum Nutrition",
        "average_rating": 4.8,
        "total_reviews": 150
      }
    ],
    "top_contributors": [
      {
        "id": "uuid",
        "full_name": "John Doe",
        "contribution_count": 25,
        "total_points": 1250
      }
    ]
  }
}
```

### Autocomplete (`/api/v1/autocomplete`)

#### GET `/api/v1/autocomplete/products`
Get product autocomplete suggestions.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Maximum results (default: 10)

**Response (200):**
```json
{
  "suggestions": [
    "Whey Protein Isolate",
    "Whey Protein Concentrate",
    "Whey Protein Powder"
  ]
}
```

#### GET `/api/v1/autocomplete/brands`
Get brand autocomplete suggestions.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Maximum results (default: 10)

**Response (200):**
```json
{
  "suggestions": [
    "Optimum Nutrition",
    "Optimum Health"
  ]
}
```

#### GET `/api/v1/autocomplete/flavors`
Get flavor autocomplete suggestions.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Maximum results (default: 10)

**Response (200):**
```json
{
  "suggestions": [
    "Vanilla",
    "Vanilla Bean",
    "Vanilla Ice Cream"
  ]
}
```

### Admin (`/api/v1/admin`)

#### GET `/api/v1/admin/dashboard`
Get admin dashboard data.

**Headers:** `Authorization: Bearer <admin_jwt_token>`

**Response (200):**
```json
{
  "dashboard": {
    "total_users": 1250,
    "total_products": 500,
    "pending_contributions": 25,
    "admin_stats": {
      "total_admins": 5,
      "total_moderators": 12
    }
  }
}
```

#### GET `/api/v1/admin/requests`
Get pending requests for admin review.

**Headers:** `Authorization: Bearer <admin_jwt_token>`

**Response (200):**
```json
{
  "requests": [
    {
      "id": "uuid",
      "type": "product_submission",
      "status": "pending",
      "submitted_by": "user_id",
      "created_at": "2024-01-01T00:00:00Z",
      "data": {
        "product_name": "New Protein Powder",
        "brand": "New Brand"
      }
    }
  ]
}
```

#### POST `/api/v1/admin/requests/:id/approve`
Approve a pending request.

**Headers:** `Authorization: Bearer <admin_jwt_token>`

**Response (200):**
```json
{
  "message": "Request approved successfully"
}
```

#### POST `/api/v1/admin/requests/:id/reject`
Reject a pending request.

**Headers:** `Authorization: Bearer <admin_jwt_token>`

**Request Body:**
```json
{
  "reason": "Duplicate product"
}
```

**Response (200):**
```json
{
  "message": "Request rejected successfully"
}
```

### Owner (`/api/v1/owner`)

#### GET `/api/v1/owner/stats`
Get owner-level statistics.

**Headers:** `Authorization: Bearer <owner_jwt_token>`

**Response (200):**
```json
{
  "stats": {
    "total_revenue": 50000,
    "active_users": 1250,
    "system_health": "excellent",
    "admin_activity": {
      "force_updates_today": 0,
      "admin_votes_pending": 2
    }
  }
}
```

#### POST `/api/v1/owner/create-admin`
Create a new admin user.

**Headers:** `Authorization: Bearer <owner_jwt_token>`

**Request Body:**
```json
{
  "user_id": "uuid",
  "role": "admin"
}
```

**Response (200):**
```json
{
  "message": "Admin created successfully"
}
```

### Upload (`/api/v1/upload`)

#### POST `/api/v1/upload/image`
Upload an image file.

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:** Multipart form data with image file

**Response (200):**
```json
{
  "message": "Image uploaded successfully",
  "url": "https://example.com/uploads/image.jpg"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

API endpoints are subject to rate limiting:

- **General endpoints**: 100 requests per minute per IP
- **Authenticated endpoints**: 200 requests per minute per user
- **Admin endpoints**: 50 requests per minute per admin
- **Owner endpoints**: 100 requests per minute per owner

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Authentication Hierarchy

### User Roles
1. **User**: Basic authenticated user
2. **Moderator**: User with 1000+ contribution points, approved by admin/owner
3. **Admin**: Full administrative privileges with voting system
4. **Owner**: Highest level with unrestricted access

### Permission Levels
- **Moderators**: 30-second timeout between actions
- **Admins**: 75% approval required within 10 minutes for force updates, once per day limit
- **Newcomers** (<10 contributions): 5-minute delay between submissions
- **Contributors**: 1-minute delay between submissions

## Security Features

### Security Tree
- 24-hour segment tree prevents malicious admin overload
- One force update request per admin per day maximum
- Rate limiting on all administrative actions

### AdminCache
- Cached admin counts for faster privilege checks
- Democracy percentage calculations optimized
- Automatic cache invalidation on admin changes

## API Documentation Endpoint

#### GET `/api/v1/docs`
Get API information and available endpoints.

**Response (200):**
```json
{
  "name": "SupplementIQ API",
  "version": "1.0.0",
  "description": "Transparency engine for supplement industry",
  "endpoints": {
    "auth": "/api/v1/auth",
    "products": "/api/v1/products",
    "ingredients": "/api/v1/ingredients",
    "contributions": "/api/v1/contributions",
    "users": "/api/v1/users",
    "rankings": "/api/v1/rankings",
    "upload": "/api/v1/upload",
    "autocomplete": "/api/v1/autocomplete",
    "admin": "/api/v1/admin",
    "owner": "/api/v1/owner"
  },
  "documentation": "https://docs.supplementiq.com"
}
```
