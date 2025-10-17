import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Debug endpoint to check user status
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 Debug: Checking user ${userId}`);
    
    // Check if user exists in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    console.log(`🔍 Debug: Auth user:`, authUser?.user ? `${authUser.user.email} (${authUser.user.id})` : 'None');
    console.log(`🔍 Debug: Auth error:`, authError);
    
    // Check if user exists in users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, role, email, username')
      .eq('id', userId)
      .single();
    
    console.log(`🔍 Debug: DB user:`, dbUser ? `${dbUser.email} (${dbUser.role})` : 'None');
    console.log(`🔍 Debug: DB error:`, dbError);
    
    res.json({
      success: true,
      authUser: authUser?.user ? {
        id: authUser.user.id,
        email: authUser.user.email,
        created_at: authUser.user.created_at
      } : null,
      dbUser,
      authError: authError?.message,
      dbError: dbError?.message
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
