'use client';

import JWTDashboard from '@/components/features/JWTDashboard';
import { useAuth, useUser } from '@/lib/contexts/AppContext';
import { hasRoleAccess } from '@/lib/utils/role-utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { user } = useUser();
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