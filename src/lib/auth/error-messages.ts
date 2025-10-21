// Authentication error message mapping
// Provides user-friendly error messages for common authentication scenarios

export interface AuthError {
  code: string;
  message: string;
  userFriendlyMessage: string;
  category: 'validation' | 'authentication' | 'authorization' | 'network' | 'server';
}

export const AUTH_ERRORS: Record<string, AuthError> = {
  // Validation Errors
  'INVALID_EMAIL': {
    code: 'INVALID_EMAIL',
    message: 'Invalid email format',
    userFriendlyMessage: 'Please enter a valid email address',
    category: 'validation'
  },
  'PASSWORD_TOO_SHORT': {
    code: 'PASSWORD_TOO_SHORT',
    message: 'Password must be at least 8 characters',
    userFriendlyMessage: 'Password must be at least 8 characters long',
    category: 'validation'
  },
  'PASSWORD_MISMATCH': {
    code: 'PASSWORD_MISMATCH',
    message: 'Passwords do not match',
    userFriendlyMessage: 'Passwords do not match. Please try again',
    category: 'validation'
  },
  'USERNAME_TOO_SHORT': {
    code: 'USERNAME_TOO_SHORT',
    message: 'Username must be at least 3 characters',
    userFriendlyMessage: 'Username must be at least 3 characters long',
    category: 'validation'
  },
  'USERNAME_TAKEN': {
    code: 'USERNAME_TAKEN',
    message: 'Username is already taken',
    userFriendlyMessage: 'This username is already taken. Please choose a different one',
    category: 'validation'
  },
  'MISSING_FIELDS': {
    code: 'MISSING_FIELDS',
    message: 'Required fields are missing',
    userFriendlyMessage: 'Please fill in all required fields',
    category: 'validation'
  },

  // Authentication Errors
  'INVALID_CREDENTIALS': {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    userFriendlyMessage: 'Invalid email or password. Please check your credentials and try again',
    category: 'authentication'
  },
  'USER_NOT_FOUND': {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
    userFriendlyMessage: 'No account found with this email address',
    category: 'authentication'
  },
  'ACCOUNT_NOT_CONFIRMED': {
    code: 'ACCOUNT_NOT_CONFIRMED',
    message: 'Email not confirmed',
    userFriendlyMessage: 'Please check your email and click the confirmation link before signing in',
    category: 'authentication'
  },
  'ACCOUNT_DISABLED': {
    code: 'ACCOUNT_DISABLED',
    message: 'Account is disabled',
    userFriendlyMessage: 'Your account has been disabled. Please contact support',
    category: 'authentication'
  },

  // Authorization Errors
  'INSUFFICIENT_PERMISSIONS': {
    code: 'INSUFFICIENT_PERMISSIONS',
    message: 'Insufficient permissions',
    userFriendlyMessage: 'You do not have permission to perform this action',
    category: 'authorization'
  },
  'ACCOUNT_SUSPENDED': {
    code: 'ACCOUNT_SUSPENDED',
    message: 'Account is suspended',
    userFriendlyMessage: 'Your account has been suspended. Please contact support for assistance',
    category: 'authorization'
  },

  // Network Errors
  'NETWORK_ERROR': {
    code: 'NETWORK_ERROR',
    message: 'Network error',
    userFriendlyMessage: 'Unable to connect to the server. Please check your internet connection and try again',
    category: 'network'
  },
  'TIMEOUT': {
    code: 'TIMEOUT',
    message: 'Request timeout',
    userFriendlyMessage: 'The request timed out. Please try again',
    category: 'network'
  },

  // Server Errors
  'SERVER_ERROR': {
    code: 'SERVER_ERROR',
    message: 'Internal server error',
    userFriendlyMessage: 'Something went wrong on our end. Please try again later',
    category: 'server'
  },
  'DATABASE_ERROR': {
    code: 'DATABASE_ERROR',
    message: 'Database error',
    userFriendlyMessage: 'We are experiencing technical difficulties. Please try again later',
    category: 'server'
  },
  'ACCOUNT_CREATION_FAILED': {
    code: 'ACCOUNT_CREATION_FAILED',
    message: 'Failed to create account',
    userFriendlyMessage: 'Unable to create your account. Please try again or contact support',
    category: 'server'
  },

  // Supabase Specific Errors
  'EMAIL_ALREADY_EXISTS': {
    code: 'EMAIL_ALREADY_EXISTS',
    message: 'Email already exists',
    userFriendlyMessage: 'An account with this email already exists. Try signing in instead',
    category: 'authentication'
  },
  'USERNAME_ALREADY_EXISTS': {
    code: 'USERNAME_ALREADY_EXISTS',
    message: 'Username already exists',
    userFriendlyMessage: 'This username is already taken. Please choose a different one',
    category: 'validation'
  },
  'WEAK_PASSWORD': {
    code: 'WEAK_PASSWORD',
    message: 'Password is too weak',
    userFriendlyMessage: 'Password is too weak. Please choose a stronger password with at least 8 characters',
    category: 'validation'
  },
  'INVALID_PASSWORD': {
    code: 'INVALID_PASSWORD',
    message: 'Invalid password format',
    userFriendlyMessage: 'Password does not meet security requirements',
    category: 'validation'
  }
};

