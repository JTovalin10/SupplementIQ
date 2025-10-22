'use client';

import Button from '@/components/ui/button';
import { useLoading, useNotifications } from '@/lib/contexts/AppStateContext';
import { MODAL_IDS, useModal } from '@/lib/contexts/ModalContext';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';

export default function ContextExampleComponent() {
  const { addNotification } = useNotifications();
  const { setLoading } = useLoading();
  const { preferences, setDashboardLayout } = useUserPreferences();
  const { openModal } = useModal();

  const handleTestNotification = () => {
    addNotification('success', 'This is a test notification!');
  };

  const handleTestLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handleTestModal = () => {
    openModal(MODAL_IDS.HELP, { 
      title: 'Help Modal', 
      content: 'This is a test modal opened via context!' 
    });
  };

  const handleLayoutChange = () => {
    const layouts = ['grid', 'list', 'compact'] as const;
    const currentIndex = layouts.indexOf(preferences.dashboardLayout);
    const nextLayout = layouts[(currentIndex + 1) % layouts.length];
    setDashboardLayout(nextLayout);
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Context Examples</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={handleTestNotification}>
          Test Notification
        </Button>
        
        <Button onClick={handleTestLoading}>
          Test Loading
        </Button>
        
        <Button onClick={handleTestModal}>
          Test Modal
        </Button>
        
        <Button onClick={handleLayoutChange}>
          Change Layout ({preferences.dashboardLayout})
        </Button>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Current Preferences:</h3>
        <pre className="text-sm">{JSON.stringify(preferences, null, 2)}</pre>
      </div>
    </div>
  );
}
