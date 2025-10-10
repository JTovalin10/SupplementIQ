# SupplementIQ

A comprehensive supplement database and analysis platform.

## Project Structure

```
├── backend/          # Express.js API server
├── frontend/         # Next.js React application  
├── shared/           # Shared types and utilities
├── supabase/         # Database schema and functions
├── docs/             # Documentation files
├── config/           # Configuration files
├── scripts/          # Build and utility scripts
└── tools/            # Development tools and utilities
```

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Run linting and formatting
npm run lint
npm run format
```

## Development

- **Backend**: Express.js API with TypeScript
- **Frontend**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS

## Documentation

See the `docs/` directory for detailed documentation:
- `README.md` - Main project documentation
- `LINTING.md` - Linting and code quality setup
- `PAGINATION_CACHING.md` - Caching and pagination strategy
- `Journal.md` - Development notes

## Configuration

All configuration files are located in the `config/` directory:
- ESLint configuration
- Prettier configuration  
- TypeScript configuration
- Commitlint configuration
- Environment template

## Scripts

- `npm run dev` - Start both frontend and backend
- `npm run build` - Build all projects
- `npm run lint` - Run linting across all projects
- `npm run format` - Format code with Prettier
- `npm run test` - Run backend tests