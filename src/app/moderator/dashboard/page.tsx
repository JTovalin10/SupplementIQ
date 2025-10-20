'use client';

import JWTDashboard from '@/components/features/JWTDashboard';
import { useNextAuth } from '@/lib/contexts/NextAuthContext';
import { hasRoleAccess } from '@/lib/utils/role-utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ModeratorDashboardPage() {
  const { user, isAuthenticated, isLoading } = useNextAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      
      // Check if user has moderator access or higher
      if (user && !hasRoleAccess(user.role, 'moderator')) {
        router.push('/');
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-black">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Use the user's actual role from Supabase auth
  return <JWTDashboard userRole={user.role as 'moderator' | 'admin' | 'owner'} />;
}
