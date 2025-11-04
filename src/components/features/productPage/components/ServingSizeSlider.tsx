'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ServingSizeSliderProps {
  minServingSize?: number;
  maxServingSize?: number;
  productForm?: string;
  onServingSizeChange: (servingSize: number, isMin: boolean) => void;
  className?: string;
}

export default function ServingSizeSlider({
  minServingSize = 1,
  maxServingSize = 2,
  productForm = 'powder',
  onServingSizeChange,
  className = ''
}: ServingSizeSliderProps) {
  const [currentMode, setCurrentMode] = useState<'min' | 'max'>('min');
  const [currentServingSize, setCurrentServingSize] = useState(minServingSize);

  // Get the appropriate unit based on product form
  const getServingUnit = () => {
    switch (productForm) {
      case 'powder':
        return 'scoop';
      case 'pill':
      case 'capsule':
      case 'tablet':
        return 'pill';
      case 'bar':
        return 'bar';
      case 'drink':
      case 'energy_shot':
        return 'serving';
      default:
        return 'serving';
    }
  };

  const servingUnit = getServingUnit();
  const servingUnitPlural = servingUnit + (currentServingSize !== 1 ? 's' : '');

  const handleModeToggle = (mode: 'min' | 'max') => {
    setCurrentMode(mode);
    const targetSize = mode === 'min' ? minServingSize : maxServingSize;
    setCurrentServingSize(targetSize);
    onServingSizeChange(targetSize, mode === 'min');
  };

  const handleServingSizeChange = (newSize: number) => {
    setCurrentServingSize(newSize);
    onServingSizeChange(newSize, currentMode === 'min');
  };

  const incrementServingSize = () => {
    const newSize = currentServingSize + (productForm === 'powder' ? 0.5 : 1);
    const maxAllowed = currentMode === 'min' ? maxServingSize : 100;
    if (newSize <= maxAllowed) {
      handleServingSizeChange(newSize);
    }
  };

  const decrementServingSize = () => {
    const newSize = currentServingSize - (productForm === 'powder' ? 0.5 : 1);
    const minAllowed = currentMode === 'min' ? 0.5 : minServingSize;
    if (newSize >= minAllowed) {
      handleServingSizeChange(newSize);
    }
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/60 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Serving Size Analysis</h3>
        <div className="text-sm text-gray-600">
          Switch between min and max manufacturer recommendations
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center justify-center mb-6">
        <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <button
            onClick={() => handleModeToggle('min')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              currentMode === 'min'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Min Product
          </button>
          <button
            onClick={() => handleModeToggle('max')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              currentMode === 'max'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Max Product
          </button>
        </div>
      </div>

      {/* Serving Size Display */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={decrementServingSize}
            disabled={currentServingSize <= (currentMode === 'min' ? 0.5 : minServingSize)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {currentServingSize}
            </div>
            <div className="text-sm text-gray-600">
              {servingUnitPlural}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {currentMode === 'min' ? 'Minimum recommended' : 'Maximum recommended'}
            </div>
          </div>

          <button
            onClick={incrementServingSize}
            disabled={currentServingSize >= (currentMode === 'min' ? maxServingSize : 100)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Range Indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Min: {minServingSize} {servingUnit}s</span>
            <span>Max: {maxServingSize} {servingUnit}s</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentServingSize - minServingSize) / (maxServingSize - minServingSize)) * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Info Text */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          💡 This affects dosage analysis, safety ratings, and value calculations
        </p>
      </div>
    </div>
  );
}