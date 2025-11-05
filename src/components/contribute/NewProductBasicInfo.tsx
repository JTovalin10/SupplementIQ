"use client";

import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import { useAuth } from "@/lib/contexts";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface NewProductBasicInfoProps {
  formData: Record<string, string>;
  onFormChange: (field: string, value: string) => void;
  canSubmitImageUrl: boolean;
}

const categories = [
  "appetite-suppressant",
  "bcaa",
  "creatine",
  "eaa",
  "energy-drink",
  "fat-burner",
  "non-stim-pre-workout",
  "pre-workout",
  "protein",
];

export default function NewProductBasicInfo({
  formData,
  onFormChange,
  canSubmitImageUrl,
}: NewProductBasicInfoProps) {
  const { user } = useAuth();

  // Category dropdown state
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Sync category search term when formData.category changes
  // This syncs the display value when category is selected externally

  useEffect(() => {
    const currentValue = formData.category || "";
    if (currentValue) {
      const selectedCategory = categories.find((cat) => cat === currentValue);
      if (selectedCategory) {
        setCategorySearchTerm(
          selectedCategory
            .replace("-", " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
        );
      }
    } else {
      setCategorySearchTerm("");
    }
  }, [formData.category]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    onFormChange(name, value);
  };

  // Category dropdown handlers
  const handleCategorySelect = (category: string) => {
    onFormChange("category", category);
    setCategorySearchTerm(
      category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    );
    setIsCategoryOpen(false);
  };

  const handleCategoryInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setCategorySearchTerm(value);
    setIsCategoryOpen(true);
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(
    (category) =>
      category.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
      category
        .replace("-", " ")
        .toLowerCase()
        .includes(categorySearchTerm.toLowerCase()),
  );

  return (
    <Card padding="lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Product Information
      </h2>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-1">
        {/* Product Name */}
        <div className="col-span-2 md:col-span-1">
          <Input
            label="Product Name"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Whey Protein Isolate"
          />
        </div>

        {/* Brand */}
        <div>
          <Input
            label="Brand"
            name="brand"
            required
            value={formData.brand}
            onChange={handleInputChange}
            placeholder="e.g., Optimum Nutrition"
          />
        </div>

        {/* Category - Searchable Dropdown */}
        <div className="relative" ref={categoryDropdownRef}>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Category *
          </label>
          <div className="relative">
            <input
              type="text"
              id="category"
              name="category"
              value={categorySearchTerm}
              onChange={handleCategoryInputChange}
              onFocus={() => setIsCategoryOpen(true)}
              onClick={() => setIsCategoryOpen(true)}
              placeholder="Click or type to search categories..."
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
          {isCategoryOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <div
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-black"
                  >
                    {category
                      .replace("-", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-black">
                  No categories found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image URL - Only show if user has permission */}
        {canSubmitImageUrl ? (
          <div className="col-span-2 md:col-span-1">
            <Input
              label="Official Product Image URL"
              name="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/product-image.jpg"
              helperText="Must be an official image from the manufacturer's website"
            />
          </div>
        ) : (
          <div className="md:col-span-2">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Image URL Submission Restricted
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Image URL submission requires 1000+ reputation points or
                      moderator/admin/owner role.
                      {user && (
                        <span className="block mt-1">
                          Current: {user.reputation_points} points, {user.role}{" "}
                          role
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
