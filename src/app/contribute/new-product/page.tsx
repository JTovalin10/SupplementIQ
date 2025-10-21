'use client';

import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import WifiLoader from '@/components/ui/wifi-loader';
import { categoryIngredients, creatineTypes, IngredientField, specialFields } from '@/lib/config/data/ingredients';
import { useAuth, useUser } from '@/lib/contexts/AppContext';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

export default function NewProductPage() {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState<{ reputation_points: number; role: string } | null>(null);
  const [canSubmitImageUrl, setCanSubmitImageUrl] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      window.location.href = '/login?redirect=/contribute/new-product';
    } else if (isAuthenticated === true) {
      setIsCheckingAuth(false);
    }
  }, [isAuthenticated]);

  // Fetch user profile to check reputation points
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user?.id]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/v1/users/profile');
      
      if (response.ok) {
        const data = await response.json();
        const profile = data.profile;
        setUserProfile(profile);
        
        // Check if user can submit image URLs (1000+ points OR admin/owner/moderator)
        const canSubmit = profile.reputation_points >= 1000 || 
          ['admin', 'owner', 'moderator'].includes(profile.role);
        setCanSubmitImageUrl(canSubmit);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const [formData, setFormData] = useState<Record<string, string>>({
    name: '',
    brand: '',
    category: '',
    description: '',
    imageUrl: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string>('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const categories = [
    'protein',
    'pre-workout',
    'non-stim-pre-workout', 
    'energy-drink',
    'bcaa',
    'eaa',
    'fat-burner',
    'appetite-suppressant',
    'creatine'
  ];

  const categoryNutritionDefaults = {
    'protein': {
      servingSize: '30',
      servingUnit: 'g',
      claimedProtein: '25',
      effectiveProtein: '24',
      transparencyScore: '85',
      nutritionFields: ['protein_claim_g', 'protein_type', 'effective_protein_g']
    },
    'pre-workout': {
      servingSize: '30.5',
      servingUnit: 'g',
      claimedProtein: '',
      effectiveProtein: '',
      transparencyScore: '75',
      nutritionFields: ['serving_scoops', 'l_citrulline_mg', 'caffeine_anhydrous_mg', 'creatine_monohydrate_mg']
    },
    'energy-drink': {
      servingSize: '16',
      servingUnit: 'ml',
      claimedProtein: '',
      effectiveProtein: '',
      transparencyScore: '80',
      nutritionFields: ['serving_size_fl_oz', 'caffeine_mg', 'n_acetyl_l_tyrosine_mg', 'alpha_gpc_mg']
    },
    'bcaa': {
      servingSize: '10',
      servingUnit: 'g',
      claimedProtein: '',
      effectiveProtein: '',
      transparencyScore: '90',
      nutritionFields: ['total_eaas_mg', 'l_leucine_mg', 'l_isoleucine_mg', 'l_valine_mg']
    },
    'eaa': {
      servingSize: '10',
      servingUnit: 'g',
      claimedProtein: '',
      effectiveProtein: '',
      transparencyScore: '90',
      nutritionFields: ['total_eaas_mg', 'l_leucine_mg', 'l_isoleucine_mg', 'l_valine_mg', 'l_lysine_hcl_mg']
    },
    'fat-burner': {
      servingSize: '2',
      servingUnit: 'capsules',
      claimedProtein: '',
      effectiveProtein: '',
      transparencyScore: '70',
      nutritionFields: ['stimulant_based', 'caffeine_anhydrous_mg', 'green_tea_extract_mg', 'l_carnitine_l_tartrate_mg']
    },
    'appetite-suppressant': {
      servingSize: '2',
      servingUnit: 'capsules',
      claimedProtein: '',
      effectiveProtein: '',
      transparencyScore: '75',
      nutritionFields: ['five_htp_mg', 'ksm66_ashwagandha_mg', 'saffron_extract_mg']
    },
    'creatine': {
      servingSize: '5',
      servingUnit: 'g',
      claimedProtein: '',
      effectiveProtein: '',
      transparencyScore: '95',
      nutritionFields: ['creatine_monohydrate_mg']
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIngredientAction = (fieldName: string, action: 'not_in_product' | 'not_specified') => {
    const currentValue = formData[fieldName as keyof typeof formData] as string;
    
    setFormData(prev => {
      // If clicking the same button that's already active, clear it
      if ((action === 'not_in_product' && currentValue === 'not_in_product') ||
          (action === 'not_specified' && currentValue === 'not_specified')) {
        return {
          ...prev,
          [fieldName]: ''
        };
      }
      
      // Otherwise, set the new value
      return {
        ...prev,
        [fieldName]: action === 'not_in_product' ? 'not_in_product' : 'not_specified'
      };
    });
  };

  const renderIngredientField = (ingredient: IngredientField) => {
    const value = formData[ingredient.name] || '';
    const isNotInProduct = value === 'not_in_product';
    const isNotSpecified = value === 'not_specified';
    
    return (
      <div>
        <label htmlFor={ingredient.name} className="block text-sm font-medium text-black mb-2">
          {ingredient.label} ({ingredient.unit})
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            id={ingredient.name}
            name={ingredient.name}
            step={ingredient.step || "1"}
            value={isNotInProduct || isNotSpecified ? '' : value}
            onChange={handleInputChange}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
            placeholder={ingredient.placeholder}
            disabled={isNotInProduct || isNotSpecified}
            required={ingredient.required}
          />
          <button
            type="button"
            onClick={() => handleIngredientAction(ingredient.name, 'not_in_product')}
            className={`px-3 py-2 text-xs rounded-lg border ${
              isNotInProduct 
                ? 'bg-red-100 border-red-300 text-red-700' 
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Not in product
          </button>
          <button
            type="button"
            onClick={() => handleIngredientAction(ingredient.name, 'not_specified')}
            className={`px-3 py-2 text-xs rounded-lg border ${
              isNotSpecified 
                ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Not specified
          </button>
        </div>
        {ingredient.description && (
          <p className="text-sm text-gray-500 mt-1">
            {ingredient.description}
          </p>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      if (!isAuthenticated || !user?.id) {
        setSubmitStatus('error');
        setSubmitError('You must be logged in to submit a product');
        return;
      }

      // Prepare submission data
      const submissionData = {
        name: formData.name,
        brand_name: formData.brand,
        category: formData.category,
        description: formData.description,
        // Only include image_url if user has permission
        ...(canSubmitImageUrl && formData.imageUrl && { image_url: formData.imageUrl }),
        job_type: 'add',
        submitted_by: user.id,
        notes: formData.notes,
        // Add other fields as needed
        price: 0, // Default price, should be updated with actual field
        transparency_score: 0,
        confidence_level: 'estimated'
      };

      const response = await fetch('/api/pending-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit product');
      }

      const result = await response.json();
      console.log('Product submitted successfully:', result);
      
      setSubmitStatus('success');
      
      // Reset form
      setFormData({
        name: '',
        brand: '',
        category: '',
        description: '',
        imageUrl: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting product:', error);
      setSubmitStatus('error');
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <WifiLoader text="Checking authentication..." size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/contribute"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Contribute
            </Link>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-600 mt-2">
              Submit a new supplement product to our database. All submissions are reviewed by our community.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="mb-8">
            <Alert 
              type="success" 
              title="Product Submitted Successfully!"
            >
                  Your product submission has been received and will be reviewed by our community. 
                  You'll be notified once it's approved and added to the database.
            </Alert>
          </div>
        )}

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div className="mb-8">
            <Alert 
              type="error" 
              title="Submission Failed"
            >
                  There was an error submitting your product. Please try again or contact support if the problem persists.
            </Alert>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card padding="lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div className="md:col-span-2">
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

              {/* Category */}
              <div>
                <Select
                  label="Category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Select a category"
                  options={categories.map(category => ({
                    value: category,
                    label: category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                  }))}
                />
              </div>


              {/* Image URL - Only show if user has permission */}
              {canSubmitImageUrl ? (
                <div className="md:col-span-2">
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
                  <Alert 
                    type="warning" 
                    title="Image URL Submission Restricted"
                  >
                          Image URL submission requires 1000+ reputation points or moderator/admin/owner role.
                          {userProfile && (
                            <span className="block mt-1">
                              Current: {userProfile.reputation_points} points, {userProfile.role} role
                            </span>
                          )}
                  </Alert>
                </div>
              )}
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {formData.category ? `${formData.category.charAt(0).toUpperCase() + formData.category.slice(1).replace('-', ' ')} Information` : 'Nutrition Information'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dynamic Fields Based on Category */}
              {formData.category && categoryIngredients[formData.category] && (
                <>
                  {/* Render special fields first (like protein claim/effective protein) */}
                  {specialFields[formData.category] && 
                    specialFields[formData.category].map((field) => (
                      <div key={field.name}>
                        <label htmlFor={field.name} className="block text-sm font-medium text-black mb-2">
                          {field.label} ({field.unit}){field.required && ' *'}
                    </label>
                    <input
                      type="number"
                          id={field.name}
                          name={field.name}
                          required={field.required}
                          step={field.step || "0.1"}
                          value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                          placeholder={field.placeholder}
                        />
                        {field.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {field.description}
                          </p>
                        )}
                  </div>
                    ))
                  }

                  {/* Render regular ingredient fields */}
                  {categoryIngredients[formData.category].map((ingredient) => {
                    // Handle special cases for dropdowns
                    if (ingredient.name === 'stimulant_based') {
                      return (
                        <div key={ingredient.name}>
                          <label htmlFor={ingredient.name} className="block text-sm font-medium text-black mb-2">
                            {ingredient.label}
                    </label>
                    <select
                            id={ingredient.name}
                            name={ingredient.name}
                            value={formData[ingredient.name] || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    >
                      <option value="">Select type</option>
                      <option value="true">Stimulant Based</option>
                      <option value="false">Stim-Free</option>
                    </select>
                          {ingredient.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {ingredient.description}
                            </p>
                          )}
                  </div>
                      );
                    }

                    if (ingredient.name === 'creatine_type_name') {
                      return (
                        <div key={ingredient.name}>
                          <label htmlFor={ingredient.name} className="block text-sm font-medium text-black mb-2">
                            {ingredient.label}{ingredient.required && ' *'}
                    </label>
                    <select
                            id={ingredient.name}
                            name={ingredient.name}
                            required={ingredient.required}
                            value={formData[ingredient.name] || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    >
                      <option value="">Select creatine type</option>
                            <option value="">No Creatine</option>
                            {creatineTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                    </select>
                          {ingredient.description && (
                    <p className="text-sm text-gray-500 mt-1">
                              {ingredient.description}
                    </p>
                          )}
                  </div>
                      );
                    }

                    if (ingredient.name === 'creatine_amount_mg') {
                      const creatineType = formData['creatine_type_name'] || '';
                      const isNotInProduct = formData[ingredient.name] === 'not_in_product';
                      const isNotSpecified = formData[ingredient.name] === 'not_specified';
                      
                      return (
                        <div key={ingredient.name}>
                          <label htmlFor={ingredient.name} className="block text-sm font-medium text-black mb-2">
                            {ingredient.label} ({ingredient.unit})
                    </label>
                          <div className="flex gap-2">
                    <input
                      type="number"
                              id={ingredient.name}
                              name={ingredient.name}
                      step="1"
                              value={isNotInProduct || isNotSpecified ? '' : (formData[ingredient.name] || '')}
                      onChange={handleInputChange}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                              placeholder={creatineType ? ingredient.placeholder : '0'}
                              disabled={isNotInProduct || isNotSpecified || !creatineType}
                            />
                            <button
                              type="button"
                              onClick={() => handleIngredientAction(ingredient.name, 'not_in_product')}
                              className={`px-3 py-2 text-xs rounded-lg border ${
                                isNotInProduct 
                                  ? 'bg-red-100 border-red-300 text-red-700' 
                                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              Not in product
                            </button>
                            <button
                              type="button"
                              onClick={() => handleIngredientAction(ingredient.name, 'not_specified')}
                              className={`px-3 py-2 text-xs rounded-lg border ${
                                isNotSpecified 
                                  ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              Not specified
                            </button>
                          </div>
                          {ingredient.description && (
                    <p className="text-sm text-gray-500 mt-1">
                              {ingredient.description}
                              {creatineType && (
                                <span className="block mt-1">
                                  Selected: {creatineType}
                                </span>
                              )}
                            </p>
                          )}
                  </div>
                      );
                    }

                    // Render regular ingredient fields
                    return renderIngredientField(ingredient);
                  })}
                </>
              )}
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/contribute">
              <Button variant="outline" size="lg">
              Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
            >
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
