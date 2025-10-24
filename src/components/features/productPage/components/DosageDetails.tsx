'use client';

import { useEffect, useState } from 'react';
import { useConfirmation } from '../ConfirmationContext';
import { DOSAGE_MAPPINGS, ProductCategory } from '../types';
import EditableField from './EditableField';

interface DosageDetailsProps {
  dosageDetails: Record<string, any>;
  category: ProductCategory;
  mode?: 'review' | 'product';
  className?: string;
}

export default function DosageDetails({
  dosageDetails,
  category,
  mode = 'product',
  className = ''
}: DosageDetailsProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const { confirmedFields, confirmField, unconfirmField, setTotalFields } = useConfirmation();

  // Calculate total fields for dosage details
  useEffect(() => {
    const mapping = DOSAGE_MAPPINGS[category];
    if (mapping) {
      const fieldCount = Object.keys(mapping).length;
      setTotalFields(fieldCount); // Add to existing count
    }
  }, [category, setTotalFields]);

  const handleEditField = (key: string, currentValue: any) => {
    setEditingField(key);
    setEditedValues(prev => ({ ...prev, [key]: currentValue }));
    // If field was confirmed, unconfirm it when editing
    if (confirmedFields.has(key)) {
      unconfirmField(key);
    }
  };

  const handleSaveField = (key: string) => {
    setEditingField(null);
    // Here you would typically save to the backend
    console.log(`Saving ${key}:`, editedValues[key]);
  };

  const handleCancelEdit = (key: string) => {
    setEditingField(null);
    setEditedValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
  };

  const handleConfirmField = (key: string) => {
    confirmField(key);
  };

  const getDisplayValue = (key: string, config: any, value: any) => {
    if (key === 'flavors' && Array.isArray(value) && value.length === 0) {
      return 'This Product Has No Flavors';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return `${value} ${config.unit}`;
  };
  if (!dosageDetails) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900">Dosage Details</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-600">No dosage details available for this product.</p>
        </div>
      </div>
    );
  }

  const mapping = DOSAGE_MAPPINGS[category];
  if (!mapping) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900">Dosage Details</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-600">Dosage details for {category} products are not yet implemented.</p>
        </div>
      </div>
    );
  }

  // Group ingredients by category for better organization
  const groupedIngredients = Object.entries(mapping).reduce((acc, [key, config]) => {
    const value = dosageDetails[key];
    if (value === undefined || value === null || value === -1) return acc;

    if (!acc[config.category]) {
      acc[config.category] = [];
    }

    acc[config.category].push({ key, config, value });
    return acc;
  }, {} as Record<string, Array<{ key: string; config: any; value: any }>>);

  const getLabVerificationStatus = (ingredientKey: string) => {
    const labKey = `lab_verified_${ingredientKey}`;
    const labStatus = dosageDetails[labKey];
    if (labStatus === 1) return 'verified';
    if (labStatus === -1) return 'failed';
    return 'not-tested';
  };

  const renderIngredient = (ingredient: { key: string; config: any; value: any }) => {
    const { key, config, value } = ingredient;
    
    // Use EditableField for creatine type
    if (key === 'creatine_type_name') {
      return (
        <EditableField
          key={key}
          fieldId={key}
          label={config.displayName}
          value={value}
          mode={mode}
          type="creatine-dropdown"
          placeholder="Type to search creatine types..."
        />
      );
    }

    // For other fields, use the existing logic
    const verificationStatus = getLabVerificationStatus(key);
    const isEditing = editingField === key;
    const isConfirmed = confirmedFields.has(key);
    const currentValue = editedValues[key] !== undefined ? editedValues[key] : value;

    return (
      <div key={key} className={`group relative bg-white/80 backdrop-blur-sm border rounded-xl p-3 hover:bg-white hover:shadow-sm transition-all duration-200 ${
        isConfirmed ? 'border-green-300/80 bg-green-50/30' : 'border-gray-200/60 hover:border-gray-300/80'
      }`} style={{ overflow: 'visible' }}>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isConfirmed ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-800">{config.displayName}</span>
            {verificationStatus === 'verified' && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="text-xs font-medium text-emerald-700">Verified</span>
              </div>
            )}
            {verificationStatus === 'failed' && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium text-red-700">Failed</span>
              </div>
            )}
            {isConfirmed && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-700">Confirmed</span>
              </div>
            )}
          </div>
          
          <div className="ml-5 space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type={key.includes('price') ? 'number' : 'text'}
                  value={currentValue}
                  onChange={(e) => setEditedValues(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSaveField(key)}
                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleCancelEdit(key)}
                    className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-semibold ${
                  isConfirmed ? 'text-green-800' : 'text-gray-900'
                }`}>
                  {getDisplayValue(key, config, currentValue)}
                </span>
                {mode === 'review' && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditField(key, currentValue)}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    {!isConfirmed && (
                      <button
                        onClick={() => handleConfirmField(key)}
                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200"
                      >
                        ✓ Correct
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCategorySection = (categoryName: string, ingredients: Array<{ key: string; config: any; value: any }>) => {
    if (ingredients.length === 0) return null;

    const categoryTitles: Record<string, string> = {
      serving: 'Serving Information',
      info: 'Product Information',
      nutrition: 'Nutritional Information',
      vitamin: 'Vitamins',
      mineral: 'Minerals',
      ingredient: 'Active Ingredients',
      amino: 'Amino Acids',
    };

    const categoryGradients: Record<string, string> = {
      serving: 'from-blue-500 to-cyan-500',
      info: 'from-gray-500 to-slate-500',
      nutrition: 'from-emerald-500 to-green-500',
      vitamin: 'from-amber-500 to-yellow-500',
      mineral: 'from-purple-500 to-violet-500',
      ingredient: 'from-indigo-500 to-blue-500',
      amino: 'from-pink-500 to-rose-500',
    };

    const gradient = categoryGradients[categoryName] || 'from-gray-500 to-slate-500';

    return (
      <div key={categoryName} className="relative overflow-visible bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/60 rounded-2xl p-4 shadow-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-60" 
             style={{ background: `linear-gradient(90deg, var(--tw-gradient-stops))` }}>
          <div className={`h-full bg-gradient-to-r ${gradient}`}></div>
        </div>
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-3 h-3 bg-gradient-to-r ${gradient} rounded-full`}></div>
          <h5 className="font-semibold text-gray-800 text-sm">
            {categoryTitles[categoryName] || categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
          </h5>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {ingredients.map(renderIngredient)}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">Dosage Details</h3>
      </div>

      <div className="space-y-3">
        {Object.entries(groupedIngredients).map(([categoryName, ingredients]) =>
          renderCategorySection(categoryName, ingredients)
        )}
      </div>
    </div>
  );
}
