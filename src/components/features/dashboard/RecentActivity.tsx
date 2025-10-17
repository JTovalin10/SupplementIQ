import { CheckCircle, FileText, XCircle } from 'lucide-react';
import type { RecentActivity as RecentActivityType } from '@/lib/services/dashboardService';

interface RecentActivityProps {
  activities: RecentActivityType[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-black">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  activity.type === 'approval' ? 'bg-green-100' :
                  activity.type === 'submission' ? 'bg-blue-100' :
                  activity.type === 'edit' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  {activity.type === 'approval' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                   activity.type === 'submission' ? <FileText className="w-4 h-4 text-blue-600" /> :
                   activity.type === 'edit' ? <FileText className="w-4 h-4 text-yellow-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-black">{activity.description}</p>
                  <p className="text-sm text-black">by {activity.user}</p>
                </div>
              </div>
              <span className="text-sm text-black">{formatDate(activity.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
