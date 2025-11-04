'use client';

import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ActionResultScreenProps {
  productName: string;
  action: 'approved' | 'rejected';
  onReturn?: () => void;
}

export default function ActionResultScreen({ 
  productName, 
  action, 
  onReturn 
}: ActionResultScreenProps) {
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onReturn) {
            onReturn();
          } else {
            router.push('/admin/dashboard');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, onReturn]);

  const handleReturnNow = () => {
    if (onReturn) {
      onReturn();
    } else {
      router.push('/admin/dashboard');
    }
  };

  const isApproved = action === 'approved';
  const Icon = isApproved ? CheckCircle : XCircle;
  const iconColor = isApproved ? 'text-green-500' : 'text-red-500';
  const title = isApproved ? 'Product Approved!' : 'Product Rejected!';
  const message = isApproved 
    ? `"${productName}" has been added to database` 
    : `"${productName}" has been marked as non-existent`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <Icon className={`w-16 h-16 ${iconColor} mx-auto mb-4`} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-700 mb-2">
            {message}
          </p>
          <p className="text-sm text-gray-600">
            Your changes have been saved and cached locally
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">
              Returning to admin page in {countdown}...
            </p>
          </div>

          <button
            onClick={handleReturnNow}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Admin Dashboard</span>
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p>💾 Your edits are automatically cached</p>
          <p>🔄 Page will redirect automatically</p>
        </div>
      </div>
    </div>
  );
}
