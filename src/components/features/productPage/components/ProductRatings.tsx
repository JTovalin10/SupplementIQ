"use client";

import {
  IngredientAnalysis,
  ProductDosageAnalysis,
} from "@/lib/config/data/ingredients/enhanced-dosage-calculator";
import { ExternalLink, Star, X } from "lucide-react";
import { useState } from "react";
import { ProductData } from "../types";

interface ProductRatingsProps {
  product: ProductData;
  dosageAnalysis?: ProductDosageAnalysis;
  className?: string;
  currentServingSize?: number;
  isMinMode?: boolean;
}

export default function ProductRatings({
  product,
  dosageAnalysis,
  className = "",
  currentServingSize,
  isMinMode = true,
}: ProductRatingsProps) {
  const [showDosageOverview, setShowDosageOverview] = useState(false);
  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientAnalysis | null>(null);
  const getRatingColor = (rating: number) => {
    if (rating >= 80) return "text-gray-700";
    if (rating >= 60) return "text-gray-600";
    return "text-gray-500";
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 80) return "Excellent";
    if (rating >= 60) return "Good";
    if (rating >= 40) return "Fair";
    return "Poor";
  };

  // Danger rating works inversely - lower danger = better safety
  const getDangerRatingColor = (dangerRating: number) => {
    if (dangerRating <= 20) return "text-gray-600"; // Low danger
    if (dangerRating <= 40) return "text-gray-700"; // Medium danger
    return "text-red-600"; // High danger = red
  };

  const getDangerRatingLabel = (dangerRating: number) => {
    if (dangerRating <= 20) return "Excellent"; // Low danger = excellent safety
    if (dangerRating <= 40) return "Good"; // Medium danger = good safety
    if (dangerRating <= 60) return "Fair"; // Higher danger = fair safety
    return "Poor"; // High danger = poor safety
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Quality Ratings</h3>
        {currentServingSize && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span>
              Analyzing: {currentServingSize} scoop
              {currentServingSize !== 1 ? "s" : ""}({isMinMode ? "Min" : "Max"}{" "}
              Product)
            </span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div
          className="bg-white border border-gray-200 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowDosageOverview(true)}
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <h4 className="font-semibold text-gray-900">Dosage Rating</h4>
            <div className="flex items-center ml-auto">
              <Star className="h-4 w-4 text-gray-500 mr-1" />
              <span
                className={`font-semibold ${getRatingColor(product.dosageRating)}`}
              >
                {product.dosageRating}/100
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 ml-5">
            {getRatingLabel(product.dosageRating)}
          </p>
          <p className="text-xs text-gray-600 ml-5 mt-1">
            Click for detailed analysis
          </p>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <h4 className="font-semibold text-gray-900">Danger Rating</h4>
            <div className="flex items-center ml-auto">
              <Star className="h-4 w-4 text-gray-500 mr-1" />
              <span
                className={`font-semibold ${getDangerRatingColor(product.dangerRating)}`}
              >
                {product.dangerRating}/100
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 ml-5">
            {getDangerRatingLabel(product.dangerRating)}
          </p>
        </div>
      </div>

      {/* Dosage Overview Modal */}
      {showDosageOverview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Dosage Rating Analysis
              </h3>
              <button
                onClick={() => setShowDosageOverview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {dosageAnalysis ? (
              <div className="space-y-6">
                {/* Overall Analysis */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Overall Rating: {dosageAnalysis.overallScore}/100
                  </h4>
                  <p className="text-gray-700">{dosageAnalysis.message}</p>
                </div>

                {/* Min/Max Dosage Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Manufacturer Dosage Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700">
                        Min Effective Dosage
                      </h5>
                      <p className="text-sm text-gray-600">
                        {dosageAnalysis.manufacturerMinDosage.message}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700">
                        Max Safe Dosage
                      </h5>
                      <p className="text-sm text-gray-600">
                        {dosageAnalysis.manufacturerMaxDosage.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 font-medium">
                    💡 Click on any ingredient card below to learn more about
                    its dosage, sources, and safety notes.
                  </p>
                </div>

                {/* Ingredient Cards */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">
                    Ingredient Analysis
                  </h4>
                  {dosageAnalysis.ingredientAnalysis.map((ingredient) => (
                    <div
                      key={ingredient.ingredientName}
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedIngredient(ingredient)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">
                            {ingredient.displayName}
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">
                            {ingredient.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Actual: {ingredient.actualDosage}mg</span>
                            <span>Min: {ingredient.minDosage}mg</span>
                            <span>Max: {ingredient.maxDosage}mg</span>
                            {ingredient.dangerousDosage > 0 && (
                              <span>
                                Danger: {ingredient.dangerousDosage}mg
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ingredient.rating === "Excellent"
                                ? "bg-gray-100 text-gray-700"
                                : ingredient.rating === "Good"
                                  ? "bg-gray-100 text-gray-700"
                                  : ingredient.rating === "Fair"
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-gray-100 text-red-600"
                            }`}
                          >
                            {ingredient.rating}
                          </span>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No detailed dosage analysis available for this product.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingredient Detail Modal */}
      {selectedIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedIngredient.displayName}
              </h3>
              <button
                onClick={() => setSelectedIngredient(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Dosage Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Dosage Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-900">
                  <div>
                    <span className="font-medium">Actual Dosage:</span>
                    <span className="ml-2">
                      {selectedIngredient.actualDosage}mg
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Min Effective:</span>
                    <span className="ml-2">
                      {selectedIngredient.minDosage}mg
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Max Safe:</span>
                    <span className="ml-2">
                      {selectedIngredient.maxDosage}mg
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Dangerous:</span>
                    <span className="ml-2">
                      {selectedIngredient.dangerousDosage}mg
                    </span>
                  </div>
                </div>
              </div>

              {/* Analysis */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Analysis</h4>
                <p className="text-gray-900">{selectedIngredient.message}</p>
                <div className="mt-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedIngredient.rating === "Excellent"
                        ? "bg-gray-100 text-gray-700"
                        : selectedIngredient.rating === "Good"
                          ? "bg-gray-100 text-gray-700"
                          : selectedIngredient.rating === "Fair"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-gray-100 text-red-600"
                    }`}
                  >
                    Rating: {selectedIngredient.rating} (
                    {selectedIngredient.score}/100)
                  </span>
                </div>
              </div>

              {/* Dosage Notes */}
              {selectedIngredient.dosageNotes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Dosage Notes
                  </h4>
                  <p className="text-gray-900 mb-2">
                    {selectedIngredient.dosageNotes}
                  </p>
                  {selectedIngredient.dosageCitation && (
                    <a
                      href={selectedIngredient.dosageCitation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-gray-900 text-sm flex items-center font-medium"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Learn More
                    </a>
                  )}
                </div>
              )}

              {/* Cautions */}
              {selectedIngredient.cautions && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Cautions</h4>
                  <p className="text-gray-900 mb-2">
                    {selectedIngredient.cautions}
                  </p>
                  {selectedIngredient.cautionsCitation && (
                    <a
                      href={selectedIngredient.cautionsCitation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-gray-900 text-sm flex items-center font-medium"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Learn More
                    </a>
                  )}
                </div>
              )}

              {/* Precaution People */}
              {selectedIngredient.precautionPeople &&
                selectedIngredient.precautionPeople.length > 0 && (
                  <div className="bg-gray-50 border-l-4 border-red-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Consult Doctor If You Have:
                    </h4>
                    <ul className="text-gray-900 list-disc list-inside">
                      {selectedIngredient.precautionPeople.map(
                        (condition, index) => (
                          <li key={index}>{condition}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
