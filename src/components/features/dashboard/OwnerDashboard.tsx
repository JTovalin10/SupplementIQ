'use client';

import { OwnerModeration, OwnerStats, OwnerTools, OwnerUserManagement } from '@/components/features/dashboard/owner';
import { useDashboard } from '@/lib/contexts';
import { useMemo } from 'react';

export default function OwnerDashboard() {
  const { state } = useDashboard();
  const { activeTab } = state;

  // Memoize the tab content to prevent unnecessary re-renders
  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <OwnerStats />
          </>
        );
      case 'submissions':
        return <OwnerModeration />;
      case 'users':
        return <OwnerUserManagement />;
      case 'system':
        return <OwnerTools />;
    }
  }, [activeTab]);

  return (
    <div className="space-y-8">
      {tabContent}
    </div>
  );
}