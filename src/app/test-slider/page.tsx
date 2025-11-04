'use client';

import { useState } from 'react';
import ServingSizeSlider from '@/components/features/productPage/components/ServingSizeSlider';

export default function TestServingSlider() {
  const [currentServingSize, setCurrentServingSize] = useState(1);
  const [isMinMode, setIsMinMode] = useState(true);

  const handleServingSizeChange = (servingSize: number, isMin: boolean) => {
    setCurrentServingSize(servingSize);
    setIsMinMode(isMin);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Serving Size Slider</h1>
        
        {/* Test Slider */}
        <div className="mb-8">
          <ServingSizeSlider
            minServingSize={1}
            maxServingSize={3}
            productForm="powder"
            onServingSizeChange={handleServingSizeChange}
          />
        </div>

        {/* Current State Display */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current State</h2>
          <div className="space-y-2">
            <p><strong>Current Serving Size:</strong> {currentServingSize}</p>
            <p><strong>Mode:</strong> {isMinMode ? 'Min Product' : 'Max Product'}</p>
            <p><strong>Analysis:</strong> Analyzing {currentServingSize} scoop{currentServingSize !== 1 ? 's' : ''} for {isMinMode ? 'minimum effectiveness' : 'maximum effectiveness'}</p>
          </div>
        </div>

        {/* Mock Product Specs */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mock Product Specs</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900">Min Scoop(s)</h3>
              <p className="text-2xl font-bold text-blue-600">{currentServingSize}</p>
              <p className="text-sm text-gray-600">Current analysis</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900">Max Scoop(s)</h3>
              <p className="text-2xl font-bold text-purple-600">{currentServingSize}</p>
              <p className="text-sm text-gray-600">Current analysis</p>
            </div>
          </div>
        </div>

        {/* Mock Ratings */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Quality Ratings</h2>
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>
                Analyzing: {currentServingSize} scoop{currentServingSize !== 1 ? 's' : ''} 
                ({isMinMode ? 'Min' : 'Max'} Product)
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Dosage Rating</h3>
              <p className="text-2xl font-bold text-green-600">95/100</p>
              <p className="text-sm text-green-700">Excellent</p>
            </div>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Danger Rating</h3>
              <p className="text-2xl font-bold text-green-600">5/100</p>
              <p className="text-sm text-green-700">Excellent</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">How to Test</h2>
          <ul className="list-disc list-inside text-yellow-800 space-y-1">
            <li>Click "Min Product" or "Max Product" to switch modes</li>
            <li>Use the arrow buttons to adjust serving size</li>
            <li>Notice how the analysis updates in real-time</li>
            <li>The slider shows the range between min (1 scoop) and max (3 scoops)</li>
            <li>Different serving sizes will affect dosage and safety ratings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
