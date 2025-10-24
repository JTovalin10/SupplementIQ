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
  type?: 'text' | 'number' | 'creatine-dropdown';
  placeholder?: string;
  className?: string;
}

export default function EditableField({
  fieldId,
  label,
  value,
  unit = '',
  mode = 'product',
  type = 'text',
  placeholder,
  className = ''
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);
  const { confirmedFields, confirmField, unconfirmField } = useConfirmation();

  const isConfirmed = confirmedFields.has(fieldId);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedValue(value);
    // If field was confirmed, unconfirm it when editing
    if (isConfirmed) {
      unconfirmField(fieldId);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to the backend
    console.log(`Saving ${fieldId}:`, editedValue);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedValue(value);
  };

  const handleConfirm = () => {
    confirmField(fieldId);
  };

  const getDisplayValue = () => {
    if (Array.isArray(value) && value.length === 0) {
      return 'This Product Has No Flavors';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return `${value}${unit}`;
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

    return (
      <input
        type={type}
        value={editedValue}
        onChange={(e) => setEditedValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
    );
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm border rounded-xl p-3 hover:bg-white hover:shadow-sm transition-all duration-200 ${
      isConfirmed ? 'border-green-300/80 bg-green-50/30' : 'border-gray-200/60 hover:border-gray-300/80'
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
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
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
