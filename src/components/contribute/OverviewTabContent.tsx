'use client';

import { Award, Target, Users, Zap } from 'lucide-react';

interface OverviewTabContentProps {
  onShowGuidelines: () => void;
}

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

export default function OverviewTabContent({ onShowGuidelines }: OverviewTabContentProps) {
  return (
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
          <span className="text-yellow-500 mr-2">💡</span>
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
            onClick={onShowGuidelines}
            className="text-blue-600 hover:text-blue-700 font-medium underline"
          >
            View Contribution Guidelines →
          </button>
        </div>
      </div>
    </div>
  );
}
