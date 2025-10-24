'use client';

import NewProductBasicInfo from '@/components/contribute/NewProductBasicInfo';
import NewProductHeader from '@/components/contribute/NewProductHeader';
import NewProductLoadingScreen from '@/components/contribute/NewProductLoadingScreen';
import NewProductStatusBanners from '@/components/contribute/NewProductStatusBanners';
import NewProductSubmitSection from '@/components/contribute/NewProductSubmitSection';
import ProductFormWrapper from '@/components/forms/ProductFormWrapper';
import Card from '@/components/ui/card';
import { useAuth } from '@/lib/contexts';
import React, { useEffect, useState } from 'react';

export default function NewProductPage() {
  const { isAuthenticated, user } = useAuth();
  const [canSubmitImageUrl, setCanSubmitImageUrl] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Form data state
  const [formData, setFormData] = useState<Record<string, string>>({
    name: '',
    brand: '',
    category: '',
    description: '',
    imageUrl: '',
    notes: ''
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      window.location.href = '/login?redirect=/contribute/new-product';
    } else if (isAuthenticated === true) {
      setIsCheckingAuth(false);
    }
  }, [isAuthenticated]);

  // Check user permissions for image URL submission using existing user data
  useEffect(() => {
    if (user) {
      // Check if user can submit image URLs (1000+ points OR admin/owner/moderator)
      const canSubmit = user.reputation_points >= 1000 || 
        ['admin', 'owner', 'moderator'].includes(user.role);
      setCanSubmitImageUrl(canSubmit);
    }
  }, [user]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string>('');
  const [submittedProduct, setSubmittedProduct] = useState<{name: string, brand: string, submittedDirectly: boolean} | null>(null);

  // Form change handler
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function to get ingredient fields for a category
  const getCategoryIngredients = (category: string) => {
    const { categoryIngredients } = require('@/lib/config/data/ingredients');
    return categoryIngredients[category] || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      if (!isAuthenticated || !user?.id) {
        setSubmitStatus('error');
        setSubmitError('You must be logged in to submit a product');
        setIsSubmitting(false);
        return;
      }

      // Basic form validation
      if (!formData.name || !formData.brand || !formData.category) {
        setSubmitStatus('error');
        setSubmitError('Please fill in all required fields (Product Name, Brand, and Category)');
        setIsSubmitting(false);
        return;
      }

      // Process ingredient data - convert empty fields to "not_in_product"
      const processedFormData = { ...formData };
      
      // Get all ingredient fields for the current category
      const categoryIngredients = getCategoryIngredients(formData.category);
      
      // Process each ingredient field
      categoryIngredients.forEach(ingredient => {
        const fieldName = ingredient.name;
        const currentValue = processedFormData[fieldName];
        
        // If field is empty or not set, assume it's not in the product
        if (!currentValue || currentValue === '' || currentValue === '0') {
          processedFormData[fieldName] = 'not_in_product';
        }
      });

      // Prepare submission data - send individual fields that API expects
      const submissionData: any = {
        name: processedFormData.name,
        brand_name: processedFormData.brand,
        category: processedFormData.category,
        description: processedFormData.description,
        // Only include image_url if user has permission
        ...(canSubmitImageUrl && processedFormData.imageUrl && { image_url: processedFormData.imageUrl }),
        job_type: 'add',
        submitted_by: user.id,
        notes: processedFormData.notes,
        price: 1, // Default price
        transparency_score: 0,
        confidence_level: 'estimated'
      };

      // Add numeric fields only if they have valid values
      if (processedFormData.servings_per_container && processedFormData.servings_per_container !== 'not_in_product') {
        submissionData.servings_per_container = parseFloat(processedFormData.servings_per_container);
      }
      
      if (processedFormData.price && processedFormData.price !== 'not_in_product') {
        submissionData.price = parseFloat(processedFormData.price);
      }
      
      if (processedFormData.serving_size_g && processedFormData.serving_size_g !== 'not_in_product') {
        submissionData.serving_size_g = parseFloat(processedFormData.serving_size_g);
      }

      // Use debug endpoint for testing
      const response = await fetch('/api/debug/submit-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role || 'owner', // Default to owner for debugging
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Failed to submit product';
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.details) {
          errorMessage = `Validation error: ${errorData.details}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Store submitted product info for success message
      setSubmittedProduct({
        name: processedFormData.name,
        brand: processedFormData.brand,
        submittedDirectly: result.submitted_directly || false // Default to false for debug endpoint
      });
      
      setSubmitStatus('success');
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Only reset form on successful submission (201 status)
      // Reset form after a short delay to allow success message to be seen
      setTimeout(() => {
        setFormData({
          name: '',
          brand: '',
          category: '',
          description: '',
          imageUrl: '',
          notes: ''
        });
      }, 3000);
    } catch (error) {
      setSubmitStatus('error');
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissStatus = () => {
    setSubmitStatus('idle');
    setSubmitError('');
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return <NewProductLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NewProductHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NewProductStatusBanners
          submitStatus={submitStatus}
          isSubmitting={isSubmitting}
          submitError={submitError}
          submittedProduct={submittedProduct}
          onDismissStatus={handleDismissStatus}
          showDebugBanner={true}
        />
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <NewProductBasicInfo
            formData={formData}
            onFormChange={handleFormChange}
            canSubmitImageUrl={canSubmitImageUrl}
          />

          <Card padding="lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {formData.category ? `${formData.category.charAt(0).toUpperCase() + formData.category.slice(1).replace('-', ' ')} Information` : 'Nutrition Information'}
            </h2>
            
            {formData.category ? (
              <ProductFormWrapper
                category={formData.category}
                initialFormData={formData}
                onFormChange={(newFormData) => {
                  setFormData(prev => ({ ...prev, ...newFormData }));
                }}
              />
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Select a category above to see ingredient fields for that product type.
                </p>
              </div>
            )}
          </Card>

          <NewProductSubmitSection isSubmitting={isSubmitting} />
        </form>
      </div>
    </div>
  );
}
