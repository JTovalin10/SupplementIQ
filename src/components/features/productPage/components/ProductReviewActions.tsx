'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';

interface ProductReviewActionsProps {
  productId: string;
  productName: string;
  confirmedFields?: Set<string>;
  totalFields?: number;
  className?: string;
}

export default function ProductReviewActions({ 
  productId, 
  productName, 
  confirmedFields = new Set(),
  totalFields = 0,
  className = '' 
}: ProductReviewActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'deny' | null>(null);

  const handleApprove = async () => {
    setIsLoading(true);
    setAction('approve');
    
    try {
      // TODO: Implement approve API call
      console.log('Approving product:', productId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert(`Product "${productName}" has been approved!`);
      
    } catch (error) {
      console.error('Error approving product:', error);
      alert('Failed to approve product. Please try again.');
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const handleDeny = async () => {
    setIsLoading(true);
    setAction('deny');
    
    try {
      // TODO: Implement deny API call
      console.log('Product does not exist:', productId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert(`Product "${productName}" has been marked as non-existent.`);
      
    } catch (error) {
      console.error('Error marking product as non-existent:', error);
      alert('Failed to mark product as non-existent. Please try again.');
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  // Check if all fields are confirmed
  const allFieldsConfirmed = totalFields > 0 && confirmedFields.size >= totalFields;

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Review Actions</h3>
      
      <div className="space-y-3">
        {/* Approve Button */}
        <button
          onClick={handleApprove}
          disabled={isLoading || !allFieldsConfirmed}
          className={`w-full px-4 py-3 text-white rounded-lg disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium ${
            allFieldsConfirmed 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-400 hover:bg-gray-500'
          }`}
        >
          <Check className="h-5 w-5" />
          <span>{isLoading && action === 'approve' ? 'Approving...' : 'Approve Product'}</span>
        </button>

        {/* Product Doesn't Exist Button */}
        <button
          onClick={handleDeny}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
        >
          <X className="h-5 w-5" />
          <span>{isLoading && action === 'deny' ? 'Processing...' : 'Product Doesn\'t Exist'}</span>
        </button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• <strong>Approve:</strong> Product will be published and visible to users (only available when all fields are confirmed)</p>
        <p>• <strong>Product Doesn't Exist:</strong> Mark this product as non-existent or having major issues</p>
        {!allFieldsConfirmed && (
          <p className="text-amber-600">• <strong>Note:</strong> Confirm all fields before approving ({confirmedFields.size}/{totalFields} confirmed)</p>
        )}
      </div>
    </div>
  );
}
