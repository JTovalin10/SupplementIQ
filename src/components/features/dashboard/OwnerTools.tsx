import { useAdmin } from '@/lib/contexts/AppContext';
import { AlertTriangle, Crown, Key, Lock } from 'lucide-react';

interface OwnerToolsProps {
  // No longer needed - admin functions come from context
}

export default function OwnerTools({}: OwnerToolsProps) {
  const { handleOverridePromote, isProcessing } = useAdmin();
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          <span>Owner-Only Tools</span>
        </h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Override Promotions</h4>
            <p className="text-sm text-gray-700">Bypass contribution requirements for role promotions</p>
            <div className="space-y-2">
              <button
                onClick={() => handleOverridePromote('user123', 'moderator')}
                disabled={isProcessing}
                className="w-full px-4 py-2 text-sm font-medium bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{isProcessing ? 'Processing...' : 'Override Promote to Moderator'}</span>
              </button>
              <button
                onClick={() => handleOverridePromote('user123', 'admin')}
                disabled={isProcessing}
                className="w-full px-4 py-2 text-sm font-medium bg-purple-100 text-purple-800 rounded hover:bg-purple-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <Crown className="w-4 h-4" />
                <span>Override Promote to Admin</span>
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Platform Control</h4>
            <p className="text-sm text-gray-700">Ultimate platform management capabilities</p>
            <div className="space-y-2">
              <button
                onClick={() => console.log('Transfer ownership')}
                className="w-full px-4 py-2 text-sm font-medium bg-red-100 text-red-800 rounded hover:bg-red-200 flex items-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>Transfer Ownership</span>
              </button>
              <button
                onClick={() => console.log('Platform shutdown')}
                className="w-full px-4 py-2 text-sm font-medium bg-red-100 text-red-800 rounded hover:bg-red-200 flex items-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Emergency Shutdown</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
