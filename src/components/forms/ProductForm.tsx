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
      {renderCategoryForm()}
    </div>
  );
}
