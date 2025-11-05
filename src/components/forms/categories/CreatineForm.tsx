"use client";

import {
  categoryIngredients,
  creatineTypes,
} from "@/lib/config/data/ingredients";
import { useEffect, useRef, useState } from "react";
import IngredientFields from "../IngredientFields";
import { useProductForm } from "../ProductFormContext";

/**
 * Creatine-specific form component
 * Uses reducer-based context to avoid prop drilling
 * Organizes ingredients by sections for better UX
 */
export default function CreatineForm() {
  const { state, setField } = useProductForm();
  const ingredients = categoryIngredients["creatine"];
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group ingredients by section
  const ingredientsBySection = ingredients.reduce(
    (acc, ingredient) => {
      const section = ingredient.section || "Other";
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(ingredient);
      return acc;
    },
    {} as Record<string, typeof ingredients>,
  );

  const sectionOrder = ["Basic Information", "Other"];

  // Filter creatine types based on search term
  const filteredCreatineTypes = creatineTypes.filter(
    (type) =>
      type.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.value.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sync search term when value changes (syncs display value when selected externally)

  useEffect(() => {
    const currentValue = state.formData["creatine_type_name"] || "";
    if (currentValue) {
      const selectedType = creatineTypes.find(
        (type) => type.value === currentValue,
      );
      if (selectedType) {
        setSearchTerm(selectedType.label);
      }
    } else {
      setSearchTerm("");
    }
  }, [state.formData["creatine_type_name"]]);

  const handleSelect = (type: { value: string; label: string }) => {
    setField("creatine_type_name", type.value);
    setSearchTerm(type.label);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);

    // If user clears the input, clear the form field
    if (!value) {
      setField("creatine_type_name", "");
    }
  };

  return (
    <div className="space-y-12">
      <h3 className="text-xl font-semibold text-gray-900">
        Creatine Information
      </h3>

      {/* Creatine Type Selection - Searchable Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <label
          htmlFor="creatine_type_name"
          className="block text-sm font-medium text-black mb-2"
        >
          Creatine Type *
        </label>
        <div className="relative">
          <input
            type="text"
            id="creatine_type_name"
            name="creatine_type_name"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder="Type to search creatine types..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
            required
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Dropdown Options */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredCreatineTypes.length > 0 ? (
              filteredCreatineTypes.map((type) => (
                <div
                  key={type.value}
                  onClick={() => handleSelect(type)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-black"
                >
                  {type.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-black">
                No creatine types found
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-gray-500 mt-1">
          Type to search and select the type of creatine used in the product
        </p>
      </div>

      {/* Sectioned ingredients */}
      {sectionOrder.map((sectionName) => {
        const sectionIngredients = ingredientsBySection[sectionName];
        if (!sectionIngredients || sectionIngredients.length === 0) return null;

        // Filter out creatine_type_name from Basic Information section since it's handled above
        const filteredIngredients = sectionIngredients.filter(
          (ing) => ing.name !== "creatine_type_name",
        );
        if (filteredIngredients.length === 0) return null;

        return (
          <div key={sectionName} className="space-y-6">
            <h4 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-3">
              {sectionName}
            </h4>
            <IngredientFields ingredients={filteredIngredients} />
          </div>
        );
      })}
    </div>
  );
}
