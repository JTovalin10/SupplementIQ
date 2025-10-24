'use client';

import { Check, Edit3, Package } from 'lucide-react';
import { useState } from 'react';
import { ProductMode } from '../types';

interface ProductImageProps {
  imageUrl?: string;
  productName: string;
  mode?: ProductMode;
  className?: string;
}

export default function ProductImage({ imageUrl, productName, mode = 'product', className = '' }: ProductImageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState(imageUrl || '');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to the backend
    console.log('Saving image URL:', editedImageUrl);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedImageUrl(imageUrl || '');
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
        {editedImageUrl ? (
          <img
            src={editedImageUrl}
            alt={productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="h-24 w-24" />
          </div>
        )}
        
        {/* Edit overlay for review mode */}
        {mode === 'review' && !isEditing && (
          <div className="absolute top-2 right-2 flex space-x-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg"
              title="Edit image URL"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            {!isConfirmed && (
              <button
                onClick={handleConfirm}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg"
                title="Confirm image is correct"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        
        {/* Confirmation badge */}
        {mode === 'review' && isConfirmed && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs rounded-lg shadow-lg">
            ✓ Confirmed
          </div>
        )}
      </div>
      
      {/* Edit form */}
      {mode === 'review' && isEditing && (
        <div className="space-y-2">
          <input
            type="url"
            value={editedImageUrl}
            onChange={(e) => setEditedImageUrl(e.target.value)}
            placeholder="Enter image URL"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
            autoFocus
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
