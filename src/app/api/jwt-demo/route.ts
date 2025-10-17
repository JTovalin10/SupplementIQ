import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminJWT,
  createCustomJWT,
  createJWT,
  createModeratorJWT,
  createUserJWT,
  decodeJWT,
  hasPermission,
  isAdmin,
  isModerator,
  verifyJWT
} from '../../../lib/jwt-utils';

/**
 * GET /api/jwt-demo - Demonstrate JWT token creation and manipulation
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with JWT examples
 */
export async function GET(request: NextRequest) {
  try {
    // Create different types of JWT tokens
    const userToken = await createUserJWT('user123', 'user', '24h');
    const adminToken = await createAdminJWT('admin456', 'admin', '1h');
    const moderatorToken = await createModeratorJWT('mod789', '2h');
    
    // Create custom JWT with arbitrary data
    const customToken = await createCustomJWT({
      sub: 'custom123',
      role: 'superuser',
      customData: { department: 'engineering', level: 5 },
      features: ['feature1', 'feature2', 'feature3']
    }, '30m');

    // Verify tokens
    const userVerified = await verifyJWT(userToken);
    const adminVerified = await verifyJWT(adminToken);
    const customVerified = await verifyJWT(customToken);

    // Check permissions
    const userHasWrite = await hasPermission(userToken, 'write');
    const adminHasDelete = await hasPermission(adminToken, 'delete');
    const moderatorHasModerate = await hasPermission(moderatorToken, 'moderate');

    // Check roles
    const isUserAdmin = await isAdmin(userToken);
    const isAdminUser = await isAdmin(adminToken);
    const isModUser = await isModerator(moderatorToken);

    return NextResponse.json({
      success: true,
      message: 'JWT manipulation examples',
      data: {
        tokens: {
          user: userToken,
          admin: adminToken,
          moderator: moderatorToken,
          custom: customToken
        },
        verification: {
          user: userVerified,
          admin: adminVerified,
          custom: customVerified
        },
        permissions: {
          user_write: userHasWrite,
          admin_delete: adminHasDelete,
          moderator_moderate: moderatorHasModerate
        },
        roles: {
          user_is_admin: isUserAdmin,
          admin_is_admin: isAdminUser,
          moderator_is_moderator: isModUser
        }
      }
    });

  } catch (error) {
    console.error('JWT demo error:', error);
    return NextResponse.json({ error: 'Failed to demonstrate JWT functions' }, { status: 500 });
  }
}

/**
 * POST /api/jwt-demo - Create a custom JWT token
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with created JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payload, expiresIn = '1h' } = body;

    if (!payload) {
      return NextResponse.json({ error: 'Payload is required' }, { status: 400 });
    }

    const token = await createJWT(payload, expiresIn);
    const decoded = decodeJWT(token); // Decode without verification for demo

    return NextResponse.json({
      success: true,
      data: {
        token,
        decoded,
        expiresIn
      }
    });

  } catch (error) {
    console.error('JWT creation error:', error);
    return NextResponse.json({ error: 'Failed to create JWT token' }, { status: 500 });
  }
}


