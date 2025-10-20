import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

/**
 * Utility function to refresh user session after role updates
 * Call this after updating a user's role in the database
 */
export async function refreshUserSession(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id === userId) {
      // Trigger session update to refresh JWT with new role
      // This will cause the JWT callback to run and fetch fresh role data
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing user session:', error);
    return false;
  }
}

/**
 * Client-side function to refresh session
 * Use this in components after role updates
 */
export async function refreshSession() {
  try {
    const response = await fetch('/api/auth/session?update=true');
    if (response.ok) {
      // Reload the page to get fresh session data
      window.location.reload();
    }
  } catch (error) {
    console.error('Error refreshing session:', error);
  }
}
