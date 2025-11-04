import type { Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  username: string;
  bio?: string;
  reputation_points: number;
  created_at: string;
}

export interface UserPermissions {
  canViewPending: boolean;
  canApproveSubmissions: boolean;
  canApproveEdits: boolean;
  canBanUsers: boolean;
  canRequestDeletion: boolean;
  canDeleteDirectly: boolean;
  canAccessAdminPanel: boolean;
  canAccessModeratorPanel: boolean;
  canAccessOwnerTools: boolean;
}

export interface AdminAction {
  type: 'override_promote' | 'approve_submission' | 'reject_submission' | 'approve_product_edit' | 'reject_product_edit';
  userId?: string;
  targetRole?: string;
  submissionId?: string;
  editId?: string;
  notes?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: UserPermissions | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Admin actions
  handleOverridePromote: (userId: string, targetRole: string) => Promise<void>;
  handleApproveSubmission: (submissionId: string, notes?: string) => Promise<void>;
  handleRejectSubmission: (submissionId: string, reason: string) => Promise<void>;
  handleApproveProductEdit: (editId: string, notes?: string) => Promise<void>;
  handleRejectProductEdit: (editId: string, reason: string) => Promise<void>;
  
  // Admin state
  isProcessing: boolean;
  lastAction: AdminAction | null;
  
  // Cold start handling
  isRetrying: boolean;
  showColdStartMessage: boolean;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
