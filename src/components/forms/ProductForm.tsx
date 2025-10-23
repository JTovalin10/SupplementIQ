'use client';

import AminoAcidForm from './categories/AminoAcidForm';
import AppetiteSuppressantForm from './categories/AppetiteSuppressantForm';
import CreatineForm from './categories/CreatineForm';
import EnergyDrinkForm from './categories/EnergyDrinkForm';
import FatBurnerForm from './categories/FatBurnerForm';
import NonStimPreworkoutForm from './categories/NonStimPreworkoutForm';
import PreworkoutForm from './categories/PreworkoutForm';
import ProteinForm from './categories/ProteinForm';
import { useProductForm } from './ProductFormContext';

/**
 * Main product form component that renders the appropriate category-specific form
 * Uses context to avoid prop drilling - zero props needed
 */
export default function ProductForm() {
  const { state } = useProductForm();
  const { category } = state;

  console.log('ProductForm - Current category:', category);
  console.log('ProductForm - Full state:', state);

  const renderCategoryForm = () => {
    switch (category) {
      case 'pre-workout':
        return <PreworkoutForm />;
      
      case 'non-stim-pre-workout':
        return <NonStimPreworkoutForm />;
      
      case 'energy-drink':
        return <EnergyDrinkForm />;
      
      case 'protein':
        return <ProteinForm />;
      
      case 'bcaa':
      case 'eaa':
        return <AminoAcidForm />;
      
      case 'fat-burner':
        return <FatBurnerForm />;
      
      case 'creatine':
        return <CreatineForm />;
      
      case 'appetite-suppressant':
        return <AppetiteSuppressantForm />;
      
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">No form available for category: {category}</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 font-medium">
            <strong className="text-red-900">⚠️ Important:</strong> Only fill in ingredients that are present in the product. 
            Empty fields will automatically be marked as "not in product" when you submit.
            Use "Not specified" for proprietary blends where exact amounts aren't disclosed.
          </p>
        </div>
      </div>
      {renderCategoryForm()}
    </div>
  );
}
