'use client';

import { BarChart3, FileText, Image, Users } from 'lucide-react';

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

export default function TypesTabContent() {
  return (
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
  );
}
