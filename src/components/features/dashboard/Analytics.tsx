interface AnalyticsProps {
  stats: {
    totalUsers: number;
    totalProducts: number;
    systemHealth?: number;
    databaseSize?: string;
    apiCalls?: number;
  };
  isOwner: boolean;
}

export default function Analytics({ stats, isOwner }: AnalyticsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-black">Platform Analytics</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-black mb-2">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-black">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-black mb-2">{stats.totalProducts}</div>
            <div className="text-sm text-black">Products Added</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-black mb-2">89%</div>
            <div className="text-sm text-black">Approval Rate</div>
          </div>
          {isOwner && (
            <>
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-2">{stats.apiCalls?.toLocaleString()}</div>
                <div className="text-sm text-black">API Calls Today</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-2">98%</div>
                <div className="text-sm text-black">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-2">{stats.databaseSize}</div>
                <div className="text-sm text-black">Database Size</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
