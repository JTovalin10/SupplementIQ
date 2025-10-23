# 📁 Project Organization Guide

## **Overview**

This document outlines the organized structure of the SupplementIQ project, a supplement transparency platform built as a **single Next.js full-stack application** with comprehensive API routes, advanced caching, and role-based access control.

## **🏗️ Project Structure**

```
SupplementIQ/
├── 📁 src/                          # Next.js application source
│   ├── 📁 app/                      # Next.js App Router
│   │   ├── 📁 (auth)/               # Authentication pages
│   │   │   ├── layout.tsx           # Auth layout wrapper
│   │   │   └── 📁 login/            # Login page
│   │   │   └── 📁 register/          # Registration page
│   │   ├── 📁 (product)/            # Product detail pages
│   │   │   └── 📁 description/      # Product description pages
│   │   │       ├── error.tsx        # Error boundary
│   │   │       ├── loading.tsx      # Loading state
│   │   │       ├── not-found.tsx    # 404 page
│   │   │       ├── template.tsx      # Product template
│   │   │       └── layout.tsx       # Product layout
│   │   ├── 📁 (search)/             # Search and browse pages
│   │   │   ├── 📁 brands/           # Brand listing
│   │   │   ├── 📁 ingredients/      # Ingredient search
│   │   │   ├── 📁 products/         # Product search and categories
│   │   │   │   ├── 📁 [id]/         # Individual product pages
│   │   │   │   ├── 📁 protein-powder/ # Category pages
│   │   │   │   ├── 📁 pre-workout/  # Category pages
│   │   │   │   └── ...              # Other categories
│   │   │   ├── 📁 rankings/         # Product rankings
│   │   │   └── layout.tsx           # Search layout
│   │   ├── 📁 (user)/               # User-specific pages
│   │   │   ├── 📁 contributions/    # User contributions
│   │   │   ├── 📁 profile/          # User profile
│   │   │   ├── 📁 settings/         # User settings
│   │   │   └── layout.tsx           # User layout
│   │   ├── 📁 admin/                # Admin dashboard pages
│   │   │   ├── 📁 dashboard/        # Admin dashboard
│   │   │   ├── 📁 owner/            # Owner tools
│   │   │   └── 📁 update-role/      # Role management
│   │   ├── 📁 api/                  # API routes (112 endpoints)
│   │   │   ├── 📁 v1/               # Versioned API endpoints
│   │   │   │   ├── 📁 auth/         # Authentication endpoints
│   │   │   │   ├── 📁 admin/        # Admin endpoints
│   │   │   │   ├── 📁 products/     # Product management
│   │   │   │   ├── 📁 users/        # User management
│   │   │   │   └── ...              # Other v1 endpoints
│   │   │   ├── 📁 auth/             # Authentication API
│   │   │   │   ├── 📁 [...nextauth]/ # NextAuth integration
│   │   │   │   ├── callback/        # Auth callback
│   │   │   │   ├── login/           # Login endpoint
│   │   │   │   ├── logout/          # Logout endpoint
│   │   │   │   ├── register/        # Registration endpoint
│   │   │   │   └── ...              # Other auth endpoints
│   │   │   ├── 📁 admin/            # Admin API endpoints
│   │   │   ├── 📁 products/         # Product API endpoints
│   │   │   ├── 📁 contributions/    # Contribution management
│   │   │   ├── 📁 rankings/         # Ranking endpoints
│   │   │   ├── 📁 users/            # User management
│   │   │   └── ...                  # Other API routes
│   │   ├── 📁 contribute/           # Contribution pages
│   │   │   ├── page.tsx             # Main contribute page
│   │   │   └── 📁 new-product/      # New product submission
│   │   ├── 📁 login/                # Login page
│   │   ├── 📁 signup/               # Signup page
│   │   ├── 📁 user/                 # User dashboard
│   │   ├── 📁 moderator/            # Moderator dashboard
│   │   ├── 📁 owner/                # Owner page
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Homepage
│   │   ├── globals.css              # Global styles
│   │   └── middleware.ts            # Next.js middleware
│   ├── 📁 components/               # React components (109 components)
│   │   ├── 📁 forms/                # Dynamic form system
│   │   │   ├── 📁 categories/       # Category-specific forms
│   │   │   │   ├── ProteinForm.tsx  # Protein form
│   │   │   │   ├── PreworkoutForm.tsx # Preworkout form
│   │   │   │   ├── BCAAForm.tsx     # BCAA form
│   │   │   │   └── ...              # Other category forms
│   │   │   ├── ProductForm.tsx      # Main product form
│   │   │   ├── ProductFormContext.tsx # Form context
│   │   │   ├── IngredientField.tsx  # Ingredient input
│   │   │   └── ...                  # Other form components
│   │   ├── 📁 layout/               # Layout components
│   │   │   ├── header.tsx           # Navigation header
│   │   │   ├── footer.tsx           # Site footer
│   │   │   ├── sidebar.tsx          # Sidebar navigation
│   │   │   ├── navigation.tsx       # Navigation component
│   │   │   ├── breadcrumbs.tsx      # Breadcrumb navigation
│   │   │   ├── error-boundary.tsx   # Error boundary
│   │   │   └── loading.tsx          # Loading component
│   │   ├── 📁 ui/                   # Reusable UI components (20 components)
│   │   │   ├── button.tsx           # Button component
│   │   │   ├── input.tsx            # Input component
│   │   │   ├── card.tsx             # Card component
│   │   │   ├── dialog.tsx           # Dialog component
│   │   │   ├── select.tsx           # Select component
│   │   │   ├── NotificationContainer.tsx # Notification system
│   │   │   ├── SimpleCookieConsent.tsx # Cookie consent
│   │   │   └── ...                  # Other UI components
│   │   ├── 📁 features/             # Feature-specific components
│   │   │   ├── 📁 dashboard/        # Dashboard components
│   │   │   ├── JWTDashboard.tsx     # JWT debugging dashboard
│   │   │   └── RankingTable.tsx     # Ranking display
│   │   ├── 📁 contribute/          # Contribution workflow
│   │   │   ├── ContributeHero.tsx   # Hero section
│   │   │   ├── CTASection.tsx       # Call-to-action
│   │   │   ├── GuidelinesSection.tsx # Guidelines
│   │   │   ├── TabNavigation.tsx    # Tab navigation
│   │   │   └── ...                  # Other contribute components
│   │   ├── 📁 common/               # Common components
│   │   ├── 📁 examples/             # Example components
│   │   └── 📁 debug/                # Debug components
│   ├── 📁 lib/                      # Core libraries
│   │   ├── 📁 contexts/             # React contexts (8 contexts)
│   │   │   ├── AuthContext.tsx      # Authentication context
│   │   │   ├── UserContext.tsx      # User context
│   │   │   ├── AdminContext.tsx     # Admin context
│   │   │   ├── DashboardContext.tsx # Dashboard context
│   │   │   ├── AppContext.tsx       # Main app context
│   │   │   ├── AppStateContext.tsx  # App state context
│   │   │   ├── ModalContext.tsx     # Modal context
│   │   │   └── UserPreferencesContext.tsx # User preferences
│   │   ├── 📁 hooks/                # Custom React hooks (6 hooks)
│   │   │   ├── use-auth.ts          # Authentication hook
│   │   │   ├── use-products.ts      # Products hook
│   │   │   ├── use-contributions.ts # Contributions hook
│   │   │   ├── use-cache.ts         # Caching hook
│   │   │   ├── use-redis.ts         # Redis hook
│   │   │   └── use-debounce.ts      # Debounce hook
│   │   ├── 📁 utils/                # Utility functions
│   │   │   ├── cache.ts             # Advanced caching system
│   │   │   ├── helpers.ts           # Helper functions
│   │   │   ├── role-utils.ts        # Role utilities
│   │   │   └── session-refresh.ts   # Session management
│   │   ├── 📁 database/             # Database clients
│   │   │   ├── 📁 supabase/         # Supabase clients
│   │   │   │   ├── client.ts        # Browser client
│   │   │   │   ├── server.ts        # Server client
│   │   │   │   └── middleware.ts    # Middleware client
│   │   │   └── database.types.ts    # Database types
│   │   ├── 📁 validation/           # Input validation
│   │   │   ├── schemas.ts           # Validation schemas
│   │   │   └── rules.ts             # Validation rules
│   │   ├── 📁 config/               # Configuration
│   │   │   ├── config.ts            # App configuration
│   │   │   ├── constants.ts         # Constants
│   │   │   └── 📁 data/             # Static data
│   │   ├── 📁 auth/                 # Authentication utilities
│   │   │   ├── error-messages.ts    # Auth error messages
│   │   │   └── role-routing.ts      # Role-based routing
│   │   ├── 📁 api/                  # API services
│   │   │   └── 📁 services/         # API service functions
│   │   ├── 📁 backend/              # Backend utilities
│   │   │   ├── product-verification.ts # Product validation
│   │   │   └── 📁 services/         # Backend services
│   │   ├── 📁 middleware/           # Middleware utilities
│   │   │   └── redis-middleware.ts  # Redis middleware
│   │   ├── 📁 types/                # Type definitions
│   │   │   ├── types.ts             # Main types
│   │   │   ├── next-auth.d.ts       # NextAuth types
│   │   │   └── ipaddr.d.ts          # IP address types
│   │   ├── supabase.ts              # Supabase configuration
│   │   ├── redis-init.ts            # Redis initialization
│   │   └── startup.ts               # Application startup
│   └── middleware.ts                # Next.js middleware
├── 📁 Database/                     # Database configuration
│   ├── 📁 Redis/                    # Redis client configuration
│   │   └── client.ts                # Redis client with pooling
│   └── 📁 supabase/                 # Database schema and migrations
│       ├── schema.sql               # Main database schema
│       ├── config.toml              # Supabase configuration
│       ├── rls-policies.sql         # Row Level Security policies
│       ├── jwt-custom-claims-solution.sql # JWT custom claims
│       ├── jwt-role-utilities.sql   # JWT role utilities
│       ├── apply-jwt-solution.sql   # JWT solution application
│       ├── simple-auth-fix.sql      # Simple auth fixes
│       ├── drop-all-policies.sql    # Policy cleanup
│       └── 📁 temp-sql-files/       # Temporary SQL files
├── 📁 shared/                       # Shared types and utilities
│   ├── 📁 types/                    # TypeScript type definitions
│   │   ├── api.ts                   # API types
│   │   ├── auth.ts                  # Authentication types
│   │   ├── contribution.ts          # Contribution types
│   │   ├── ingredient.ts            # Ingredient types
│   │   ├── product.ts               # Product types
│   │   ├── product-details.ts       # Product detail types
│   │   ├── user.ts                  # User types
│   │   └── index.ts                 # Type exports
│   ├── constants.ts                 # Shared constants
│   └── validation.ts                # Shared validation logic
├── 📁 docs/                         # Project documentation
│   ├── PROJECT_ORGANIZATION.md      # This file
│   ├── API.md                       # API documentation
│   ├── SECURITY_FIX.md              # Security vulnerability documentation
│   ├── PAGINATION_CACHING.md        # Caching strategy documentation
│   ├── LINTING.md                   # Linting setup documentation
│   ├── MIGRATION_SUMMARY.md         # Migration documentation
│   ├── Journal.md                   # Development journal
│   └── README.md                    # Project overview
├── 📁 scripts/                      # Database management scripts
│   ├── add-role-column.js           # Add role column script
│   ├── check-user-role.js           # Check user role script
│   ├── debug-auth.js                # Auth debugging script
│   ├── fix-user-record.js           # Fix user record script
│   ├── generate-jwt-secret.js       # JWT secret generation
│   ├── sync-env.js                  # Environment sync
│   └── update-user-role.js          # Update user role script
├── 📁 config/                       # Configuration files
│   ├── commitlint.config.js         # Commit linting
│   ├── env.template                  # Environment variable template
│   ├── eslint.config.mjs            # ESLint configuration
│   ├── postcss.config.mjs           # PostCSS configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   └── tsconfig.json                # TypeScript configuration
├── 📁 public/                       # Static assets
├── 📁 .husky/                       # Git hooks
├── 📁 .vscode/                      # VS Code configuration
├── package.json                     # Dependencies and scripts
├── package-lock.json                # Dependency lock file
├── next.config.ts                   # Next.js configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.mjs               # PostCSS configuration
├── tsconfig.json                    # TypeScript configuration
├── vitest.config.ts                 # Vitest configuration
├── .prettierrc                      # Prettier configuration
├── .prettierignore                  # Prettier ignore rules
├── .gitignore                       # Git ignore rules
└── README.md                        # Project readme
```

