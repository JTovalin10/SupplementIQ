'use client';

import { ArrowLeft, Filter, Grid, List, Search } from 'lucide-react';

import { useState } from 'react';

import Link from 'next/link';

import { Category, categories } from '@/lib/data/categories';

interface CategoryPageProps {
  categoryId: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export default function CategoryPage({
  categoryId,
  title,
  description,
  icon,
  color,
}: CategoryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('transparency');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching in', title, 'for:', searchQuery);
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav className='mb-6'>
        <div className='flex items-center space-x-2 text-sm text-gray-500'>
          <Link href='/' className='hover:text-blue-600'>
            Home
          </Link>
          <span>/</span>
          <Link href='/products' className='hover:text-blue-600'>
            Products
          </Link>
          <span>/</span>
          <span className='text-gray-900'>{title}</span>
        </div>
      </nav>

      {/* Category Header */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
        <div className='flex items-center space-x-4 mb-4'>
          <div
            className={`w-16 h-16 ${color} rounded-lg flex items-center justify-center text-white text-3xl`}
          >
            {icon}
          </div>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>{title}</h1>
            <p className='text-gray-600 mt-1'>{description}</p>
          </div>
        </div>

        <div className='flex items-center space-x-6 text-sm text-gray-500'>
          <span>1,247 products</span>
          <span>•</span>
          <span>Avg. Transparency: 67%</span>
          <span>•</span>
          <span>Top Brand: Optimum Nutrition</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
        <form onSubmit={handleSearch} className='space-y-4'>
          {/* Search Bar */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
            <input
              type='text'
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Filters and Controls */}
          <div className='flex flex-wrap gap-4 items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2'>
                <Filter className='w-4 h-4 text-gray-500' />
                <span className='text-sm font-medium text-gray-700'>
                  Sort by:
                </span>
              </div>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value='transparency'>Transparency Score</option>
                <option value='cost'>Cost Efficiency</option>
                <option value='protein'>Effective Protein</option>
                <option value='price'>Price</option>
                <option value='rating'>User Rating</option>
              </select>
            </div>

            <div className='flex items-center space-x-2'>
              <span className='text-sm text-gray-500'>View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className='w-4 h-4' />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
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
            <Search className='w-8 h-8 text-gray-400' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            No {title.toLowerCase()} found
          </h3>
          <p className='text-gray-600 mb-4'>
            {searchQuery
              ? 'Try adjusting your search criteria'
              : `${title} products will appear here once the database is populated`}
          </p>
          <div className='text-sm text-gray-500'>
            Search query: "{searchQuery}" | Sort by: {sortBy} | View: {viewMode}
          </div>
        </div>
      </div>
    </>
  );
}
