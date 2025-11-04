'use client';

import ColdStartHandler from '@/components/common/ColdStartHandler';
import JWTDashboard from '@/components/features/JWTDashboard';
import { hasRoleAccess } from '@/lib/auth/role-routing';
import { useAuth } from '@/lib/contexts';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { user } = useAuth();
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

  return (
    <ColdStartHandler isLoading={isLoading}>
      {!isAuthenticated || !user ? (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-black">Loading...</div>
        </div>
      ) : (
        <JWTDashboard />
      )}
    </ColdStartHandler>
  );
}