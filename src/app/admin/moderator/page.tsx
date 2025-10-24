'use client';

import JWTDashboard from '@/components/features/JWTDashboard';
import { hasRoleAccess } from '@/lib/auth/role-routing';
import { useAuth } from '@/lib/contexts';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ModeratorDashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { user } = useAuth();
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // No need to pass userRole - it comes from context
  return <JWTDashboard />;
}
