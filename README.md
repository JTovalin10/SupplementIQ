# SupplementIQ

The transparency engine for the supplement industry. Discover real protein content, transparency scores, and make informed supplement choices.

## Features

- 🔍 **Product Search & Discovery**: Browse supplements by category with advanced filtering
- 📊 **Transparency Scoring**: Real protein content and bioavailability calculations
- 👥 **Community-Driven**: Wikipedia-style editing with community verification
- 💰 **Cost Efficiency**: Compare products by cost per effective gram of protein
- 🛡️ **Admin Dashboard**: Comprehensive admin and owner management tools
- 🔐 **Role-Based Access**: Secure authentication with Supabase
- ⚡ **Advanced Caching**: Redis-powered performance optimization

## Tech Stack

### Frontend & Backend (Full-Stack Next.js)
- **Next.js 15** with App Router and API Routes
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase** for database and authentication
- **React Context** for state management
- **CASL** for fine-grained permissions
- **Redis** for caching and performance

### Database & Infrastructure
- **PostgreSQL** via Supabase
- **Redis** for caching and session management
- **Row Level Security (RLS)** for data protection
- **JWT** for authentication tokens

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Redis server (optional, falls back to in-memory cache)
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SupplementIQ
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_USERNAME=default

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SupplementIQ

# Cache Configuration
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# Development
DEBUG=supplementiq:*
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup

#### Supabase Configuration
1. Create a new Supabase project
2. Enable authentication in Supabase Dashboard
3. Set up the database schema (see `Database/supabase/schema.sql`)
4. Configure authentication settings:
   - Enable email/password authentication
   - Enable sign-ups in Authentication Settings
   - Configure JWT settings for custom claims

#### Database Schema
Run the SQL files in order:
```bash
# Apply the main schema
psql -h your-db-host -U postgres -d postgres -f Database/supabase/schema.sql

# Apply JWT solutions (if needed)
psql -h your-db-host -U postgres -d postgres -f Database/supabase/jwt-custom-claims-solution.sql
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`

## Project Structure

```
SupplementIQ/
├── 📁 src/                          # Next.js application source
│   ├── 📁 app/                      # Next.js App Router
│   │   ├── 📁 (auth)/               # Authentication pages
│   │   ├── 📁 (product)/            # Product detail pages
│   │   ├── 📁 (search)/             # Search and browse pages
│   │   ├── 📁 (user)/               # User-specific pages
│   │   ├── 📁 admin/                 # Admin dashboard pages
│   │   ├── 📁 api/                   # API routes (112 endpoints)
│   │   │   ├── 📁 v1/               # Versioned API endpoints
│   │   │   ├── 📁 auth/              # Authentication endpoints
│   │   │   ├── 📁 admin/             # Admin-only endpoints
│   │   │   ├── 📁 products/          # Product management
│   │   │   └── 📁 ...                # Other API routes
│   │   └── 📁 ...                    # Other pages
│   ├── 📁 components/               # React components
│   │   ├── 📁 forms/                # Dynamic form system
│   │   ├── 📁 layout/               # Layout components
│   │   ├── 📁 ui/                   # Reusable UI components
│   │   ├── 📁 features/             # Feature-specific components
│   │   └── 📁 ...                   # Other components
│   ├── 📁 lib/                      # Core libraries
│   │   ├── 📁 contexts/             # React contexts (8 contexts)
│   │   ├── 📁 hooks/                # Custom React hooks
│   │   ├── 📁 utils/                # Utility functions
│   │   ├── 📁 database/             # Database clients
│   │   ├── 📁 validation/           # Input validation
│   │   └── 📁 ...                   # Other utilities
│   └── middleware.ts                # Next.js middleware
├── 📁 Database/                     # Database configuration
│   ├── 📁 Redis/                    # Redis client configuration
│   └── 📁 supabase/                 # Database schema and migrations
├── 📁 shared/                       # Shared types and utilities
│   ├── 📁 types/                    # TypeScript type definitions
│   ├── constants.ts                 # Shared constants
│   └── validation.ts                # Shared validation logic
├── 📁 docs/                         # Project documentation
├── 📁 scripts/                      # Database management scripts
├── 📁 config/                       # Configuration files
├── 📁 public/                       # Static assets
├── package.json                     # Dependencies and scripts
├── next.config.ts                   # Next.js configuration
├── tailwind.config.js               # Tailwind CSS configuration
└── tsconfig.json                    # TypeScript configuration
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### Products (`/api/products`)
- `GET /api/products` - List products with pagination
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `GET /api/products/search` - Search products

### Admin Dashboard (`/api/admin`)
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/dashboard/pending-submissions` - Pending submissions
- `GET /api/admin/dashboard/recent-activity` - Recent activity logs
- `POST /api/admin/update-role` - Update user roles

### Versioned API (`/api/v1`)
- Complete REST API with 16+ endpoints
- Comprehensive product management
- User management and authentication
- Admin and owner tools

## User Roles & Permissions

The system uses **CASL** for fine-grained permission management:

- **newcomer**: Basic user access, can read products
- **contributor**: Can submit product information and reviews
- **trusted_editor**: Can edit existing products and moderate content
- **moderator**: Can approve/reject submissions and moderate users
- **admin**: Full admin access to dashboard and user management
- **owner**: System owner with complete control

## Development

### Available Scripts

```bash
npm run dev          # Start Next.js development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run type-check   # Run TypeScript type checking
npm run format       # Format code with Prettier
npm run test         # Run tests with Vitest
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run check-all    # Run all checks (type, lint, format)
npm run fix-all      # Fix all issues (lint, format)
```

### Development Features

- **Hot Reload**: Instant updates during development
- **TypeScript**: Full type safety across the application
- **ESLint + Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality control
- **Vitest**: Fast testing framework

## Performance Optimizations

### Caching Strategy
- **Redis Integration**: High-performance caching with Redis
- **In-Memory Fallback**: Automatic fallback to in-memory cache
- **Smart Invalidation**: Dependency-based cache invalidation
- **Pagination Caching**: First 2 pages cached for performance

### Database Optimizations
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Optimized Supabase queries
- **Indexing**: Proper database indexing for fast queries
- **RLS Policies**: Row-level security for data protection

## Security Features

### Authentication & Authorization
- **Supabase Auth**: Secure authentication with JWT tokens
- **CASL Permissions**: Fine-grained role-based access control
- **Middleware Protection**: Route-level security
- **Session Management**: Secure session handling with "Remember Me"

### Data Protection
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **XSS Protection**: Content Security Policy and sanitization
- **Rate Limiting**: Protection against abuse

## Troubleshooting

### Common Issues

#### Authentication Issues
1. Verify Supabase project URL and keys in `.env.local`
2. Enable sign-ups in Supabase Dashboard
3. Check authentication settings in Supabase
4. Ensure JWT settings are properly configured

#### Database Connection Issues
1. Verify Supabase credentials
2. Check database schema is properly applied
3. Ensure RLS policies are correctly set up
4. Check network connectivity to Supabase

#### Redis Connection Issues
1. Ensure Redis server is running (optional)
2. Check Redis credentials in `.env.local`
3. System will fall back to in-memory cache if Redis unavailable

#### Environment Variables Not Loading
1. Ensure `.env.local` exists in root directory
2. Check file permissions
3. Restart development server after environment changes

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=supplementiq:*
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Run linting: `npm run lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the documentation in `docs/`
- Review the troubleshooting section above
- Create an issue in the repository

---

**Happy coding!** 🚀