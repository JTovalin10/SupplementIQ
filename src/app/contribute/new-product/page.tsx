'use client';

import { useJWTAuth } from '@/lib/contexts/JWTAuthContext';
import { AlertCircle, ArrowLeft, CheckCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

export default function NewProductPage() {
  const { user, isAuthenticated } = useJWTAuth();
  const [userProfile, setUserProfile] = useState<{ reputation_points: number; role: string } | null>(null);
  const [canSubmitImageUrl, setCanSubmitImageUrl] = useState(false);

  // Fetch user profile to check reputation points
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user?.id]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/v1/users/profile', {
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`,
        },
      });
      
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

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    description: '',
    imageUrl: '',
    claimedProtein: '',
    effectiveProtein: '',
    ingredients: '',
    notes: '',
    // Complete schema fields for all categories
    protein_claim_g: '',
    protein_type: '',
    effective_protein_g: '',
    whey_isolate_mg: '',
    whey_concentrate_mg: '',
    pea_protein_mg: '',
    rice_protein_mg: '',
    hemp_protein_mg: '',
    soy_protein_mg: '',
    casein_mg: '',
    egg_protein_mg: '',
    collagen_mg: '',
    lab_tested: '',
    collagen: '',
    serving_scoops: '',
    sugar_g: '',
    l_citrulline_mg: '',
    creatine_monohydrate_mg: '',
    glycerpump_mg: '',
    caffeine_anhydrous_mg: '',
    l_tyrosine_mg: '',
    betaine_anhydrous_mg: '',
    serving_size_fl_oz: '',
    caffeine_mg: '',
    n_acetyl_l_tyrosine_mg: '',
    alpha_gpc_mg: '',
    l_theanine_mg: '',
    huperzine_a_mcg: '',
    vitamin_c_mg: '',
    total_eaas_mg: '',
    l_leucine_mg: '',
    l_isoleucine_mg: '',
    l_valine_mg: '',
    coconut_water_powder_mg: '',
    l_lysine_hcl_mg: '',
    l_threonine_mg: '',
    l_phenylalanine_mg: '',
    l_tryptophan_mg: '',
    stimulant_based: '',
    green_tea_extract_mg: '',
    l_carnitine_l_tartrate_mg: '',
    ksm66_ashwagandha_mg: '',
    five_htp_mg: '',
    saffron_extract_mg: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string>('');

  const categories = [
    'protein',
    'pre-workout', 
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

  const renderIngredientField = (fieldName: string, label: string, placeholder: string, unit: string = 'mg') => {
    const value = formData[fieldName as keyof typeof formData] as string;
    const isNotInProduct = value === 'not_in_product';
    const isNotSpecified = value === 'not_specified';
    
    return (
      <div>
        <label htmlFor={fieldName} className="block text-sm font-medium text-black mb-2">
          {label} ({unit})
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            id={fieldName}
            name={fieldName}
            step="1"
            value={isNotInProduct || isNotSpecified ? '' : value}
            onChange={handleInputChange}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
            placeholder={placeholder}
            disabled={isNotInProduct || isNotSpecified}
          />
          <button
            type="button"
            onClick={() => handleIngredientAction(fieldName, 'not_in_product')}
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
            onClick={() => handleIngredientAction(fieldName, 'not_specified')}
            className={`px-3 py-2 text-xs rounded-lg border ${
              isNotSpecified 
                ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Not specified
          </button>
        </div>
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
          'Authorization': `Bearer ${user.token || ''}`,
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
        claimedProtein: '',
        effectiveProtein: '',
        ingredients: '',
        notes: '',
        protein_claim_g: '',
        protein_type: '',
        effective_protein_g: '',
        whey_isolate_mg: '',
        whey_concentrate_mg: '',
        pea_protein_mg: '',
        rice_protein_mg: '',
        hemp_protein_mg: '',
        soy_protein_mg: '',
        casein_mg: '',
        egg_protein_mg: '',
        collagen_mg: '',
        lab_tested: '',
        collagen: '',
        serving_scoops: '',
        sugar_g: '',
        l_citrulline_mg: '',
        creatine_monohydrate_mg: '',
        glycerpump_mg: '',
        caffeine_anhydrous_mg: '',
        l_tyrosine_mg: '',
        betaine_anhydrous_mg: '',
        serving_size_fl_oz: '',
        caffeine_mg: '',
        n_acetyl_l_tyrosine_mg: '',
        alpha_gpc_mg: '',
        l_theanine_mg: '',
        huperzine_a_mcg: '',
        vitamin_c_mg: '',
        total_eaas_mg: '',
        l_leucine_mg: '',
        l_isoleucine_mg: '',
        l_valine_mg: '',
        coconut_water_powder_mg: '',
        l_lysine_hcl_mg: '',
        l_threonine_mg: '',
        l_phenylalanine_mg: '',
        l_tryptophan_mg: '',
        stimulant_based: '',
        green_tea_extract_mg: '',
        l_carnitine_l_tartrate_mg: '',
        ksm66_ashwagandha_mg: '',
        five_htp_mg: '',
        saffron_extract_mg: ''
      });
    } catch (error) {
      console.error('Error submitting product:', error);
      setSubmitStatus('error');
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Product Submitted Successfully!</h3>
                <p className="text-green-700 mt-1">
                  Your product submission has been received and will be reviewed by our community. 
                  You'll be notified once it's approved and added to the database.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Submission Failed</h3>
                <p className="text-red-700 mt-1">
                  There was an error submitting your product. Please try again or contact support if the problem persists.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                  placeholder="e.g., Whey Protein Isolate"
                />
              </div>

              {/* Brand */}
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  required
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                  placeholder="e.g., Optimum Nutrition"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>


              {/* Image URL - Only show if user has permission */}
              {canSubmitImageUrl ? (
                <div className="md:col-span-2">
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Official Product Image URL
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                    placeholder="https://example.com/product-image.jpg"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Must be an official image from the manufacturer's website
                  </p>
                </div>
              ) : (
                <div className="md:col-span-2">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">
                          Image URL Submission Restricted
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Image URL submission requires 1000+ reputation points or moderator/admin/owner role.
                          {userProfile && (
                            <span className="block mt-1">
                              Current: {userProfile.reputation_points} points, {userProfile.role} role
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {formData.category ? `${formData.category.charAt(0).toUpperCase() + formData.category.slice(1).replace('-', ' ')} Information` : 'Nutrition Information'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dynamic Fields Based on Category - Complete Schema Implementation */}
              
              {/* PROTEIN PRODUCTS */}
              {formData.category === 'protein' && (
                <>
                  {renderIngredientField('whey_isolate_mg', 'Whey Isolate', '25', 'g')}
                  {renderIngredientField('whey_concentrate_mg', 'Whey Concentrate', '24', 'g')}
                  {renderIngredientField('pea_protein_mg', 'Pea Protein', '20', 'g')}
                  {renderIngredientField('rice_protein_mg', 'Rice Protein', '18', 'g')}
                  {renderIngredientField('hemp_protein_mg', 'Hemp Protein', '15', 'g')}
                  {renderIngredientField('soy_protein_mg', 'Soy Protein', '22', 'g')}
                  {renderIngredientField('casein_mg', 'Casein', '24', 'g')}
                  {renderIngredientField('egg_protein_mg', 'Egg Protein', '25', 'g')}
                  {renderIngredientField('collagen_mg', 'Collagen', '20', 'g')}
                  <div>
                    <label htmlFor="protein_claim_g" className="block text-sm font-medium text-black mb-2">
                      Protein Claim (g) *
                    </label>
                    <input
                      type="number"
                      id="protein_claim_g"
                      name="protein_claim_g"
                      required
                      step="0.1"
                      value={formData.protein_claim_g || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="25"
                    />
                    <p className="text-sm text-black mt-1">
                      Amount of protein claimed on the label
                    </p>
                  </div>
                  <div>
                    <label htmlFor="effective_protein_g" className="block text-sm font-medium text-black mb-2">
                      Effective Protein (g)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        id="effective_protein_g"
                        name="effective_protein_g"
                        step="0.1"
                        value={formData.effective_protein_g || ''}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                        placeholder="24"
                      />
                      <button
                        type="button"
                        onClick={() => handleIngredientAction('lab_tested', 'not_specified')}
                        className={`px-3 py-2 text-xs rounded-lg border ${
                          formData.lab_tested === 'not_specified' 
                            ? 'bg-green-100 border-green-300 text-green-700' 
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Lab Tested
                      </button>
                    </div>
                    <p className="text-sm text-black mt-1">
                      Bioavailable protein content (if known)
                    </p>
                  </div>
                </>
              )}

              {/* PRE-WORKOUT PRODUCTS */}
              {formData.category === 'pre-workout' && (
                <>
                  <div>
                    <label htmlFor="serving_scoops" className="block text-sm font-medium text-black mb-2">
                      Serving Scoops
                    </label>
                    <input
                      type="number"
                      id="serving_scoops"
                      name="serving_scoops"
                      step="0.5"
                      value={formData.serving_scoops || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <label htmlFor="sugar_g" className="block text-sm font-medium text-black mb-2">
                      Sugar (g)
                    </label>
                    <input
                      type="number"
                      id="sugar_g"
                      name="sugar_g"
                      step="0.1"
                      value={formData.sugar_g || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="0"
                    />
                  </div>
                  {renderIngredientField('l_citrulline_mg', 'L-Citrulline', '9000')}
                  {renderIngredientField('creatine_monohydrate_mg', 'Creatine Monohydrate', '5000')}
                  {renderIngredientField('glycerpump_mg', 'GlycerPump', '3000')}
                  {renderIngredientField('caffeine_anhydrous_mg', 'Caffeine Anhydrous', '350')}
                  {renderIngredientField('l_tyrosine_mg', 'L-Tyrosine', '1500')}
                  {renderIngredientField('betaine_anhydrous_mg', 'Betaine Anhydrous', '2500')}
                  {renderIngredientField('agmatine_sulfate_mg', 'Agmatine Sulfate', '1000')}
                  {renderIngredientField('n_phenethyl_dimethylamine_citrate_mg', 'N-Phenethyl Dimethylamine Citrate', '350')}
                  {renderIngredientField('kanna_extract_mg', 'Kanna Extract', '500')}
                  {renderIngredientField('huperzine_a_mcg', 'Huperzine A', '400', 'mcg')}
                  {renderIngredientField('bioperine_mg', 'Bioperine', '5')}
                </>
              )}

              {/* ENERGY DRINK PRODUCTS */}
              {formData.category === 'energy-drink' && (
                <>
                  <div>
                    <label htmlFor="serving_size_fl_oz" className="block text-sm font-medium text-black mb-2">
                      Serving Size (fl oz)
                    </label>
                    <input
                      type="number"
                      id="serving_size_fl_oz"
                      name="serving_size_fl_oz"
                      step="0.1"
                      value={formData.serving_size_fl_oz || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="16"
                    />
                  </div>
                  <div>
                    <label htmlFor="sugar_g" className="block text-sm font-medium text-black mb-2">
                      Sugar (g)
                    </label>
                    <input
                      type="number"
                      id="sugar_g"
                      name="sugar_g"
                      step="0.1"
                      value={formData.sugar_g || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="0"
                    />
                  </div>
                  {renderIngredientField('caffeine_mg', 'Caffeine', '200')}
                  {renderIngredientField('n_acetyl_l_tyrosine_mg', 'N-Acetyl L-Tyrosine', '1000')}
                  {renderIngredientField('alpha_gpc_mg', 'Alpha GPC', '400')}
                  {renderIngredientField('l_theanine_mg', 'L-Theanine', '100')}
                  {renderIngredientField('huperzine_a_mcg', 'Huperzine A', '200', 'mcg')}
                  {renderIngredientField('uridine_monophosphate_mg', 'Uridine Monophosphate', '200')}
                  {renderIngredientField('saffron_extract_mg', 'Saffron Extract', '15')}
                  {renderIngredientField('vitamin_c_mg', 'Vitamin C', '90')}
                  {renderIngredientField('niacin_b3_mg', 'Niacin B3', '16')}
                  {renderIngredientField('vitamin_b6_mg', 'Vitamin B6', '5')}
                  {renderIngredientField('vitamin_b12_mcg', 'Vitamin B12', '5', 'mcg')}
                  {renderIngredientField('pantothenic_acid_b5_mg', 'Pantothenic Acid B5', '5')}
                </>
              )}

              {/* BCAA PRODUCTS */}
              {formData.category === 'bcaa' && (
                <>
                  <div>
                    <label htmlFor="total_eaas_mg" className="block text-sm font-medium text-black mb-2">
                      Total EAAs (mg)
                    </label>
                    <input
                      type="number"
                      id="total_eaas_mg"
                      name="total_eaas_mg"
                      step="1"
                      value={formData.total_eaas_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <label htmlFor="l_leucine_mg" className="block text-sm font-medium text-black mb-2">
                      L-Leucine (mg)
                    </label>
                    <input
                      type="number"
                      id="l_leucine_mg"
                      name="l_leucine_mg"
                      step="1"
                      value={formData.l_leucine_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="3000"
                    />
                  </div>
                  <div>
                    <label htmlFor="l_isoleucine_mg" className="block text-sm font-medium text-black mb-2">
                      L-Isoleucine (mg)
                    </label>
                    <input
                      type="number"
                      id="l_isoleucine_mg"
                      name="l_isoleucine_mg"
                      step="1"
                      value={formData.l_isoleucine_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="1500"
                    />
                  </div>
                  <div>
                    <label htmlFor="l_valine_mg" className="block text-sm font-medium text-black mb-2">
                      L-Valine (mg)
                    </label>
                    <input
                      type="number"
                      id="l_valine_mg"
                      name="l_valine_mg"
                      step="1"
                      value={formData.l_valine_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="1500"
                    />
                  </div>
                  <div>
                    <label htmlFor="betaine_anhydrous_mg" className="block text-sm font-medium text-black mb-2">
                      Betaine Anhydrous (mg)
                    </label>
                    <input
                      type="number"
                      id="betaine_anhydrous_mg"
                      name="betaine_anhydrous_mg"
                      step="1"
                      value={formData.betaine_anhydrous_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="1250"
                    />
                  </div>
                  <div>
                    <label htmlFor="coconut_water_powder_mg" className="block text-sm font-medium text-black mb-2">
                      Coconut Water Powder (mg)
                    </label>
                    <input
                      type="number"
                      id="coconut_water_powder_mg"
                      name="coconut_water_powder_mg"
                      step="1"
                      value={formData.coconut_water_powder_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="250"
                    />
                  </div>
                </>
              )}

              {/* EAA PRODUCTS */}
              {formData.category === 'eaa' && (
                <>
                  <div>
                    <label htmlFor="total_eaas_mg" className="block text-sm font-medium text-black mb-2">
                      Total EAAs (mg)
                    </label>
                    <input
                      type="number"
                      id="total_eaas_mg"
                      name="total_eaas_mg"
                      step="1"
                      value={formData.total_eaas_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <label htmlFor="l_leucine_mg" className="block text-sm font-medium text-black mb-2">
                      L-Leucine (mg)
                    </label>
                    <input
                      type="number"
                      id="l_leucine_mg"
                      name="l_leucine_mg"
                      step="1"
                      value={formData.l_leucine_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="3000"
                    />
                  </div>
                  <div>
                    <label htmlFor="l_lysine_hcl_mg" className="block text-sm font-medium text-black mb-2">
                      L-Lysine HCL (mg)
                    </label>
                    <input
                      type="number"
                      id="l_lysine_hcl_mg"
                      name="l_lysine_hcl_mg"
                      step="1"
                      value={formData.l_lysine_hcl_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label htmlFor="l_threonine_mg" className="block text-sm font-medium text-black mb-2">
                      L-Threonine (mg)
                    </label>
                    <input
                      type="number"
                      id="l_threonine_mg"
                      name="l_threonine_mg"
                      step="1"
                      value={formData.l_threonine_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label htmlFor="l_phenylalanine_mg" className="block text-sm font-medium text-black mb-2">
                      L-Phenylalanine (mg)
                    </label>
                    <input
                      type="number"
                      id="l_phenylalanine_mg"
                      name="l_phenylalanine_mg"
                      step="1"
                      value={formData.l_phenylalanine_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label htmlFor="l_tryptophan_mg" className="block text-sm font-medium text-black mb-2">
                      L-Tryptophan (mg)
                    </label>
                    <input
                      type="number"
                      id="l_tryptophan_mg"
                      name="l_tryptophan_mg"
                      step="1"
                      value={formData.l_tryptophan_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="150"
                    />
                  </div>
                </>
              )}

              {/* FAT BURNER PRODUCTS */}
              {formData.category === 'fat-burner' && (
                <>
                  <div>
                    <label htmlFor="stimulant_based" className="block text-sm font-medium text-black mb-2">
                      Stimulant Based
                    </label>
                    <select
                      id="stimulant_based"
                      name="stimulant_based"
                      value={formData.stimulant_based || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    >
                      <option value="">Select type</option>
                      <option value="true">Stimulant Based</option>
                      <option value="false">Stim-Free</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="caffeine_anhydrous_mg" className="block text-sm font-medium text-black mb-2">
                      Caffeine Anhydrous (mg)
                    </label>
                    <input
                      type="number"
                      id="caffeine_anhydrous_mg"
                      name="caffeine_anhydrous_mg"
                      step="1"
                      value={formData.caffeine_anhydrous_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="200"
                    />
                  </div>
                  <div>
                    <label htmlFor="green_tea_extract_mg" className="block text-sm font-medium text-black mb-2">
                      Green Tea Extract (mg)
                    </label>
                    <input
                      type="number"
                      id="green_tea_extract_mg"
                      name="green_tea_extract_mg"
                      step="1"
                      value={formData.green_tea_extract_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="400"
                    />
                  </div>
                  <div>
                    <label htmlFor="l_carnitine_l_tartrate_mg" className="block text-sm font-medium text-black mb-2">
                      L-Carnitine L-Tartrate (mg)
                    </label>
                    <input
                      type="number"
                      id="l_carnitine_l_tartrate_mg"
                      name="l_carnitine_l_tartrate_mg"
                      step="1"
                      value={formData.l_carnitine_l_tartrate_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label htmlFor="ksm66_ashwagandha_mg" className="block text-sm font-medium text-black mb-2">
                      KSM-66 Ashwagandha (mg)
                    </label>
                    <input
                      type="number"
                      id="ksm66_ashwagandha_mg"
                      name="ksm66_ashwagandha_mg"
                      step="1"
                      value={formData.ksm66_ashwagandha_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="600"
                    />
                  </div>
                  <div>
                    <label htmlFor="five_htp_mg" className="block text-sm font-medium text-black mb-2">
                      5-HTP (mg)
                    </label>
                    <input
                      type="number"
                      id="five_htp_mg"
                      name="five_htp_mg"
                      step="1"
                      value={formData.five_htp_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="100"
                    />
                  </div>
                </>
              )}

              {/* APPETITE SUPPRESSANT PRODUCTS */}
              {formData.category === 'appetite-suppressant' && (
                <>
                  <div>
                    <label htmlFor="five_htp_mg" className="block text-sm font-medium text-black mb-2">
                      5-HTP (mg)
                    </label>
                    <input
                      type="number"
                      id="five_htp_mg"
                      name="five_htp_mg"
                      step="1"
                      value={formData.five_htp_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label htmlFor="ksm66_ashwagandha_mg" className="block text-sm font-medium text-black mb-2">
                      KSM-66 Ashwagandha (mg)
                    </label>
                    <input
                      type="number"
                      id="ksm66_ashwagandha_mg"
                      name="ksm66_ashwagandha_mg"
                      step="1"
                      value={formData.ksm66_ashwagandha_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="600"
                    />
                  </div>
                  <div>
                    <label htmlFor="saffron_extract_mg" className="block text-sm font-medium text-black mb-2">
                      Saffron Extract (mg)
                    </label>
                    <input
                      type="number"
                      id="saffron_extract_mg"
                      name="saffron_extract_mg"
                      step="1"
                      value={formData.saffron_extract_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="15"
                    />
                  </div>
                </>
              )}

              {/* CREATINE PRODUCTS */}
              {formData.category === 'creatine' && (
                <>
                  <div>
                    <label htmlFor="creatine_monohydrate_mg" className="block text-sm font-medium text-black mb-2">
                      Creatine Monohydrate (mg)
                    </label>
                    <input
                      type="number"
                      id="creatine_monohydrate_mg"
                      name="creatine_monohydrate_mg"
                      step="1"
                      value={formData.creatine_monohydrate_mg || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                      placeholder="5000"
                    />
                  </div>
                </>
              )}

            </div>
          </div>

          <div className="bg-blue-50 rounded-lg border border-blue-200 p-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-6">How Transparency Score is Calculated</h2>
            
            <div className="space-y-4">
              {formData.category === 'protein' && (
                <div className="text-black">
                  <h3 className="font-semibold text-blue-800 mb-2">Protein Products:</h3>
                  <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-3 rounded mb-4">
                    <h4 className="font-semibold text-sm mb-1 text-green-800">Lab Tested Products:</h4>
                    <p className="text-sm text-green-700">If product has third-party lab testing showing protein content matches or exceeds label claims → <strong>VERIFIED</strong> status (highest transparency score)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Default Testing Scenarios:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Ingredient Disclosure (40%):</strong> Complete ingredient list with amounts</li>
                      <li><strong>Absorption Claims (30%):</strong> How close ingredients are to what they claim (bioavailability)</li>
                      <li><strong>Manufacturing Info (20%):</strong> Facility certifications (GMP, NSF, etc.)</li>
                      <li><strong>Brand Transparency (10%):</strong> Open communication about sourcing and quality</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {formData.category === 'pre-workout' && (
                <div className="text-black">
                  <h3 className="font-semibold text-blue-800 mb-2">Pre-Workout Products:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Ingredient Transparency (60%):</strong> Complete ingredient disclosure and proprietary blend breakdown</li>
                    <li><strong>Dosage Accuracy (40%):</strong> Clinical doses vs. underdosed ingredients</li>
                  </ul>
                </div>
              )}
              
              {formData.category === 'energy-drink' && (
                <div className="text-black">
                  <h3 className="font-semibold text-blue-800 mb-2">Energy Drinks:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Ingredient Transparency (60%):</strong> Complete ingredient disclosure and nootropic transparency</li>
                    <li><strong>Dosage Accuracy (40%):</strong> Effective doses vs. underdosed ingredients</li>
                  </ul>
                </div>
              )}
              
              {formData.category === 'bcaa' && (
                <div className="text-black">
                  <h3 className="font-semibold text-blue-800 mb-2">BCAA Products:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Ingredient Transparency (60%):</strong> Complete ingredient disclosure and ratio accuracy</li>
                    <li><strong>Dosage Accuracy (40%):</strong> Effective doses vs. underdosed ingredients</li>
                  </ul>
                </div>
              )}
              
              {formData.category === 'eaa' && (
                <div className="text-black">
                  <h3 className="font-semibold text-blue-800 mb-2">EAA Products:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Ingredient Transparency (60%):</strong> Complete ingredient disclosure and amino acid profile</li>
                    <li><strong>Dosage Accuracy (40%):</strong> Effective doses vs. underdosed ingredients</li>
                  </ul>
                </div>
              )}
              
              {formData.category === 'fat-burner' && (
                <div className="text-black">
                  <h3 className="font-semibold text-blue-800 mb-2">Fat Burner Products:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Ingredient Transparency (60%):</strong> Complete ingredient disclosure and stimulant content</li>
                    <li><strong>Dosage Accuracy (40%):</strong> Effective doses vs. underdosed ingredients</li>
                  </ul>
                </div>
              )}
              
              {formData.category === 'appetite-suppressant' && (
                <div className="text-black">
                  <h3 className="font-semibold text-blue-800 mb-2">Appetite Suppressant Products:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Ingredient Transparency (60%):</strong> Complete ingredient disclosure and mechanism clarity</li>
                    <li><strong>Dosage Accuracy (40%):</strong> Effective doses vs. underdosed ingredients</li>
                  </ul>
                </div>
              )}
              
              {formData.category === 'creatine' && (
                <div className="text-black">
                  <h3 className="font-semibold text-blue-800 mb-2">Creatine Products:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Ingredient Transparency (60%):</strong> Complete ingredient disclosure and form purity</li>
                    <li><strong>Dosage Accuracy (40%):</strong> Effective doses vs. underdosed ingredients</li>
                  </ul>
                </div>
              )}
              
              {!formData.category && (
                <div className="text-black">
                  <p className="text-sm">Select a product category above to see how transparency scores are calculated for that specific type of supplement.</p>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Transparency scores are automatically calculated based on the completeness and accuracy of the product information provided. Higher scores indicate better brand transparency and ingredient disclosure.
                </p>
              </div>
            </div>
          </div>


          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/contribute"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