/**
 * Maps Supabase error messages to user-friendly messages
 */
export function mapSupabaseError(errorMessage: string): string {
  const lowerError = errorMessage.toLowerCase();
  
  // Email already exists
  if (lowerError.includes('user already registered') || lowerError.includes('email already exists')) {
    return AUTH_ERRORS.EMAIL_ALREADY_EXISTS.userFriendlyMessage;
  }
  
  // Weak password
  if (lowerError.includes('password should be at least') || lowerError.includes('weak password')) {
    return AUTH_ERRORS.WEAK_PASSWORD.userFriendlyMessage;
  }
  
  // Invalid email
  if (lowerError.includes('invalid email') || lowerError.includes('email format')) {
    return AUTH_ERRORS.INVALID_EMAIL.userFriendlyMessage;
  }
  
  // Account not confirmed
  if (lowerError.includes('email not confirmed') || lowerError.includes('confirm your email')) {
    return AUTH_ERRORS.ACCOUNT_NOT_CONFIRMED.userFriendlyMessage;
  }
  
  // Invalid credentials
  if (lowerError.includes('invalid login credentials') || lowerError.includes('invalid credentials')) {
    return AUTH_ERRORS.INVALID_CREDENTIALS.userFriendlyMessage;
  }
  
  // Default fallback
  return errorMessage;
}

/**
 * Maps NextAuth error codes to user-friendly messages
 */
export function mapNextAuthError(errorCode: string): string {
  switch (errorCode) {
    case 'CredentialsSignin':
      return AUTH_ERRORS.INVALID_CREDENTIALS.userFriendlyMessage;
    case 'CallbackRouteError':
      return AUTH_ERRORS.SERVER_ERROR.userFriendlyMessage;
    case 'Configuration':
      return AUTH_ERRORS.SERVER_ERROR.userFriendlyMessage;
    case 'AccessDenied':
      return AUTH_ERRORS.INSUFFICIENT_PERMISSIONS.userFriendlyMessage;
    case 'Verification':
      return AUTH_ERRORS.ACCOUNT_NOT_CONFIRMED.userFriendlyMessage;
    default:
      return AUTH_ERRORS.SERVER_ERROR.userFriendlyMessage;
  }
}

/**
 * Gets a user-friendly error message for any error
 */
export function getUserFriendlyError(error: any): string {
  if (typeof error === 'string') {
    // Check if it's a known error code
    if (AUTH_ERRORS[error]) {
      return AUTH_ERRORS[error].userFriendlyMessage;
    }
    
    // Try to map Supabase errors
    return mapSupabaseError(error);
  }
  
  if (error?.code && AUTH_ERRORS[error.code]) {
    return AUTH_ERRORS[error.code].userFriendlyMessage;
  }
  
  if (error?.message) {
    return mapSupabaseError(error.message);
  }
  
  return AUTH_ERRORS.SERVER_ERROR.userFriendlyMessage;
}