## **📋 Directory Purposes**

### **Source Code (`/src`)**
- **Next.js App Router**: Modern file-based routing with layouts
- **API Routes**: 112+ API endpoints for full-stack functionality
- **React Components**: 109+ components with reusable UI system
- **Context Management**: 8 React contexts for state management
- **Custom Hooks**: 6 custom hooks for common functionality
- **TypeScript**: Full type safety across the application

### **Database (`/Database`)**
- **Supabase Integration**: PostgreSQL database with authentication
- **Redis Caching**: High-performance caching with connection pooling
- **Schema Management**: Comprehensive database schema with RLS
- **Migration Scripts**: Database setup and maintenance scripts

### **Shared (`/shared`)**
- **Type Definitions**: Shared TypeScript types across the application
- **Validation Logic**: Common validation schemas and rules
- **Constants**: Shared constants for consistent configuration

### **Documentation (`/docs`)**
- **Comprehensive Guides**: Development and deployment documentation
- **Security Documentation**: Vulnerability tracking and fixes
- **API Documentation**: Complete API endpoint documentation
- **Architecture Decisions**: Design patterns and organization

### **Configuration (`/config`)**
- **Development Tools**: ESLint, Prettier, TypeScript configuration
- **Environment Templates**: Easy setup with environment variables
- **Build Configuration**: Next.js, Tailwind, PostCSS setup

