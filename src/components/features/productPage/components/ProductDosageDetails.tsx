'use client';

import { DOSAGE_MAPPINGS, ProductCategory } from '../types';

interface ProductDosageDetailsProps {
  dosageDetails: Record<string, any>;
  category: ProductCategory;
  className?: string;
}

export default function ProductDosageDetails({ 
  dosageDetails, 
  category, 
  className = '' 
}: ProductDosageDetailsProps) {
  if (!dosageDetails) {
    return null;
  }

  const mapping = DOSAGE_MAPPINGS[category];
  if (!mapping) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900">Detailed Dosage Information</h3>
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
    const verificationStatus = getLabVerificationStatus(key);
    
    return (
      <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100">
        <div className="flex items-center">
          <div>
            <span className="text-sm font-medium text-gray-900">{config.displayName}</span>
            {config.description && (
              <p className="text-xs text-gray-500">{config.description}</p>
            )}
          </div>
          {verificationStatus === 'verified' && (
            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
              ✓ Verified
            </span>
          )}
          {verificationStatus === 'failed' && (
            <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
              ✗ Failed
            </span>
          )}
        </div>
        <span className="text-sm text-gray-600">
          {Array.isArray(value) ? value.join(', ') : `${value} ${config.unit}`}
        </span>
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

    const categoryColors: Record<string, string> = {
      serving: 'blue',
      info: 'gray',
      nutrition: 'green',
      vitamin: 'yellow',
      mineral: 'purple',
      ingredient: 'indigo',
      amino: 'pink',
    };

    const color = categoryColors[categoryName] || 'gray';
    const bgColor = `${color}-50`;
    const textColor = `${color}-900`;
    const borderColor = `${color}-200`;

    return (
      <div key={categoryName} className={`bg-${bgColor} border border-${borderColor} rounded-lg p-4`}>
        <h5 className={`font-semibold text-${textColor} mb-3`}>
          {categoryTitles[categoryName] || categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
        </h5>
        <div className="space-y-1">
          {ingredients.map(renderIngredient)}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Detailed Dosage Information</h3>
      
      <div className="space-y-4">
        {Object.entries(groupedIngredients).map(([categoryName, ingredients]) => 
          renderCategorySection(categoryName, ingredients)
        )}
      </div>
    </div>
  );
}
