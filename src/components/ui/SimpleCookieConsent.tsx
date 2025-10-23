'use client';

import { Cookie, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CookieConsentProps {
  onConsentChange?: (consent: boolean) => void;
}

/**
 * Simple cookie consent banner using browser's built-in cookie handling
 * Works with Supabase's automatic cookie management
 */
export default function CookieConsentBanner({ onConsentChange }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice using localStorage (simpler than cookies)
    const hasConsent = localStorage.getItem('cookie-consent');
    
    if (!hasConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-preferences', JSON.stringify({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    }));
    
    setIsVisible(false);
    onConsentChange?.(true);
    
    console.log('✅ User accepted cookies');
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    localStorage.setItem('cookie-preferences', JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    }));
    
    setIsVisible(false);
    onConsentChange?.(false);
    
    console.log('❌ User declined cookies');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Cookie Icon */}
          <div className="flex-shrink-0">
            <Cookie className="h-8 w-8 text-blue-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              We use cookies to enhance your experience
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              We use cookies for authentication, preferences, and analytics. 
              Supabase handles authentication cookies automatically and securely.
            </p>
            
            {/* Privacy Notice */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Your data is secure with Supabase</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple hook to check cookie consent status
 */
export function useCookieConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [consentChoice, setConsentChoice] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<any>(null);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    const prefs = localStorage.getItem('cookie-preferences');
    
    setHasConsent(!!consent);
    setConsentChoice(consent);
    
    if (prefs) {
      try {
        setPreferences(JSON.parse(prefs));
      } catch (error) {
        console.warn('Failed to parse cookie preferences:', error);
        setPreferences(null);
      }
    }
  }, []);

  const updateConsent = (choice: 'accepted' | 'declined', prefs?: any) => {
    localStorage.setItem('cookie-consent', choice);
    
    if (prefs) {
      localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
      setPreferences(prefs);
    }
    
    setHasConsent(true);
    setConsentChoice(choice);
  };

  const resetConsent = () => {
    localStorage.removeItem('cookie-consent');
    localStorage.removeItem('cookie-preferences');
    
    setHasConsent(false);
    setConsentChoice(null);
    setPreferences(null);
  };

  return {
    hasConsent,
    consentChoice,
    preferences,
    hasAccepted: consentChoice === 'accepted',
    hasDeclined: consentChoice === 'declined',
    updateConsent,
    resetConsent,
  };
}

