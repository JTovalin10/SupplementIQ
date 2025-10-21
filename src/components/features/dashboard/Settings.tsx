import { useUser } from '@/lib/contexts/AppContext';

interface SettingsProps {
  // No longer needed - user permissions come from context
}

export default function Settings({}: SettingsProps) {
  const { permissions } = useUser();
  const isOwner = permissions?.canAccessOwnerTools || false;
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Platform Settings</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-approval threshold
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900">
              <option>Manual review required</option>
              <option>100+ contributions</option>
              <option>500+ contributions</option>
              <option>1000+ contributions</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily update time
            </label>
            <input
              type="time"
              defaultValue="12:00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>
          {isOwner && (
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Rate limiting (requests per minute)
              </label>
              <input
                type="number"
                defaultValue="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
