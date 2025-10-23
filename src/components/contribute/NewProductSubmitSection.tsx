'use client';

import Button from '@/components/ui/button';
import { useUser } from '@/lib/contexts/UserContext';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface NewProductSubmitSectionProps {
  isSubmitting: boolean;
}

export default function NewProductSubmitSection({
  isSubmitting
}: NewProductSubmitSectionProps) {
  const { user } = useUser();

  return (
    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>
          {user?.reputation_points >= 1000 || ['admin', 'owner', 'moderator'].includes(user?.role || '') 
            ? `Direct submission enabled (${user?.reputation_points || 0} points)`
            : `Review required (${user?.reputation_points || 0}/1000 points)`}
        </span>
      </div>
      
      <div className="flex space-x-4">
        <Link href="/contribute">
          <Button variant="outline" size="lg">
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          loading={isSubmitting}
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Submit Product
        </Button>
      </div>
    </div>
  );
}
