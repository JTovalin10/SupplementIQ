/**
 * Admin route types and interfaces
 */

export interface ProductDetails {
  name: string;
  brand_name: string;
  flavor?: string;
  description?: string;
  category?: string;
  ingredients?: string[];
  serving_size?: string;
  price?: number;
  availability?: string;
  image_url?: string;
  nutrition_facts?: Record<string, any>;
}

export interface UpdateRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestType: 'force_update' | 'democratic_update';
  reason?: string; // Optional reason for the update request
  votes: Record<string, 'approve' | 'reject'>;
  voteCount: number;
  approveCount: number;
  rejectCount: number;
  ownerApproved: boolean;
  ownerApprovedBy?: string;
  ownerApprovedAt?: Date;
  expiresAt: Date;
}

export interface ProductSubmissionRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'queued_for_insertion';
  productDetails: ProductDetails;
  reviewNotes?: string;
  adminReviewedBy?: string;
  adminReviewedAt?: Date;
  expiresAt: Date;
}

export interface QueuedProductInsert {
  id: string;
  originalRequestId: string;
  productDetails: ProductDetails;
  approvedBy: string;
  approvedAt: Date;
  scheduledInsertionTime: Date;
}

export interface AdminStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  expiredRequests: number;
  democraticUpdatesUsedToday: boolean;
  lastDemocraticUpdateDate: string;
}

export interface QueueStats {
  queueSize: number;
  isProcessing: boolean;
  lastProcessedAt?: Date;
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
}

export interface SecurityStats {
  totalRequestsToday: number;
  adminRequestCounts: Record<string, number>;
  canMakeRequest: boolean;
  hasAdminMadeRequestToday: boolean;
  currentTimestamp: number;
  dayStartTimestamp: number;
}

export interface AutocompleteStats {
  productCount: number;
  brandCount: number;
  isUpdating: boolean;
  lastUpdateTime?: Date;
  serverUptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  nodeVersion: string;
}

export interface VoteDetails {
  adminId: string;
  adminName: string;
  vote: 'approve' | 'reject';
  timestamp: Date;
}

export interface RequestVotingDetails {
  totalVotes: number;
  approveVotes: number;
  rejectVotes: number;
  votes: VoteDetails[];
  needsApproval: boolean;
  approvalPercentage: number;
}
