# SupplementIQ

**Transparency engine for supplement industry** - A comprehensive platform providing crowdsourced data with bioavailability calculations and transparency scoring.

## 🏗️ Project Structure

This project follows a monorepo structure with clear separation between frontend and backend:

```
SupplementIQ/
├── frontend/                 # Next.js React application
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   ├── tsconfig.json        # TypeScript config
│   ├── eslint.config.mjs    # ESLint config
│   ├── .prettierrc          # Prettier config
│   └── next.config.ts       # Next.js config
├── backend/                 # Express.js API server
│   ├── routes/              # API routes
│   ├── lib/                 # Server utilities
│   ├── package.json         # Backend dependencies
│   ├── tsconfig.json        # TypeScript config
│   ├── eslint.config.mjs    # ESLint config
│   └── .prettierrc          # Prettier config
├── shared/                  # Shared code between frontend & backend
│   ├── types.ts             # TypeScript types
│   ├── constants.ts         # Shared constants
│   └── validation.ts        # Validation schemas
├── supabase/                # Database & functions
│   ├── migrations/          # Database migrations
│   ├── functions/           # Edge functions
│   └── seed.sql             # Seed data
└── package.json             # Root workspace config
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 8+
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SupplementIQ
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Set up Supabase**
   ```bash
   npm run db:reset
   npm run db:seed
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

This will start both the frontend (http://localhost:3000) and backend (http://localhost:3001) servers.

## 📜 Available Scripts

### Root Level (Workspace)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development |
| `npm run build` | Build both frontend and backend |
| `npm run start` | Start both frontend and backend in production |
| `npm run lint` | Lint both frontend and backend |
| `npm run format` | Format code in both projects |
| `npm run check-all` | Run all checks (type, lint, format) |
| `npm run install:all` | Install dependencies for all projects |
| `npm run clean` | Clean all node_modules and build files |

### Frontend Specific

| Script | Description |
|--------|-------------|
| `npm run dev:frontend` | Start Next.js development server |
| `npm run build:frontend` | Build Next.js for production |
| `npm run start:frontend` | Start Next.js production server |
| `npm run lint:frontend` | Lint frontend code |
| `npm run format:frontend` | Format frontend code |

### Backend Specific

| Script | Description |
|--------|-------------|
| `npm run dev:backend` | Start Express server with hot reload |
| `npm run build:backend` | Compile TypeScript to JavaScript |
| `npm run start:backend` | Start compiled Express server |
| `npm run lint:backend` | Lint backend code |
| `npm run format:backend` | Format backend code |

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context + Custom hooks
- **Database**: Supabase (client-side)

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: Supabase Auth
- **Database**: Supabase (server-side)
- **Validation**: Express Validator
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate limiting

### Shared
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **Deployment**: Vercel (frontend) + Railway/Render (backend)

## 🔧 Development Workflow

### 1. Code Organization

- **Frontend**: All React components, pages, and client-side logic
- **Backend**: API routes, business logic, and server-side operations
- **Shared**: Types, constants, and validation schemas used by both

### 2. Adding New Features

1. **Define types** in `shared/types/` directory
2. **Add validation** in `shared/validation.ts`
3. **Create API endpoint** in `backend/routes/`
4. **Build frontend component** in `frontend/src/`
5. **Test integration** between frontend and backend

### 3. Database Changes

1. **Create migration** in `supabase/migrations/`
2. **Update types** in `shared/types/` directory
3. **Regenerate types**: `npm run db:generate`
4. **Update seed data** if needed

## 🏛️ Architecture

### API Structure

```
/api/v1/
├── auth/                    # Authentication endpoints
│   ├── POST /register       # User registration
│   ├── POST /login          # User login
│   ├── POST /logout         # User logout
│   ├── GET /me              # Get current user
│   └── POST /refresh        # Refresh token
├── products/                # Product management
│   ├── GET /                # List products
│   ├── GET /:id             # Get product details
│   ├── POST /               # Create product
│   ├── PUT /:id             # Update product
│   ├── DELETE /:id          # Delete product
│   └── GET /search/:query   # Search products
├── ingredients/             # Ingredient management
│   ├── GET /                # List ingredients
│   └── GET /:id             # Get ingredient details
├── contributions/           # User contributions
│   ├── GET /                # List contributions
│   ├── POST /               # Create contribution
│   └── POST /:id/vote       # Vote on contribution
├── users/                   # User management
│   ├── GET /profile         # Get user profile
│   ├── PUT /profile         # Update profile
│   └── GET /contributions   # User's contributions
├── rankings/                # Rankings and analytics
│   ├── GET /products        # Product rankings
│   └── GET /ingredients     # Ingredient rankings
└── upload/                  # File uploads
    ├── POST /product-image  # Upload product image
    ├── POST /avatar         # Upload user avatar
    └── DELETE /:bucket/:path # Delete uploaded file
```

### Frontend Structure

```
frontend/src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Authentication routes
│   ├── (admin)/            # Admin dashboard
│   ├── (search)/           # Search and browse
│   ├── (user)/             # User profile and settings
│   └── api/                # Next.js API routes (legacy)
├── components/             # Reusable components
│   ├── features/           # Feature-specific components
│   ├── layout/             # Layout components
│   └── ui/                 # Base UI components
├── lib/                    # Utilities and configurations
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Helper functions
│   └── supabase/           # Supabase client configs
└── types/                  # TypeScript type definitions
```

## 🔒 Security Features

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based access control
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Comprehensive validation on all inputs
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **File Upload**: Secure file handling with type validation
- **SQL Injection**: Protected via Supabase client

## 📊 Code Quality

- **TypeScript**: Strict type checking
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks
- **Lint-staged**: Staged file linting
- **Commitlint**: Conventional commit messages

## 🚀 Deployment

### Frontend (Vercel)
1. Connect repository to Vercel
2. Set environment variables
3. Deploy automatically on push to main

### Backend (Railway/Render)
1. Connect repository
2. Set environment variables
3. Configure build and start commands
4. Deploy automatically

### Database (Supabase)
1. Create Supabase project
2. Run migrations
3. Set up Row Level Security (RLS)
4. Configure API keys

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue or contact the development team.