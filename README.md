# SupplementIQ

The transparency engine for the supplement industry. Discover real protein content, transparency scores, and make informed supplement choices.

## Features

- 🔍 **Product Search & Discovery**: Browse supplements by category with advanced filtering
- 📊 **Transparency Scoring**: Real protein content and bioavailability calculations
- 👥 **Community-Driven**: Wikipedia-style editing with community verification
- 💰 **Cost Efficiency**: Compare products by cost per effective gram of protein
- 🛡️ **Admin Dashboard**: Comprehensive admin and owner management tools
- 🔐 **Role-Based Access**: Secure authentication with Supabase

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase** for authentication
- **React Context** for state management

### Backend
- **Express.js** API server
- **TypeScript** for type safety
- **Supabase** for database and auth
- **C++ Addons** for performance-critical services
- **Node.js** with ts-node for development

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SupplementIQ
```

### 2. Environment Configuration

#### Backend Environment
Create a `.env.local` file in the `backend/` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NODE_ENV=development
PORT=3002
HOSTNAME=localhost
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SupplementIQ
FRONTEND_URL=http://localhost:3000

# Cache Configuration
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# Development
DEBUG=supplementiq:*
```

#### Frontend Environment
Create a `.env.local` file in the `frontend/` directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 4. Database Setup

#### Supabase Configuration
1. Create a new Supabase project
2. Enable authentication in Supabase Dashboard
3. Set up the database schema (see `supabase/schema.sql`)
4. Configure authentication settings:
   - Enable email/password authentication
   - Enable sign-ups in Authentication Settings

### 5. Start the Development Servers

#### Backend Server
```bash
cd backend
npm run dev
```
The backend will start on `http://localhost:3002`

#### Frontend Server
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:3000`

## Project Structure

```
SupplementIQ/
├── backend/                 # Express.js API server
│   ├── lib/                # Core services and utilities
│   ├── routes/             # API route handlers
│   ├── middleware/         # Authentication and validation
│   ├── tools/              # C++ addons and performance tools
│   └── .env.local          # Backend environment variables
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities and services
│   └── .env.local         # Frontend environment variables
├── shared/                 # Shared types and utilities
├── supabase/              # Database schema and migrations
└── docs/                  # Documentation
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Admin Dashboard
- `GET /api/v1/admin/dashboard/stats` - Dashboard statistics
- `GET /api/v1/admin/dashboard/pending-submissions` - Pending submissions
- `GET /api/v1/admin/dashboard/recent-activity` - Recent activity logs

### Products
- `GET /api/v1/products` - List products
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

## User Roles

- **newcomer**: Basic user access
- **contributor**: Can submit product information
- **trusted_editor**: Can edit existing products
- **moderator**: Can approve/reject submissions
- **admin**: Full admin access to dashboard
- **owner**: System owner with full control

## Development

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
```

#### Frontend
```bash
npm run dev          # Start Next.js development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
```

### C++ Addons

The backend includes C++ addons for performance-critical operations:
- **AutocompleteService**: Fast product search
- **SecurityTree**: Security and validation
- **DailyUpdateService**: Scheduled data updates

These are optional and the system will fall back to TypeScript implementations if C++ addons are not available.

## Troubleshooting

### Common Issues

#### Backend Won't Start
1. Check if port 3002 is available: `lsof -ti:3002`
2. Kill any existing processes: `kill -9 <PID>`
3. Ensure `.env.local` exists in `backend/` directory
4. Verify Supabase credentials are correct

#### Frontend Proxy Issues
1. Ensure backend is running on port 3002
2. Check `frontend/next.config.ts` proxy configuration
3. Restart frontend server after backend changes

#### Authentication Issues
1. Verify Supabase project URL and keys
2. Enable sign-ups in Supabase Dashboard
3. Check authentication settings in Supabase

#### Environment Variables Not Loading
1. Ensure `.env.local` files are in correct directories
2. Check file permissions
3. Restart servers after environment changes

### Port Conflicts

If you encounter port conflicts:
- Backend: Change `PORT=3002` in `backend/.env.local`
- Frontend: Change port in `frontend/package.json` scripts
- Update proxy configuration in `frontend/next.config.ts`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the documentation in `docs/`
- Review the troubleshooting section above
- Create an issue in the repository

---

**Happy coding!** 🚀