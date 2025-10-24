'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface ImageManagerProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null) => void;
  className?: string;
}

export default function ImageManager({ 
  currentImageUrl, 
  onImageChange, 
  className = '' 
}: ImageManagerProps) {
  const [imageUrl, setImageUrl] = useState('');

  const handleApplyImage = () => {
    onImageChange(imageUrl || null);
    setImageUrl('');
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    setImageUrl('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Product Image Management</h3>
      
      {/* Current Image Display */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Current Image</h4>
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
          {currentImageUrl ? (
            <div className="relative w-full h-full">
              <img
                src={currentImageUrl}
                alt="Current product image"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-sm">Image failed to load</p>
                </div>
              </div>
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm">No image set</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Image Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Add New Image</h4>
        <div className="flex space-x-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleApplyImage}
            disabled={!imageUrl.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Apply</span>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {currentImageUrl && (
          <button
            onClick={handleRemoveImage}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Remove Image</span>
          </button>
        )}
      </div>
    </div>
  );
}
