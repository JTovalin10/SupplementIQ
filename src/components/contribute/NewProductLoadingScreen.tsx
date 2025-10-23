'use client';

import WifiLoader from '@/components/ui/wifi-loader';

interface NewProductLoadingScreenProps {
  message?: string;
}

export default function NewProductLoadingScreen({ 
  message = "Checking authentication..." 
}: NewProductLoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <WifiLoader text={message} size="md" />
    </div>
  );
}
