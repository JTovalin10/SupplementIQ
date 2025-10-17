import { Crown, Key, Lock, AlertTriangle } from 'lucide-react';

interface OwnerToolsProps {
  onOverridePromote: (userId: string, role: string) => void;
}

export default function OwnerTools({ onOverridePromote }: OwnerToolsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          <span>Owner-Only Tools</span>
        </h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">Override Promotions</h4>
            <p className="text-sm text-black">Bypass contribution requirements for role promotions</p>
            <div className="space-y-2">
              <button
                onClick={() => onOverridePromote('user123', 'moderator')}
                className="w-full px-4 py-2 text-sm font-medium bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 flex items-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>Override Promote to Moderator</span>
              </button>
              <button
                onClick={() => onOverridePromote('user123', 'admin')}
                className="w-full px-4 py-2 text-sm font-medium bg-purple-100 text-purple-800 rounded hover:bg-purple-200 flex items-center space-x-2"
              >
                <Crown className="w-4 h-4" />
                <span>Override Promote to Admin</span>
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">Platform Control</h4>
            <p className="text-sm text-black">Ultimate platform management capabilities</p>
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
