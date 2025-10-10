# 📁 Project Organization Guide

## **Overview**

This document outlines the organized structure of the SupplementIQ project, a supplement transparency platform built with Next.js frontend and Express.js backend.

## **🏗️ Project Structure**

```
SupplementIQ/
├── 📁 backend/                    # Express.js API server
│   ├── 📁 lib/                    # Core backend libraries
│   │   ├── 📁 core/               # Core system functionality
│   │   │   ├── cache.ts           # Caching system
│   │   │   ├── queue-processor.ts # Request queue processing
│   │   │   ├── request-queue.ts   # Request queue management
│   │   │   └── index.ts           # Core exports
│   │   ├── 📁 services/           # Business logic services
│   │   │   ├── autocomplete.ts    # Autocomplete service
│   │   │   ├── file-autocomplete.ts # File-based autocomplete
│   │   │   ├── daily-update-service.ts # Daily data updates
│   │   │   ├── product-verification.ts # Product validation
│   │   │   └── index.ts           # Service exports
│   │   ├── 📁 cpp-wrappers/       # C++ native module wrappers
│   │   │   ├── security-tree.ts   # Security system wrapper
│   │   │   ├── cpp-autocomplete.ts # C++ autocomplete wrapper
│   │   │   ├── cpp-daily-update.ts # C++ daily update wrapper
│   │   │   └── index.ts           # C++ wrapper exports
│   │   └── supabase.ts            # Database client
│   ├── 📁 middleware/             # Express middleware
│   │   ├── auth.ts                # Authentication middleware
│   │   └── validation.ts          # Input validation middleware
│   ├── 📁 routes/                 # API route handlers
│   │   ├── 📁 admin/              # Admin-specific routes
│   │   │   ├── 📁 auth/           # Admin authentication
│   │   │   ├── 📁 requests/       # Request management
│   │   │   ├── 📁 queue/          # Queue management
│   │   │   ├── 📁 stats/          # Statistics endpoints
│   │   │   ├── 📁 security/       # Security endpoints
│   │   │   └── index.ts           # Admin route exports
│   │   ├── auth.ts                # Authentication routes
│   │   ├── autocomplete.ts        # Autocomplete endpoints
│   │   ├── contributions.ts       # Contribution management
│   │   ├── ingredients.ts         # Ingredient endpoints
│   │   ├── owner.ts               # Owner-specific routes
│   │   ├── products.ts            # Product endpoints
│   │   ├── rankings.ts            # Ranking endpoints
│   │   ├── upload.ts              # File upload endpoints
│   │   ├── users.ts               # User management
│   │   └── index.ts               # Main route configuration
│   ├── 📁 tools/                  # C++ native modules
│   │   ├── 📁 AutocompleteService/ # C++ autocomplete service
│   │   ├── 📁 DailyUpdateService/  # C++ daily update service
│   │   ├── 📁 SecurityTree/        # C++ security system
│   │   └── 📁 Trie/               # C++ Trie implementation
│   ├── 📁 tests/                  # Test suites
│   │   ├── 📁 routes/             # Route tests
│   │   ├── 📁 mocks/              # Test mocks
│   │   ├── 📁 utils/              # Test utilities
│   │   └── autocomplete-edge-cases.test.ts
│   ├── index.ts                   # Main server entry point
│   ├── package.json               # Backend dependencies
│   └── tsconfig.json              # TypeScript configuration
├── 📁 frontend/                   # Next.js React application
│   ├── 📁 src/
│   │   ├── 📁 app/                # Next.js app router
│   │   │   ├── 📁 (admin)/        # Admin pages
│   │   │   ├── 📁 (auth)/         # Authentication pages
│   │   │   ├── 📁 (product)/      # Product pages
│   │   │   ├── 📁 (search)/       # Search pages
│   │   │   ├── 📁 (user)/         # User pages
│   │   │   └── 📁 api/            # API routes
│   │   ├── 📁 components/         # React components
│   │   │   ├── 📁 features/       # Feature-specific components
│   │   │   ├── 📁 layout/         # Layout components
│   │   │   └── 📁 ui/             # Reusable UI components
│   │   └── 📁 lib/                # Frontend libraries
│   │       ├── 📁 hooks/          # Custom React hooks
│   │       ├── 📁 utils/          # Utility functions
│   │       └── supabase/          # Frontend Supabase client
│   ├── package.json               # Frontend dependencies
│   └── tsconfig.json              # TypeScript configuration
├── 📁 shared/                     # Shared code between frontend/backend
│   ├── 📁 types/                  # TypeScript type definitions
│   │   ├── api.ts                 # API types
│   │   ├── auth.ts                # Authentication types
│   │   ├── contribution.ts        # Contribution types
│   │   ├── ingredient.ts          # Ingredient types
│   │   ├── product.ts             # Product types
│   │   ├── product-details.ts     # Product detail types
│   │   ├── user.ts                # User types
│   │   └── index.ts               # Type exports
│   ├── constants.ts               # Shared constants
│   └── validation.ts              # Shared validation logic
├── 📁 config/                     # Configuration files
│   ├── commitlint.config.js       # Commit linting
│   ├── env.template               # Environment variable template
│   ├── eslint.config.mjs          # ESLint configuration
│   └── tsconfig.json              # Root TypeScript config
├── 📁 docs/                       # Project documentation
│   ├── PROJECT_ORGANIZATION.md    # This file
│   ├── SECURITY_FIX.md            # Security vulnerability documentation
│   ├── PAGINATION_CACHING.md      # Caching strategy documentation
│   ├── LINTING.md                 # Linting setup documentation
│   ├── Journal.md                 # Development journal
│   └── README.md                  # Project overview
├── 📁 supabase/                   # Database configuration
│   ├── 📁 functions/              # Edge functions
│   ├── 📁 migrations/             # Database migrations
│   ├── config.toml                # Supabase configuration
│   ├── schema.sql                 # Database schema
│   └── seed.sql                   # Database seed data
├── 📁 scripts/                    # Build and deployment scripts
├── 📁 tools/                      # Development utilities
├── package.json                   # Root package configuration
├── .gitignore                     # Git ignore rules
└── README.md                      # Project readme
```

