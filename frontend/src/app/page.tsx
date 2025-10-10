import { Shield, TrendingUp, Users } from 'lucide-react';

import Link from 'next/link';

import CategoryCard from '@/components/features/category-card';
import { categories } from '@/lib/data/categories';

export default function Home() {
  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='bg-gradient-to-br from-blue-50 to-indigo-100 py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h1 className='text-4xl md:text-6xl font-bold text-gray-900 mb-6'>
              Supplement
              <span className='text-blue-600'>IQ</span>
            </h1>
            <p className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto'>
              The transparency engine for the supplement industry. Discover real
              protein content, transparency scores, and make informed supplement
              choices.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/products'
                className='bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors'
              >
                Browse Products
              </Link>
              <Link
                href='/rankings'
                className='bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border border-blue-600 hover:bg-blue-50 transition-colors'
              >
                View Rankings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Why Choose SupplementIQ?
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              We provide transparency and accuracy in the supplement industry
              through community-driven data and scientific analysis.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Shield className='w-8 h-8 text-blue-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Transparency First
              </h3>
              <p className='text-gray-600'>
                Get real protein content and bioavailability scores, not just
                marketing claims.
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Users className='w-8 h-8 text-green-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Community Driven
              </h3>
              <p className='text-gray-600'>
                Wikipedia-style editing with community verification ensures
                accurate data.
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <TrendingUp className='w-8 h-8 text-purple-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Cost Efficiency
              </h3>
              <p className='text-gray-600'>
                Compare products by cost per effective gram of protein, not just
                price.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className='py-16 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Browse by Category
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              Explore supplements by category and find the best products for
              your needs.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {categories.map(category => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16 bg-blue-600'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='text-3xl font-bold text-white mb-4'>
            Ready to Make Informed Decisions?
          </h2>
          <p className='text-xl text-blue-100 mb-8 max-w-2xl mx-auto'>
            Join thousands of users who are already making better supplement
            choices with transparent data and community insights.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href='/products'
              className='bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors'
            >
              Start Exploring
            </Link>
            <Link
              href='/contribute'
              className='bg-transparent text-white px-8 py-3 rounded-lg font-semibold border border-white hover:bg-white hover:text-blue-600 transition-colors'
            >
              Contribute Data
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