## **🔧 Development Workflow**

### **Adding New Features**
1. **Pages**: Add pages in `/src/app/` using App Router
2. **API Routes**: Add API endpoints in `/src/app/api/`
3. **Components**: Add components in `/src/components/`
4. **Types**: Define types in `/shared/types/`
5. **Context**: Add contexts in `/src/lib/contexts/`
6. **Hooks**: Add custom hooks in `/src/lib/hooks/`

### **Code Organization Principles**
- **Single Responsibility**: Each file has one clear purpose
- **Context-Based State**: React contexts avoid prop drilling
- **Type Safety**: Full TypeScript coverage with strict mode
- **Modular Architecture**: Clear separation of concerns
- **Reusable Components**: UI components in `/src/components/ui/`

### **Import Paths**
- **App Router**: Use relative imports within app directory
- **Components**: Import from `@/components/`
- **Lib**: Import from `@/lib/`
- **Shared**: Import from `@/shared/`
- **Types**: Import from `@/shared/types/`

## **🚀 Performance Optimizations**

### **Caching Strategy**
- **Redis Integration**: High-performance caching with Redis
- **In-Memory Fallback**: Automatic fallback to in-memory cache
- **Smart Invalidation**: Dependency-based cache invalidation
- **Pagination Caching**: First 2 pages cached for performance
- **Connection Pooling**: Efficient Redis connection management