## **📋 Directory Purposes**

### **Backend (`/backend`)**
- **Express.js API server** with TypeScript
- **Modular route organization** for maintainability
- **C++ native modules** for high-performance operations
- **Comprehensive testing** with Jest
- **Security middleware** for authentication and validation

### **Frontend (`/frontend`)**
- **Next.js React application** with TypeScript
- **App router** for modern Next.js routing
- **Component-based architecture** with reusable UI components
- **Type-safe** integration with backend API

### **Shared (`/shared`)**
- **Common types** used by both frontend and backend
- **Validation logic** shared between client and server
- **Constants** for consistent configuration

### **Documentation (`/docs`)**
- **Comprehensive guides** for development and deployment
- **Security documentation** for vulnerability tracking
- **Architecture decisions** and design patterns

### **Configuration (`/config`)**
- **Centralized configuration** files
- **Development tools** setup (ESLint, TypeScript, etc.)
- **Environment templates** for easy setup

## **🔧 Development Workflow**

### **Adding New Features**
1. **Backend**: Add routes in `/backend/routes/`
2. **Frontend**: Add pages in `/frontend/src/app/`
3. **Types**: Define types in `/shared/types/`
4. **Tests**: Add tests in respective test directories

### **Code Organization Principles**
- **Single Responsibility**: Each file has one clear purpose
- **Dependency Injection**: Services are injected, not imported directly
- **Type Safety**: Full TypeScript coverage across the stack
- **Modular Architecture**: Clear separation of concerns

### **Import Paths**
- **Backend**: Use relative imports within modules
- **Shared**: Import from `../../shared/` or `../../../shared/`
- **Services**: Import from `../lib/services/` or `../lib/core/`

## **🚀 Performance Optimizations**

### **C++ Native Modules**
- **AutocompleteService**: High-speed text search
- **SecurityTree**: Efficient admin request tracking
- **DailyUpdateService**: Background data processing

### **Caching Strategy**
- **In-memory caching** for frequently accessed data
- **File-based persistence** for autocomplete data
- **Daily cache refresh** to balance performance and freshness

### **Request Processing**
- **Queue-based processing** for admin requests
- **Rate limiting** and security controls
- **Background processing** for heavy operations

## **🔒 Security Features**

### **Authentication**
- **JWT token validation** with proper middleware
- **Role-based access control** (admin/owner/user)
- **ID spoofing prevention** to prevent impersonation

### **Input Validation**
- **Express-validator** for request validation
- **Type-safe** input sanitization
- **SQL injection prevention** via Supabase client

### **Admin Security**
- **Rate limiting** (1 request per admin per day)
- **Request expiration** (10-minute timeout)
- **Security tree** for attack prevention

## **📚 Getting Started**

### **Prerequisites**
- Node.js 18+ and npm
- Supabase account and project
- Git for version control

### **Setup**
1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Configure environment**: Copy `config/env.template` to `.env`
4. **Start development**: `npm run dev`

### **Development Commands**
- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run test` - Run test suites
- `npm run lint` - Run linting and formatting

## **🎯 Best Practices**

### **Code Quality**
- **ESLint + Prettier** for consistent formatting
- **Husky** for pre-commit hooks
- **TypeScript strict mode** for type safety
- **Comprehensive testing** with Jest

### **Security**
- **Never commit secrets** (use .env files)
- **Validate all inputs** before processing
- **Use parameterized queries** (Supabase client)
- **Implement proper authentication** for all admin routes

### **Performance**
- **Use C++ modules** for performance-critical operations
- **Implement caching** for frequently accessed data
- **Optimize database queries** with proper indexing
- **Monitor and log** performance metrics

This organization ensures the project is maintainable, scalable, and follows modern development best practices.
