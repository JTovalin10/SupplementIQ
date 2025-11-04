'use client';

import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { creatineTypes } from '@/lib/config/data/ingredients';
import { useState } from 'react';
import { useConfirmation } from '../ConfirmationContext';

interface EditableFieldProps {
  fieldId: string;
  label: string;
  value: any;
  unit?: string;
  mode?: 'review' | 'product';
  type?: 'text' | 'number' | 'creatine-dropdown' | 'product-form-dropdown';
  placeholder?: string;
  className?: string;
  options?: Array<{ value: string; label: string }>;
  productForm?: string; // Add product form to determine validation rules
}

export default function EditableField({
  fieldId,
  label,
  value,
  unit = '',
  mode = 'product',
  type = 'text',
  placeholder,
  className = '',
  options = [],
  productForm = 'powder'
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);
  const [localValue, setLocalValue] = useState(value); // Track local changes
  const [validationError, setValidationError] = useState<string | null>(null);
  const { confirmedFields, confirmField, unconfirmField, updateLocalValue } = useConfirmation();

  const isConfirmed = confirmedFields.has(fieldId);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedValue(localValue); // Use local value instead of original value
    setValidationError(null); // Clear any previous validation errors
    // If field was confirmed, unconfirm it when editing
    if (isConfirmed) {
      unconfirmField(fieldId);
    }
  };

  const handleSave = () => {
    // Basic validation for numeric fields
    if (type === 'number') {
      const numValue = parseFloat(editedValue);
      if (isNaN(numValue)) {
        setValidationError('Please enter a valid number');
        return;
      }
      
      // Servings validation with decimal support (max 2 decimal places)
      if (fieldId === 'servingsPerContainer') {
        if (numValue <= 0) {
          setValidationError('Servings must be greater than 0');
          return;
        }
        if (numValue > 1000000) {
          setValidationError('Servings cannot exceed 1,000,000 (bulk product cap)');
          return;
        }
        // Check decimal places (max 2)
        const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
        if (decimalPlaces > 2) {
          setValidationError('Servings can have at most 2 decimal places');
          return;
        }
      }
      
              // Min serving size validation (smart based on product form)
              if (fieldId === 'minServingSize') {
                if (numValue <= 0) {
                  setValidationError('Min serving size must be greater than 0');
                  return;
                }
                if (numValue > 100) {
                  setValidationError('Min serving size cannot exceed 100 (e.g., 100 pills max)');
                  return;
                }
                // For powders, allow decimals (1.5 scoops). For pills/bars, require integers
                if (productForm === 'powder') {
                  // Allow decimals for powders (max 2 decimal places)
                  const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
                  if (decimalPlaces > 2) {
                    setValidationError('Min serving size can have at most 2 decimal places');
                    return;
                  }
                } else {
                  // Require integers for pills, bars, capsules, etc.
                  if (!Number.isInteger(numValue)) {
                    setValidationError('Min serving size must be a whole number (1, 2, 3, etc.)');
                    return;
                  }
                }
              }
              
              // Max serving size validation (smart based on product form)
              if (fieldId === 'maxServingSize') {
                if (numValue <= 0) {
                  setValidationError('Max serving size must be greater than 0');
                  return;
                }
                if (numValue > 100) {
                  setValidationError('Max serving size cannot exceed 100 (e.g., 100 pills max)');
                  return;
                }
                // For powders, allow decimals (1.5 scoops). For pills/bars, require integers
                if (productForm === 'powder') {
                  // Allow decimals for powders (max 2 decimal places)
                  const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
                  if (decimalPlaces > 2) {
                    setValidationError('Max serving size can have at most 2 decimal places');
                    return;
                  }
                } else {
                  // Require integers for pills, bars, capsules, etc.
                  if (!Number.isInteger(numValue)) {
                    setValidationError('Max serving size must be a whole number (1, 2, 3, etc.)');
                    return;
                  }
                }
              }
      
      // Cap at $400 for supplements (nothing really goes over that)
      if (fieldId === 'price' && numValue > 400) {
        setValidationError('Price cannot exceed $400');
        return;
      }
    }
    
    // If we get here, validation passed
    setValidationError(null);
    setIsEditing(false);
    setLocalValue(editedValue); // Update local state
    updateLocalValue(fieldId, editedValue); // Update global context
    
    // Automatically confirm the field since user has reviewed and corrected it
    if (!isConfirmed) {
      confirmField(fieldId, editedValue);
    }
    
    console.log(`Field ${fieldId} updated locally to:`, editedValue);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedValue(localValue); // Reset to local value, not original value
    setValidationError(null); // Clear validation error on cancel
  };

  const handleConfirm = () => {
    if (!isConfirmed) {
      confirmField(fieldId, localValue); // Use local value for confirmation
    } else {
      unconfirmField(fieldId);
    }
  };

  const getDisplayValue = () => {
    if (Array.isArray(localValue) && localValue.length === 0) {
      return 'This Product Has No Flavors';
    }
    if (Array.isArray(localValue)) {
      return localValue.join(', ');
    }
    return `${localValue}${unit}`;
  };

  const renderInput = () => {
    if (type === 'creatine-dropdown') {
      return (
        <SearchableDropdown
          value={editedValue}
          options={creatineTypes}
          onChange={(value) => setEditedValue(value)}
          placeholder={placeholder || "Type to search creatine types..."}
          className="text-sm"
        />
      );
    }

    if (type === 'product-form-dropdown') {
      return (
        <select
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
          className={`w-full px-2 py-1 border rounded-md text-sm text-black focus:outline-none focus:ring-2 ${
            validationError 
              ? 'border-red-500 focus:ring-red-500 bg-red-50' 
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        >
          <option value="">Select product form...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={type}
        value={editedValue}
        onChange={(e) => {
          const value = e.target.value;
          // Basic validation for numeric fields
          if (type === 'number') {
            // Serving sizes (min/max) - smart validation based on product form
            if (fieldId === 'minServingSize' || fieldId === 'maxServingSize') {
              if (productForm === 'powder') {
                // Allow decimals for powders (max 2 decimal places)
                if (!/^\d*\.?\d{0,2}$/.test(value)) return;
              } else {
                // Only allow whole numbers (integers) for pills, bars, etc.
                if (!/^\d+$/.test(value)) return;
              }
            } else if (fieldId === 'servingsPerContainer' || fieldId === 'servingSizeG') {
              // Allow digits, optional decimal point, and up to 2 decimal places
              if (!/^\d*\.?\d{0,2}$/.test(value)) return;
            } else {
              // Other numeric fields allow decimal point
              if (!/^\d*\.?\d*$/.test(value)) return;
            }
            
            // Prevent typing values over limits
            if (fieldId === 'price') {
              const numValue = parseFloat(value);
              if (value && numValue > 400) return;
            }
            if (fieldId === 'servingsPerContainer') {
              const numValue = parseFloat(value);
              if (value && numValue > 1000000) return;
            }
            if (fieldId === 'servingSizeG' || fieldId === 'minServingSize' || fieldId === 'maxServingSize') {
              const numValue = parseFloat(value);
              if (value && numValue > 100) return;
            }
          }
          setEditedValue(value);
        }}
        placeholder={placeholder}
        step={type === 'number' ? (fieldId === 'minServingSize' || fieldId === 'maxServingSize' ? (productForm === 'powder' ? '0.01' : '1') : (fieldId === 'servingsPerContainer' || fieldId === 'servingSizeG' ? '0.01' : '0.01')) : undefined}
        className={`w-full px-2 py-1 border rounded-md text-sm text-black focus:outline-none focus:ring-2 ${
          validationError 
            ? 'border-red-500 focus:ring-red-500 bg-red-50' 
            : 'border-gray-300 focus:ring-blue-500'
        }`}
        autoFocus
      />
    );
  };

  return (
    <div className={`bg-white border border-blue-200/60 rounded-xl p-3 hover:shadow-sm transition-all duration-200 ${
      isConfirmed ? 'border-green-300/80 bg-green-50/30' : ''
    } ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isConfirmed ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
          }`}></div>
          <span className="text-sm font-medium text-gray-800">{label}</span>
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
                {renderInput()}
                {validationError && (
                  <p className="text-xs text-red-600 font-medium">{validationError}</p>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={!!validationError}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      validationError
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-semibold ${
                isConfirmed ? 'text-green-800' : 'text-black'
              }`}>
                {getDisplayValue()}
              </span>
              {mode === 'review' && (
                <div className="flex space-x-1">
                  <button
                    onClick={handleEdit}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  {!isConfirmed && (
                    <button
                      onClick={handleConfirm}
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
}
