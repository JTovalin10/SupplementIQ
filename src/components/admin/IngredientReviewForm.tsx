'use client';

import { IngredientField, categoryIngredients } from '@/lib/config/data/ingredients';
import { useEffect, useState } from 'react';

interface IngredientReviewFormProps {
  category: string;
  categoryDetails: any;
  onIngredientUpdate: (ingredientName: string, value: string | number) => void;
}

interface EditableIngredientFieldProps {
  ingredient: IngredientField;
  value: any;
  onUpdate: (value: string | number) => void;
}

function EditableIngredientField({ ingredient, value, onUpdate }: EditableIngredientFieldProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleSave = () => {
    onUpdate(localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value || '');
    setIsEditing(false);
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined || val === '') return 'Not specified';
    if (typeof val === 'number') return `${val}${ingredient.unit}`;
    if (typeof val === 'string') {
      if (val === 'not_specified') return 'Not specified';
      return `${val}${ingredient.unit}`;
    }
    return String(val);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-black">
        {ingredient.label} ({ingredient.unit})
        {ingredient.required && ' *'}
      </label>
      
      {isEditing ? (
        <div className="space-y-2">
          <input
            type="number"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder={ingredient.placeholder}
            step={ingredient.step || "1"}
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
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-sm text-black">
            {formatValue(value)}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      )}
      
      {ingredient.description && (
        <p className="text-xs text-gray-500">
          {ingredient.description}
        </p>
      )}
    </div>
  );
}

export default function IngredientReviewForm({ 
  category, 
  categoryDetails, 
  onIngredientUpdate 
}: IngredientReviewFormProps) {
  const ingredients = categoryIngredients[category] || [];
  
  // Debug logging
  console.log('IngredientReviewForm - Category:', category);
  console.log('IngredientReviewForm - CategoryDetails:', categoryDetails);
  console.log('IngredientReviewForm - Ingredients:', ingredients);
  
  // Group ingredients by section
  const ingredientsBySection = ingredients.reduce((acc, ingredient) => {
    const section = ingredient.section || 'Other';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(ingredient);
    return acc;
  }, {} as Record<string, typeof ingredients>);

  const sectionOrder = [
    'Nutritional Information',
    'Basic Information',
    'BCAA Ingredients',
    'EAA Ingredients',
    'Additional Ingredients',
    'Dairy Proteins',
    'Plant Proteins', 
    'Specialty Proteins',
    'Lab Verification',
    'Other'
  ];

  if (ingredients.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800 font-medium">
          <strong className="text-red-900">⚠️ Error:</strong> 
          No ingredient configuration found for category: {category}
        </p>
        <p className="text-sm text-red-600 mt-2">
          Please check the category mapping in the ingredients configuration.
        </p>
      </div>
    );
  }

  if (!categoryDetails) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800 font-medium">
          <strong className="text-red-900">⚠️ Error:</strong> 
          No ingredient data found in database for this submission.
        </p>
        <p className="text-sm text-red-600 mt-2">
          The submission may not have ingredient details or there was an error fetching them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800 font-medium">
          <strong className="text-yellow-900">📝 Review Instructions:</strong> 
          Only reject if the product doesn't exist. Verify all ingredients are accurate and edit any incorrect values.
        </p>
      </div>
      
      {sectionOrder.map((sectionName) => {
        const sectionIngredients = ingredientsBySection[sectionName];
        if (!sectionIngredients || sectionIngredients.length === 0) return null;
        
        return (
          <div key={sectionName} className="space-y-6">
            <h4 className="text-lg font-medium text-black border-b border-gray-200 pb-3">
              {sectionName}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sectionIngredients.map((ingredient) => (
                <EditableIngredientField
                  key={ingredient.name}
                  ingredient={ingredient}
                  value={categoryDetails?.[ingredient.name]}
                  onUpdate={(value) => onIngredientUpdate(ingredient.name, value)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
