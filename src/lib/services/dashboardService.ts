// Dashboard service types

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalSubmissions: number;
  approvedProducts: number;
  pendingProducts: number;
  pendingSubmissions: number;
  pendingEdits: number;
  rejectedProducts: number;
  totalReviews: number;
  totalContributions: number;
  activeUsers: number;
  recentActivity: number;
  systemHealth: number; // percentage
  databaseSize: string;
  apiCalls?: number;
}

export interface SystemLog {
  id: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  timestamp: string;
  source?: string;
}