### **Database Optimizations**
- **Supabase Client**: Optimized PostgreSQL queries
- **Row Level Security**: Data protection with RLS policies
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Proper indexing and query patterns

### **Frontend Optimizations**
- **Next.js App Router**: Modern routing with performance benefits
- **Component Lazy Loading**: Dynamic imports for large components
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting by route

## **🔒 Security Features**

### **Authentication & Authorization**
- **Supabase Auth**: Secure authentication with JWT tokens
- **CASL Permissions**: Fine-grained role-based access control
- **Middleware Protection**: Route-level security with Next.js middleware
- **Session Management**: Secure session handling with "Remember Me"

### **Data Protection**
- **Input Validation**: Comprehensive input sanitization with Zod
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **XSS Protection**: Content Security Policy and sanitization
- **Rate Limiting**: Protection against abuse (planned)

### **Admin Security**
- **Role-Based Access**: Admin/Owner middleware enforces permissions
- **ID Spoofing Prevention**: Users cannot impersonate others
- **JWT Token Validation**: All requests must have valid tokens
- **Database Role Confirmation**: Double-check user role in database

## **📚 Getting Started**

### **Prerequisites**
- Node.js 18+ and npm
- Supabase account and project
- Redis server (optional, falls back to in-memory cache)
- Git for version control

### **Setup**
1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Configure environment**: Copy `config/env.template` to `.env.local`
4. **Set up database**: Run SQL scripts in `Database/supabase/`
5. **Start development**: `npm run dev`

### **Development Commands**
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests with Vitest
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## **🎯 Best Practices**

### **Code Quality**
- **ESLint + Prettier**: Consistent formatting and linting
- **Husky**: Pre-commit hooks for quality control
- **TypeScript Strict Mode**: Maximum type safety
- **Vitest**: Fast testing framework with coverage

### **Security**
- **Never commit secrets**: Use `.env.local` files
- **Validate all inputs**: Use Zod schemas for validation
- **Use parameterized queries**: Supabase client prevents SQL injection
- **Implement proper authentication**: JWT tokens with role verification

### **Performance**
- **Use Redis caching**: For frequently accessed data
- **Optimize database queries**: Proper indexing and query patterns
- **Implement code splitting**: Dynamic imports for large components
- **Monitor and log**: Performance metrics and error tracking

This organization ensures the project is maintainable, scalable, and follows modern development best practices with a focus on performance, security, and developer experience.