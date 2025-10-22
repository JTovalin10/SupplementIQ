'use client';

import Link from 'next/link';

interface ContributeHeroProps {
  isAuthenticated: boolean;
  onShowGuidelines: () => void;
  showGuidelines: boolean;
}

export default function ContributeHero({ 
  isAuthenticated, 
  onShowGuidelines, 
  showGuidelines 
}: ContributeHeroProps) {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Contribute to SupplementIQ
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Help build the most comprehensive and transparent supplement database. 
            Add new products, update existing ones, and make better supplement 
            choices possible for everyone.
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
              onClick={onShowGuidelines}
              className="bg-transparent text-white px-8 py-3 rounded-lg font-semibold border border-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              {showGuidelines ? 'Hide Guidelines' : 'View Guidelines'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
