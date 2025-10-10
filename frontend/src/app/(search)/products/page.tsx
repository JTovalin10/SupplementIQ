'use client';

import { Filter, Grid, List, Search } from 'lucide-react';

import { useState } from 'react';

import { categories } from '@/lib/data/categories';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery, 'Category:', selectedCategory);
  };

  return (
    <>
      {/* Page Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>All Products</h1>
        <p className='text-black'>
          Discover supplements with transparency scores and real protein content
        </p>
      </div>

      {/* Search and Filters */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
        <form onSubmit={handleSearch} className='space-y-4'>
          {/* Search Bar */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5' />
            <input
              type='text'
              placeholder='Search products, brands, ingredients...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400'
            />
          </div>

          {/* Filters */}
          <div className='flex flex-wrap gap-4 items-center'>
            <div className='flex items-center space-x-2'>
              <Filter className='w-4 h-4 text-black' />
              <span className='text-sm font-medium text-black'>
                Filters:
              </span>
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black'
            >
              <option value=''>All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <div className='flex items-center space-x-2 ml-auto'>
              <span className='text-sm text-black'>View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-black hover:text-blue-600'}`}
              >
                <Grid className='w-4 h-4' />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-black hover:text-blue-600'}`}
              >
                <List className='w-4 h-4' />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='text-center py-12'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Search className='w-8 h-8 text-black' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            No products found
          </h3>
          <p className='text-black mb-4'>
            {searchQuery || selectedCategory
              ? 'Try adjusting your search criteria or filters'
              : 'Products will appear here once the database is populated'}
          </p>
          <div className='text-sm text-black'>
            Search query: "{searchQuery}" | Category:{' '}
            {selectedCategory || 'All'}
          </div>
        </div>
      </div>
    </>
  );
}
