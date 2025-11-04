import { supabase } from '@/lib/database/supabase/client';
import { useSupabaseWithColdStart } from '@/lib/hooks/useSupabaseWithColdStart';
import type { User } from '@supabase/supabase-js';
import { calculatePermissions } from './permissions';
import type { UserProfile } from './types';

export function useUserProfile() {
  const { executeSupabaseOperation } = useSupabaseWithColdStart();
  const activeFetches = new Map<string, Promise<any>>();

  const fetchUserProfile = async (
    authUser: User,
    profileCache: Map<string, UserProfile>,
    setUser: (user: UserProfile | null) => void,
    setPermissions: (permissions: any) => void,
    setIsLoading: (loading: boolean) => void,
    setProfileCache: (cache: Map<string, UserProfile>) => void
  ): Promise<boolean> => {
    const startTime = Date.now();
    console.log('⏱️ [PROFILE] Starting profile fetch for user:', authUser.id);
    
    try {
      // Check cache first
      const cachedProfile = profileCache.get(authUser.id);
      if (cachedProfile) {
        console.log('✅ [PROFILE] Using cached profile');
        setUser(cachedProfile);
        setPermissions(calculatePermissions(cachedProfile.role));
        setIsLoading(false);
        return true;
      }
      
      // Prevent duplicate fetches for the same user
      if (activeFetches.has(authUser.id)) {
        console.log('⏱️ [PROFILE] Fetch already in progress, waiting...');
        await activeFetches.get(authUser.id);
        return true;
      }
      
      console.log('⏱️ [PROFILE] Cache miss, fetching from database...');
      
      // Track this fetch to prevent duplicates
      activeFetches.set(authUser.id, Promise.resolve());
      
      // Use cold start handler for profile fetch
      const dbStartTime = Date.now();
      const { data: profile, error } = await executeSupabaseOperation(
        async () => {
          console.log('⏱️ [PROFILE] Executing database query...');
          const queryStartTime = Date.now();
          const result = await supabase
            .from('users')
            .select('role, username, bio, reputation_points, created_at')
            .eq('id', authUser.id)
            .single();
          console.log(`⏱️ [PROFILE] Database query took ${Date.now() - queryStartTime}ms`);
          return result;
        },
        'User Profile Fetch'
      );
      console.log(`⏱️ [PROFILE] Database fetch took ${Date.now() - dbStartTime}ms`);

      if (error) {
        console.error('Profile fetch error:', error.message);
        
        // Handle timeout specifically
        if (error.message === 'Profile fetch timeout') {
          console.warn('⚠️ Profile fetch timeout - using cached/default data');
          // Create a minimal user profile to prevent indefinite loading
          const minimalProfile = {
            id: authUser.id,
            email: authUser.email || '',
            role: 'user', // Default role
            username: authUser.email?.split('@')[0] || 'user',
            bio: '',
            reputation_points: 0,
            created_at: new Date().toISOString()
          };
          setUser(minimalProfile);
          setPermissions(calculatePermissions('user'));
          setIsLoading(false);
          return true;
        }
        
        // If user not found, return false - profile should only be created during signup
        if (error.code === 'PGRST116') {
          console.error('❌ User profile not found in database. User must sign up first.');
          setUser(null);
          setPermissions(null);
          setIsLoading(false);
          return false;
        }
        
        // For other database errors, also fail
        console.error('❌ Database error during profile fetch:', error);
        setUser(null);
        setPermissions(null);
        setIsLoading(false);
        return false;
      }

      // Profile found successfully
      const userProfile = {
        id: authUser.id,
        email: authUser.email || '',
        role: profile.role,
        username: profile.username,
        bio: profile.bio,
        reputation_points: profile.reputation_points,
        created_at: profile.created_at
      };

      setUser(userProfile);
      setPermissions(calculatePermissions(userProfile.role));
      setIsLoading(false);
      setProfileCache(new Map(profileCache).set(authUser.id, userProfile));
      
      console.log(`✅ [PROFILE] Profile fetched successfully in ${Date.now() - startTime}ms`);
      return true;
    } catch (error) {
      console.error('❌ Unexpected error in fetchUserProfile:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Non-Error object:', error);
      }
      
      // Fallback to default profile with newcomer role
      const defaultProfile = {
        id: authUser.id,
        email: authUser.email || '',
        role: 'newcomer', // Safe default role
        username: authUser.email?.split('@')[0] || 'user',
        bio: '',
        reputation_points: 0, // Safe default reputation
        created_at: new Date().toISOString(),
      };
      
      console.log('🔧 Using fallback profile with newcomer role');
      setUser(defaultProfile);
      setPermissions(calculatePermissions('newcomer'));
      
      // Cache the fallback profile
      setProfileCache(new Map(profileCache).set(authUser.id, defaultProfile));
      
      return false; // Profile fetch failed
    } finally {
      setIsLoading(false);
      activeFetches.delete(authUser.id);
    }
  };

  return { fetchUserProfile };
}
