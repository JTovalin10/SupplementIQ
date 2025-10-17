import { Zap, Database } from 'lucide-react';
import type { SystemLog } from '@/lib/services/dashboardService';

interface SystemManagementProps {
  systemLogs: SystemLog[];
  onSystemRestart: () => void;
  onDatabaseBackup: () => void;
}

export default function SystemManagement({ systemLogs, onSystemRestart, onDatabaseBackup }: SystemManagementProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogBadge = (type: string) => {
    switch (type) {
      case 'error':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Error</span>;
      case 'warning':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Warning</span>;
      case 'info':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Info</span>;
      case 'success':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Success</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-black">System Management</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">System Actions</h4>
            <div className="space-y-2">
              <button
                onClick={onSystemRestart}
                className="w-full px-4 py-2 text-sm font-medium bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Restart System</span>
              </button>
              <button
                onClick={onDatabaseBackup}
                className="w-full px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>Backup Database</span>
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">Recent System Logs</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {systemLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    {getLogBadge(log.type)}
                    <span className="text-sm text-black">{log.message}</span>
                  </div>
                  <span className="text-xs text-black">{formatDate(log.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
