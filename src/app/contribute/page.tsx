'use client';

import {
    Award,
    BarChart3,
    FileText,
    Image,
    Lightbulb,
    Target,
    Users,
    Zap
} from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '@/lib/contexts/AppContext';
import Link from 'next/link';

export default function ContributePage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'types' | 'transparency'>('overview');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [ingredientValues, setIngredientValues] = useState<{[key: string]: string | number}>({});
  const [isStimulant, setIsStimulant] = useState(false);

  const handleIngredientChange = (fieldName: string, value: string) => {
    setIngredientValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleIngredientAction = (fieldName: string, action: 'not_in_product' | 'not_specified') => {
    const currentValue = ingredientValues[fieldName];
    
    if (action === 'not_in_product') {
      if (currentValue === -1) {
        // If already "not in product", clear it
        setIngredientValues(prev => ({
          ...prev,
          [fieldName]: ''
        }));
      } else {
        // Set to "not in product"
        setIngredientValues(prev => ({
          ...prev,
          [fieldName]: -1
        }));
      }
    } else if (action === 'not_specified') {
      if (currentValue === 0) {
        // If already "not specified", clear it
        setIngredientValues(prev => ({
          ...prev,
          [fieldName]: ''
        }));
      } else {
        // Set to "not specified"
        setIngredientValues(prev => ({
          ...prev,
          [fieldName]: 0
        }));
      }
    }
  };

  const getButtonState = (fieldName: string) => {
    const value = ingredientValues[fieldName];
    if (value === -1) return 'not_in_product';
    if (value === 0) return 'not_specified';
    return 'normal';
  };

  const contributionTypes = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'New Product Submissions',
      description: 'Submit completely new products that don\'t exist in our database yet',
      examples: ['New protein powders', 'Latest pre-workout supplements', 'Recently launched products'],
      color: 'blue'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Product Updates',
      description: 'Update existing products with new information or corrections',
      examples: ['Updated serving sizes', 'Corrected brand information', 'New product descriptions'],
      color: 'green'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Nutrition Facts',
      description: 'Contribute accurate nutrition labels and ingredient breakdowns',
      examples: ['Lab test results', 'Official nutrition facts', 'Ingredient percentages'],
      color: 'green'
    },
    {
      icon: <Image className="w-6 h-6" />,
      title: 'Product Images',
      description: 'Provide official product image URLs from manufacturer websites',
      examples: ['Official product photos', 'Manufacturer websites', 'Verified retailer images'],
      color: 'purple'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Verification',
      description: 'Review and verify contributions from other community members',
      examples: ['Fact-checking data', 'Validating sources', 'Quality control'],
      color: 'orange'
    }
  ];

  const guidelines = [
    {
      title: 'Get Information from Verified Sources',
      description: 'Get all information directly from the supplier or a verified supplier. All images of the product should also be uploaded with a direct web link from the brands website or a direct supplier.'
    },
    {
      title: 'Be Accurate',
      description: 'Double-check all information before submitting. Accuracy is more important than speed.'
    },
    {
      title: 'Provide Context',
      description: 'Include notes explaining your sources and any relevant context for your contribution.'
    },
    {
      title: 'Avoid Speculation',
      description: 'Only submit information you can verify. Don\'t guess or estimate without clear indicators.'
    },
    {
      title: 'Respect Privacy',
      description: 'Don\'t share personal information or confidential data in your contributions.'
    }
  ];

  const benefits = [
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Build Reputation',
      description: 'Earn reputation points and badges for quality contributions',
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Help the Community',
      description: 'Make supplement data more transparent and accessible for everyone',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Early Access',
      description: 'Get early access to new features and beta testing opportunities',
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Join the Community',
      description: 'Connect with other supplement enthusiasts and industry experts',
      color: 'bg-green-50 text-green-700 border-green-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Contribute to SupplementIQ
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Help build the most comprehensive and transparent supplement database. 
              Add new products, update existing ones, and make better supplement choices possible for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contribute/new-product"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Add New Product
              </Link>
              <Link
                href="/products"
                className="bg-transparent text-white px-8 py-3 rounded-lg font-semibold border border-white hover:bg-white hover:text-blue-600 transition-colors"
              >
                Update Existing Product
              </Link>
              <button 
                onClick={() => setShowGuidelines(!showGuidelines)}
                className="bg-transparent text-white px-8 py-3 rounded-lg font-semibold border border-white hover:bg-white hover:text-blue-600 transition-colors"
              >
                {showGuidelines ? 'Hide Guidelines' : 'View Guidelines'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines Section */}
      {showGuidelines && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Contribution Guidelines
              </h2>
              <div className="space-y-6">
                {guidelines.map((guideline, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                      <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {guideline.title}
                      </h3>
                      <p className="text-gray-600">{guideline.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">
                  Need Help Getting Started?
                </h3>
                <p className="text-blue-800 mb-6">
                  Our community is here to help! Join our Discord server or check out our 
                  detailed contribution guide for step-by-step instructions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/help"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Help Center
                  </Link>
                  <button className="bg-transparent text-blue-600 px-6 py-2 rounded-lg font-medium border border-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                    Join Discord
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Navigation Tabs */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'types'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contribution Types
            </button>
            <button
              onClick={() => setActiveTab('transparency')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transparency'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transparency Score
            </button>
          </nav>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'overview' && (
            <div className="space-y-16">
              {/* How It Works */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                  How It Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">1</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Find a Product</h3>
                    <p className="text-gray-600">Search for products that need information or corrections</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-green-600">2</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit Data</h3>
                    <p className="text-gray-600">Upload your information with proper sources and context</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-purple-600">3</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Review</h3>
                    <p className="text-gray-600">Other users verify and validate your contribution</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-orange-600">4</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Published</h3>
                    <p className="text-gray-600">Approved contributions go live and help everyone</p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                  Why Contribute?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-lg border-2 ${benefit.color}`}
                    >
                      <div className="mb-4">{benefit.icon}</div>
                      <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Start */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <Lightbulb className="w-6 h-6 inline mr-2" />
                  Quick Start
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">For Beginners</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Submit new products from your favorite brands</li>
                      <li>• Add official product image URLs</li>
                      <li>• Correct obvious typos or errors</li>
                      <li>• Review other contributions</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">For Experts</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Submit lab test results</li>
                      <li>• Add detailed ingredient breakdowns</li>
                      <li>• Provide transparency analysis</li>
                      <li>• Mentor new contributors</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-gray-600 mb-3">
                    <strong>Before you start:</strong> Make sure to read our contribution guidelines to ensure quality submissions.
                  </p>
                  <button 
                    onClick={() => setShowGuidelines(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium underline"
                  >
                    View Contribution Guidelines →
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'types' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Types of Contributions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {contributionTypes.map((type, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className={`w-12 h-12 bg-${type.color}-100 rounded-lg flex items-center justify-center mb-4 text-${type.color}-600`}>
                      {type.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{type.title}</h3>
                    <p className="text-gray-600 mb-4">{type.description}</p>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Examples:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {type.examples.map((example, idx) => (
                          <li key={idx}>• {example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'transparency' && (
            <div className="space-y-8">
              {/* Category Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Select Product Category
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['protein', 'pre-workout', 'energy-drink', 'bcaa', 'eaa', 'fat-burner', 'appetite-suppressant', 'creatine'].map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`p-4 rounded-lg border-2 text-center font-medium transition-colors ${
                        selectedCategory === category
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transparency Score Calculation */}
              {selectedCategory && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-8">
                  <h2 className="text-2xl font-bold text-blue-900 mb-6">
                    How Transparency Score is Calculated for {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).replace('-', ' ')} Products
                  </h2>
                  
                  <div className="space-y-4">
                    {selectedCategory === 'protein' && (
                      <div className="text-black">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Default Testing Scenarios:</h4>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                              <li><strong>Ingredient Disclosure (40%):</strong> Complete ingredient list with amounts</li>
                              <li><strong>Absorption Claims (30%):</strong> How close ingredients are to what they claim (bioavailability)</li>
                              <li><strong>Manufacturing Info (20%):</strong> Facility certifications (GMP, NSF, etc.)</li>
                              <li><strong>Brand Transparency (10%):</strong> Open communication about sourcing and quality</li>
                            </ul>
                          </div>
                          <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-3 rounded">
                            <h4 className="font-semibold text-sm mb-1 text-green-800">Lab Test Verified Scenario:</h4>
                            <p className="text-sm text-green-700">If product has third-party lab testing showing protein content matches or exceeds label claims → <strong>VERIFIED</strong> status (highest transparency score)</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedCategory === 'pre-workout' && (
                      <div className="text-black">
                        <ul className="list-disc list-inside space-y-2 text-sm">
                          <li><strong>Stimulant Disclosure (35%):</strong> Clear caffeine and stimulant amounts</li>
                          <li><strong>Ingredient Transparency (25%):</strong> Proprietary blend breakdown</li>
                          <li><strong>Dosage Accuracy (25%):</strong> Clinical doses vs. underdosed ingredients</li>
                          <li><strong>Safety Information (15%):</strong> Proper usage warnings and contraindications</li>
                        </ul>
                      </div>
                    )}
                    
                    {selectedCategory === 'energy-drink' && (
                      <div className="text-black">
                        <ul className="list-disc list-inside space-y-2 text-sm">
                          <li><strong>Nootropic Transparency (30%):</strong> Clear cognitive enhancement claims</li>
                          <li><strong>Caffeine Disclosure (25%):</strong> Exact caffeine content and source</li>
                          <li><strong>Vitamin Information (25%):</strong> Bioavailable forms and amounts</li>
                          <li><strong>Sweetener Clarity (20%):</strong> Artificial vs. natural sweetener disclosure</li>
                        </ul>
                      </div>
                    )}
                    
                    {selectedCategory === 'bcaa' && (
                      <div className="text-black">
                        <ul className="list-disc list-inside space-y-2 text-sm">
                          <li><strong>Ratio Accuracy (40%):</strong> Correct 2:1:1 or custom ratios</li>
                          <li><strong>Purity Standards (30%):</strong> Fermentation vs. synthetic sources</li>
                          <li><strong>Third-Party Testing (20%):</strong> Purity and contamination testing</li>
                          <li><strong>Absorption Claims (10%):</strong> Evidence-based absorption enhancers</li>
                        </ul>
                      </div>
                    )}
                    
                    {selectedCategory === 'eaa' && (
                      <div className="text-black">
                        <ul className="list-disc list-inside space-y-2 text-sm">
                          <li><strong>Complete Profile (35%):</strong> All 9 essential amino acids present</li>
                          <li><strong>Optimal Ratios (30%):</strong> Clinically effective amino acid ratios</li>
                          <li><strong>Quality Sourcing (20%):</strong> Fermentation vs. hydrolysis methods</li>
                          <li><strong>Testing Standards (15%):</strong> Heavy metal and purity testing</li>
                        </ul>
                      </div>
                    )}
                    
                    {selectedCategory === 'fat-burner' && (
                      <div className="text-black">
                        <ul className="list-disc list-inside space-y-2 text-sm">
                          <li><strong>Stimulant Warning (35%):</strong> Clear stimulant content and warnings</li>
                          <li><strong>Clinical Evidence (25%):</strong> Research-backed ingredient claims</li>
                          <li><strong>Dosage Transparency (25%):</strong> Effective vs. underdosed amounts</li>
                          <li><strong>Safety Profile (15%):</strong> Side effects and contraindications</li>
                        </ul>
                      </div>
                    )}
                    
                    {selectedCategory === 'appetite-suppressant' && (
                      <div className="text-black">
                        <ul className="list-disc list-inside space-y-2 text-sm">
                          <li><strong>Mechanism Clarity (30%):</strong> How appetite suppression works</li>
                          <li><strong>Clinical Studies (30%):</strong> Human research supporting claims</li>
                          <li><strong>Safety Information (25%):</strong> Side effects and interactions</li>
                          <li><strong>Usage Guidelines (15%):</strong> Proper timing and dosing</li>
                        </ul>
                      </div>
                    )}
                    
                    {selectedCategory === 'creatine' && (
                      <div className="text-black">
                        <ul className="list-disc list-inside space-y-2 text-sm">
                          <li><strong>Form Purity (40%):</strong> Creatine monohydrate vs. other forms</li>
                          <li><strong>Manufacturing Process (30%):</strong> German vs. Chinese sourcing</li>
                          <li><strong>Testing Standards (20%):</strong> Heavy metal and impurity testing</li>
                          <li><strong>Dosage Accuracy (10%):</strong> Correct serving sizes</li>
                        </ul>
                      </div>
                    )}
                    
                    <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Transparency scores are automatically calculated based on the completeness and accuracy of the product information provided. Higher scores indicate better brand transparency and ingredient disclosure.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ingredient Input Section */}
              {selectedCategory && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Input Ingredient Amounts
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Enter the ingredient amounts found in your product. Use the buttons to mark ingredients as "Not in product" or "Not specified" if the information isn't available.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* This will show different ingredients based on selected category */}
                    {selectedCategory === 'protein' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Protein Type</label>
                          <div className="flex gap-2">
                            <select 
                              value={ingredientValues.protein_type === 0 ? '' : ingredientValues.protein_type || ''}
                              onChange={(e) => handleIngredientChange('protein_type', e.target.value)}
                              disabled={ingredientValues.protein_type === 0}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-black disabled:bg-gray-100"
                            >
                              <option value="">Select protein type</option>
                              <option value="whey_isolate">Whey Isolate (~25g/serving)</option>
                              <option value="whey_concentrate">Whey Concentrate (~20g/serving)</option>
                              <option value="plant_blend">Plant Blend (~20g/serving)</option>
                              <option value="casein">Casein (~24g/serving)</option>
                              <option value="egg_protein">Egg Protein (~24g/serving)</option>
                              <option value="collagen">Collagen (~20g/serving)</option>
                            </select>
                            <button 
                              onClick={() => handleIngredientAction('protein_type', 'not_specified')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('protein_type') === 'not_specified' 
                                  ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not specified
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Protein Claim (g)</label>
                          <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black" placeholder="25" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Effective Protein (g)</label>
                          <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black" placeholder="24" />
                        </div>
                        <div className="md:col-span-2">
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 className="text-sm font-semibold text-black mb-3">Testing Type</h4>
                            <div className="space-y-3">
                              <label className="flex items-start space-x-3">
                                <input 
                                  type="radio" 
                                  name="protein_testing_type"
                                  value="default"
                                  defaultChecked
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5" 
                                />
                                <div>
                                  <span className="text-sm font-medium text-black">Default Testing</span>
                                  <p className="text-xs text-gray-600 mt-1">Standard transparency scoring based on ingredient disclosure, absorption claims, manufacturing info, and brand transparency</p>
                                </div>
                              </label>
                              <label className="flex items-start space-x-3">
                                <input 
                                  type="radio" 
                                  name="protein_testing_type"
                                  value="lab_verified"
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5" 
                                />
                                <div>
                                  <span className="text-sm font-medium text-black">Lab Test Verified</span>
                                  <p className="text-xs text-gray-600 mt-1">Product has Certificate of Analysis (COA) from reputable lab showing protein content matches or exceeds label claims</p>
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedCategory === 'pre-workout' && (
                      <>
                        <div className="md:col-span-2">
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              checked={isStimulant}
                              onChange={(e) => setIsStimulant(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                            />
                            <span className="text-sm font-medium text-black">Stimulant-based pre-workout</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Caffeine Anhydrous (mg)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={ingredientValues.caffeine_anhydrous_mg === -1 || ingredientValues.caffeine_anhydrous_mg === 0 ? '' : ingredientValues.caffeine_anhydrous_mg || ''}
                              onChange={(e) => handleIngredientChange('caffeine_anhydrous_mg', e.target.value)}
                              disabled={ingredientValues.caffeine_anhydrous_mg === -1 || ingredientValues.caffeine_anhydrous_mg === 0}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-black disabled:bg-gray-100" 
                              placeholder="350" 
                            />
                            <button 
                              onClick={() => handleIngredientAction('caffeine_anhydrous_mg', 'not_in_product')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('caffeine_anhydrous_mg') === 'not_in_product' 
                                  ? 'bg-red-100 border-red-300 text-red-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not in product
                            </button>
                            <button 
                              onClick={() => handleIngredientAction('caffeine_anhydrous_mg', 'not_specified')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('caffeine_anhydrous_mg') === 'not_specified' 
                                  ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not specified
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">L-Citrulline (mg)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={ingredientValues.l_citrulline_mg === -1 || ingredientValues.l_citrulline_mg === 0 ? '' : ingredientValues.l_citrulline_mg || ''}
                              onChange={(e) => handleIngredientChange('l_citrulline_mg', e.target.value)}
                              disabled={ingredientValues.l_citrulline_mg === -1 || ingredientValues.l_citrulline_mg === 0}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-black disabled:bg-gray-100" 
                              placeholder="9000" 
                            />
                            <button 
                              onClick={() => handleIngredientAction('l_citrulline_mg', 'not_in_product')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('l_citrulline_mg') === 'not_in_product' 
                                  ? 'bg-red-100 border-red-300 text-red-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not in product
                            </button>
                            <button 
                              onClick={() => handleIngredientAction('l_citrulline_mg', 'not_specified')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('l_citrulline_mg') === 'not_specified' 
                                  ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not specified
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Creatine Monohydrate (mg)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={ingredientValues.creatine_monohydrate_mg === -1 || ingredientValues.creatine_monohydrate_mg === 0 ? '' : ingredientValues.creatine_monohydrate_mg || ''}
                              onChange={(e) => handleIngredientChange('creatine_monohydrate_mg', e.target.value)}
                              disabled={ingredientValues.creatine_monohydrate_mg === -1 || ingredientValues.creatine_monohydrate_mg === 0}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-black disabled:bg-gray-100" 
                              placeholder="5000" 
                            />
                            <button 
                              onClick={() => handleIngredientAction('creatine_monohydrate_mg', 'not_in_product')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('creatine_monohydrate_mg') === 'not_in_product' 
                                  ? 'bg-red-100 border-red-300 text-red-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not in product
                            </button>
                            <button 
                              onClick={() => handleIngredientAction('creatine_monohydrate_mg', 'not_specified')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('creatine_monohydrate_mg') === 'not_specified' 
                                  ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not specified
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Beta-Alanine (mg)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={ingredientValues.beta_alanine_mg === -1 || ingredientValues.beta_alanine_mg === 0 ? '' : ingredientValues.beta_alanine_mg || ''}
                              onChange={(e) => handleIngredientChange('beta_alanine_mg', e.target.value)}
                              disabled={ingredientValues.beta_alanine_mg === -1 || ingredientValues.beta_alanine_mg === 0}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-black disabled:bg-gray-100" 
                              placeholder="3200" 
                            />
                            <button 
                              onClick={() => handleIngredientAction('beta_alanine_mg', 'not_in_product')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('beta_alanine_mg') === 'not_in_product' 
                                  ? 'bg-red-100 border-red-300 text-red-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not in product
                            </button>
                            <button 
                              onClick={() => handleIngredientAction('beta_alanine_mg', 'not_specified')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('beta_alanine_mg') === 'not_specified' 
                                  ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not specified
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">L-Tyrosine (mg)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={ingredientValues.l_tyrosine_mg === -1 || ingredientValues.l_tyrosine_mg === 0 ? '' : ingredientValues.l_tyrosine_mg || ''}
                              onChange={(e) => handleIngredientChange('l_tyrosine_mg', e.target.value)}
                              disabled={ingredientValues.l_tyrosine_mg === -1 || ingredientValues.l_tyrosine_mg === 0}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-black disabled:bg-gray-100" 
                              placeholder="1500" 
                            />
                            <button 
                              onClick={() => handleIngredientAction('l_tyrosine_mg', 'not_in_product')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('l_tyrosine_mg') === 'not_in_product' 
                                  ? 'bg-red-100 border-red-300 text-red-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not in product
                            </button>
                            <button 
                              onClick={() => handleIngredientAction('l_tyrosine_mg', 'not_specified')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('l_tyrosine_mg') === 'not_specified' 
                                  ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not specified
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Betaine Anhydrous (mg)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={ingredientValues.betaine_anhydrous_mg === -1 || ingredientValues.betaine_anhydrous_mg === 0 ? '' : ingredientValues.betaine_anhydrous_mg || ''}
                              onChange={(e) => handleIngredientChange('betaine_anhydrous_mg', e.target.value)}
                              disabled={ingredientValues.betaine_anhydrous_mg === -1 || ingredientValues.betaine_anhydrous_mg === 0}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-black disabled:bg-gray-100" 
                              placeholder="2500" 
                            />
                            <button 
                              onClick={() => handleIngredientAction('betaine_anhydrous_mg', 'not_in_product')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('betaine_anhydrous_mg') === 'not_in_product' 
                                  ? 'bg-red-100 border-red-300 text-red-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not in product
                            </button>
                            <button 
                              onClick={() => handleIngredientAction('betaine_anhydrous_mg', 'not_specified')}
                              className={`px-3 py-2 text-xs border rounded-lg ${
                                getButtonState('betaine_anhydrous_mg') === 'not_specified' 
                                  ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Not specified
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedCategory === 'energy-drink' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Caffeine (mg)</label>
                          <div className="flex gap-2">
                            <input type="number" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-black" placeholder="200" />
                            <button className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded-lg">Not in product</button>
                            <button className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded-lg">Not specified</button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">N-Acetyl L-Tyrosine (mg)</label>
                          <div className="flex gap-2">
                            <input type="number" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-black" placeholder="1000" />
                            <button className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded-lg">Not in product</button>
                            <button className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded-lg">Not specified</button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">Alpha GPC (mg)</label>
                          <div className="flex gap-2">
                            <input type="number" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-black" placeholder="400" />
                            <button className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded-lg">Not in product</button>
                            <button className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded-lg">Not specified</button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">L-Theanine (mg)</label>
                          <div className="flex gap-2">
                            <input type="number" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-black" placeholder="100" />
                            <button className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded-lg">Not in product</button>
                            <button className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded-lg">Not specified</button>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Add similar sections for other categories */}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        href="/contribute/new-product"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                      >
                        Submit This Product
                      </Link>
                      <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                        Calculate Transparency Score
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of contributors building the future of transparent supplement data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contribute/new-product"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Add New Product
            </Link>
            <Link
              href="/products"
              className="bg-transparent text-white px-8 py-3 rounded-lg font-semibold border border-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Update Existing
            </Link>
            {!isAuthenticated && (
              <Link
                href="/register"
                className="bg-transparent text-white px-8 py-3 rounded-lg font-semibold border border-white hover:bg-white hover:text-blue-600 transition-colors"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


