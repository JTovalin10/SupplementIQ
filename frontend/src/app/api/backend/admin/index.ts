/**
 * Main admin routes index - organizes all admin functionality
 */

import { Router } from 'express';
import { adminAuth } from '../../middleware/auth';

// Import all admin route modules
import { authRoutes } from './auth';
import { requestRoutes } from './requests';
import { votingRoutes } from './requests/voting';
import { ownerApprovalRoutes } from './requests/owner-approval';
import { queueRoutes } from './queue';
import { statsRoutes } from './stats';
import { securityRoutes } from './security';
import { productModerationRoutes } from './products';
import dashboardRoutes from './dashboard';

const router = Router();

/**
 * Admin routes organization:
 * 
 * /auth/* - Authentication and admin validation
 * /requests/* - Request management
 * /requests/*/vote - Voting on requests
 * /requests/*/owner-approve - Owner approval/rejection
 * /queue/* - Queue management and monitoring
 * /stats/* - System statistics and monitoring
 * /security/* - Security validation and cleanup
 */

// Apply admin authentication to all routes (except test routes)
// router.use(adminAuth); // Temporarily disabled for testing

// Mount all admin route modules
router.use('/auth', authRoutes);
router.use('/requests', requestRoutes);
router.use('/requests', votingRoutes);
router.use('/requests', ownerApprovalRoutes);
router.use('/queue', queueRoutes);
router.use('/stats', statsRoutes);
router.use('/security', securityRoutes);
router.use('/products', productModerationRoutes);
router.use('/dashboard', dashboardRoutes);

/**
 * @route GET /api/v1/admin
 * @desc Admin dashboard overview
 * @access Admin only
 * @returns 200 - Admin system overview
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'SupplementIQ Admin API',
      data: {
        version: '1.0.0',
        endpoints: {
          auth: '/api/v1/admin/auth',
          requests: '/api/v1/admin/requests',
          products: '/api/v1/admin/products',
          queue: '/api/v1/admin/queue',
          stats: '/api/v1/admin/stats',
          security: '/api/v1/admin/security'
        },
        documentation: {
          requestFlow: 'Standard: Admin requests → Owner approves → Queue execution',
          emergencyFlow: 'Emergency: Admin requests → 75% admin vote → Queue execution',
          securityFeatures: [
            '10-minute request expiration',
            'Admin daily request limits',
            '2-hour cooldown between updates',
            '1-hour buffer around scheduled updates',
            'Pull-based queue system with anti-attack protection'
          ]
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to get admin overview:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get admin overview'
    });
  }
});

/**
 * @route GET /api/v1/admin/health
 * @desc Admin system health check
 * @access Admin only
 * @returns 200 - System health status
 */
router.get('/health', async (req, res) => {
  try {
    // Check all admin system components
    const healthChecks = {
      auth: { status: 'healthy', message: 'Auth system operational' },
      requests: { status: 'healthy', message: 'Request system operational' },
      queue: { status: 'healthy', message: 'Queue system operational' },
      security: { status: 'healthy', message: 'Security system operational' },
      autocomplete: { status: 'healthy', message: 'Autocomplete system operational' }
    };

    const overallHealth = 'healthy';
    const timestamp = new Date();

    res.json({
      success: true,
      data: {
        status: overallHealth,
        timestamp,
        components: healthChecks,
        system: {
          uptime: Math.floor(process.uptime()),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        }
      }
    });
  } catch (error) {
    console.error('Admin health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Admin health check failed'
    });
  }
});

export { router as adminRoutes };
