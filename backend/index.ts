/**
 * Load environment variables from .env.local file FIRST
 * Reads configuration values for database, API keys, and server settings
 */
import dotenv from 'dotenv';

// Load .env.local file explicitly from current working directory
dotenv.config({ path: '.env.local' });

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import next from 'next';
import { parse } from 'url';
import { apiRoutes } from './routes';

// Environment configuration
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app (pointing to frontend directory)
const nextApp = next({ dev, hostname, port, dir: '../frontend' });
const handle = nextApp.getRequestHandler();

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Express app configuration
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: dev 
    ? ['http://localhost:3000', 'http://localhost:3001']
    : [process.env.FRONTEND_URL || 'https://supplementiq.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(dev ? 'dev' : 'combined'));

// Rate limiting
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Health check endpoint
 * Returns server status and system information for monitoring and load balancers
 * 
 * @requires No request parameters or body required
 * 
 * @returns 200 - Success response containing:
 *   - status: "healthy" - Server health status
 *   - timestamp: Current server timestamp in ISO format
 *   - uptime: Server uptime in seconds since startup
 *   - environment: Current NODE_ENV value (development/production)
 * 
 * @throws None - Always returns 200 with status information
 * 
 * @example
 * GET /health
 * Response: {
 *   "status": "healthy",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "uptime": 3600.5,
 *   "environment": "development"
 * }
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Mount API routes
console.log('🔄 Mounting API routes...');
app.use(apiRoutes);
console.log('✅ API routes mounted');

// Test route to verify API is working
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

/**
 * Global error handling middleware
 * Catches and handles all unhandled errors in the Express application
 * 
 * @requires err - Error object thrown by previous middleware/routes
 * @requires req - Express request object
 * @requires res - Express response object  
 * @requires next - Express next function
 * 
 * @returns void - Sends error response to client
 * 
 * @throws 500 - Internal server error with error details
 * 
 * @example
 * // Automatically triggered by Express when an error is thrown
 * // Returns appropriate error response based on environment
 */
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express Error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: dev ? err.message : 'Something went wrong',
    ...(dev && { stack: err.stack }),
  });
});

/**
 * 404 handler for API routes
 * Returns standardized error response for non-existent API endpoints
 * 
 * @requires req - Express request object containing the requested path
 * @requires res - Express response object
 * 
 * @returns 404 - Not found response containing:
 *   - error: "API endpoint not found"
 *   - path: The requested API path that was not found
 * 
 * @throws None - Always returns 404 with path information
 * 
 * @example
 * GET /api/nonexistent
 * Response: {
 *   "error": "API endpoint not found",
 *   "path": "/api/nonexistent"
 * }
 */
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
  });
});

/**
 * Start the Express server with Next.js integration
 * Initializes the server, prepares Next.js app, and sets up request handling
 * 
 * @requires Environment variables:
 *   - PORT: Server port (default: 3000)
 *   - HOSTNAME: Server hostname (default: localhost)
 *   - NODE_ENV: Environment mode (development/production)
 * 
 * @returns void - Starts the server and logs startup information
 * 
 * @throws ProcessExit(1) - If server startup fails
 * 
 * @example
 * // Automatically called at module load
 * // Starts server on configured port with Next.js integration
 */
async function startServer() {
  try {
    console.log('🔄 Preparing Next.js app...');
    await nextApp.prepare();
    console.log('✅ Next.js app prepared successfully');
    
    console.log('🔄 Creating HTTP server...');
    const server = createServer(app);
    console.log('✅ HTTP server created');
    
    // Handle Next.js requests
    app.all('*', (req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });
    
    console.log('🔄 About to start server listening...');
    server.listen(port, () => {
      console.log(`🚀 Server ready on http://${hostname}:${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔧 Development mode: ${dev}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
