'use client';

import JWTDashboard from '@/components/features/JWTDashboard';
import { useJWTAuth } from '@/lib/contexts/JWTAuthContext';
import { hasRoleAccess } from '@/lib/utils/role-utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useJWTAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      
      // Check if user has admin access using role hierarchy
      if (user && !hasRoleAccess(user.role, 'admin')) {
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

  // TODO: Replace with database-driven role check
  // if (user.role === 'owner') {
  //   router.push('/owner');
  //   return null;
  // }

  return <JWTDashboard userRole="admin" />;
}