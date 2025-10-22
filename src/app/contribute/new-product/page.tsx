'use client';

import ProductFormWrapper from '@/components/forms/ProductFormWrapper';
import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import WifiLoader from '@/components/ui/wifi-loader';
import { useAuth, useUser } from '@/lib/contexts/AppContext';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';

export default function NewProductPage() {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState<{ reputation_points: number; role: string } | null>(null);
  const [canSubmitImageUrl, setCanSubmitImageUrl] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      window.location.href = '/login?redirect=/contribute/new-product';
    } else if (isAuthenticated === true) {
      setIsCheckingAuth(false);
    }
  }, [isAuthenticated]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/users/profile');
      
      if (response.ok) {
        const data = await response.json();
        const profile = data.profile;
        setUserProfile(profile);
        
        // Check if user can submit image URLs (1000+ points OR admin/owner/moderator)
        console.log('User profile:', profile);
        console.log('User role:', profile.role);
        console.log('Reputation points:', profile.reputation_points);
        
        const canSubmit = profile.reputation_points >= 1000 || 
          ['admin', 'owner', 'moderator'].includes(profile.role);
        console.log('Can submit image URL:', canSubmit);
        setCanSubmitImageUrl(canSubmit);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }, []);

  // Fetch user profile to check reputation points
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user?.id, fetchUserProfile]);

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

  // Stabilize the callback to prevent infinite loops
  const handleFormChange = useCallback((updatedFormData: Record<string, string>) => {
    setFormData(prev => ({ ...prev, ...updatedFormData }));
  }, []);

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
            
            {/* Use the ProductFormWrapper with reducer-based context - zero prop drilling */}
            <ProductFormWrapper
              category={formData.category}
              initialFormData={formData}
              onFormChange={handleFormChange}
            />
          </Card>

          {/* Submit Button */}
          <div className="flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4">
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
