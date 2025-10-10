# Type Definitions

This directory contains organized TypeScript type definitions for the SupplementIQ application, split into focused, maintainable files.

## 📁 File Organization

### Core Entity Types
- **`user.ts`** - User entities and user management types
- **`auth.ts`** - Authentication, login, and registration types
- **`product.ts`** - Product entities, categories, and product-related types
- **`ingredient.ts`** - Ingredient entities, types, and product-ingredient relationships
- **`contribution.ts`** - User contributions, reviews, and fact-checking types

### Specialized Types
- **`product-details.ts`** - Category-specific product detail interfaces (pre-workout, protein, etc.)
- **`api.ts`** - Common API response patterns, pagination, and error handling

### Index
- **`index.ts`** - Central export file that re-exports all types for easy importing

## 🎯 Benefits of This Organization

### ✅ **Maintainability**
- **Focused Files** - Each file contains related types only
- **Easy Navigation** - Developers can quickly find relevant types
- **Reduced Conflicts** - Multiple developers can work on different type files simultaneously

### ✅ **Reusability**
- **Selective Imports** - Import only the types you need
- **Tree Shaking** - Bundlers can eliminate unused types
- **Clear Dependencies** - Explicit imports show type relationships

### ✅ **Scalability**
- **Easy Extension** - Add new types without cluttering existing files
- **Logical Grouping** - Related types stay together as the codebase grows
- **Clear Separation** - Entity types vs API types vs specialized types

## 📝 Usage Examples

### Import Specific Types
```typescript
// Import only what you need
import { User, UpdateUserRequest } from '@/shared/types/user';
import { LoginRequest, AuthResponse } from '@/shared/types/auth';
```

### Import All Types
```typescript
// Import everything from the index
import { User, Product, ApiResponse } from '@/shared/types';
```

### Import Related Types Together
```typescript
// Import related types from the same file
import { 
  Product, 
  Category, 
  CreateProductRequest, 
  ProductFilters 
} from '@/shared/types/product';
```

## 🔄 Migration from Old Structure

The old `shared/types.ts` file has been split into these organized files:

| Old File | New Files |
|----------|-----------|
| `shared/types.ts` | `shared/types/user.ts`<br>`shared/types/auth.ts`<br>`shared/types/product.ts`<br>`shared/types/ingredient.ts`<br>`shared/types/contribution.ts`<br>`shared/types/product-details.ts`<br>`shared/types/api.ts`<br>`shared/types/index.ts` |

## 🎨 Type Design Principles

### Nullable Ingredient Amounts
All ingredient amounts in product detail types are nullable (`number | null`) because:
- Not all products contain all possible ingredients
- Realistic data modeling for supplement industry
- Prevents runtime errors when accessing missing data
- Enables proper null checking in UI components

### Clear Separation of Concerns
- **Entity Types** - Core business objects (User, Product, Ingredient)
- **Request/Response Types** - API communication patterns
- **Filter Types** - Query and search parameters
- **Detail Types** - Category-specific product information

### Consistent Naming
- **Request types** end with `Request` (e.g., `CreateProductRequest`)
- **Response types** end with `Response` (e.g., `AuthResponse`)
- **Filter types** end with `Filters` (e.g., `ProductFilters`)
- **Detail types** end with `Details` (e.g., `PreworkoutDetails`)
