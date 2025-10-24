/**
 * Admin Service for SupplementIQ
 * Handles all admin-related API calls
 */

interface AdminApiResponse {
  success: boolean;
  error?: string;
  data?: any;
}

interface ApproveSubmissionParams {
  submissionId: string;
  adminId: string;
  adminNotes?: string;
}

interface RejectSubmissionParams {
  submissionId: string;
  adminId: string;
  reason: string;
}

interface UpdateRoleParams {
  role: string;
}

interface ApproveProductEditParams {
  editId: string;
  adminId: string;
  notes?: string;
}

interface RejectProductEditParams {
  editId: string;
  adminId: string;
  reason: string;
}

/**
 * Approve a product submission
 */
export async function approveSubmission(params: ApproveSubmissionParams): Promise<AdminApiResponse> {
  try {
    const response = await fetch('/api/admin/approve-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to approve submission'
      };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error approving submission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Reject a product submission
 */
export async function rejectSubmission(params: RejectSubmissionParams): Promise<AdminApiResponse> {
  try {
    const response = await fetch('/api/admin/reject-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to reject submission'
      };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error rejecting submission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Update user role
 */
export async function updateUserRole(params: UpdateRoleParams): Promise<AdminApiResponse> {
  try {
    const response = await fetch('/api/admin/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to update role'
      };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error updating role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Approve a product edit
 */
export async function approveProductEdit(params: ApproveProductEditParams): Promise<AdminApiResponse> {
  try {
    const response = await fetch(`/api/admin/edits/${params.editId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminId: params.adminId,
        notes: params.notes
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to approve product edit'
      };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error approving product edit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Reject a product edit
 */
export async function rejectProductEdit(params: RejectProductEditParams): Promise<AdminApiResponse> {
  try {
    const response = await fetch(`/api/admin/edits/${params.editId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminId: params.adminId,
        reason: params.reason
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to reject product edit'
      };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error rejecting product edit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
