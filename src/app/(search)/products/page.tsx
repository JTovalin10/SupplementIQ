'use client';

import { Filter, Grid, List, Search, Star } from 'lucide-react';

import { useEffect, useState } from 'react';

import { categories } from '@/lib/config/data/categories';

interface Product {
  id: number;
  name: string;
  slug: string;
  image_url?: string;
  category: string;
  brand?: {
    id: number;
    name: string;
  };
  dosage_rating?: number;
  danger_rating?: number;
  community_rating?: number;
  total_reviews?: number;
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
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
              placeholder='Search products, brands...'
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
        {isLoading ? (
          <div className='text-center py-12'>
            <div className='text-gray-600'>Loading products...</div>
          </div>
        ) : error ? (
          <div className='text-center py-12'>
            <div className='text-red-600'>{error}</div>
          </div>
        ) : products.length === 0 ? (
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
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {products.map((product) => (
              <a 
                key={product.id} 
                href={`/products/${product.slug}`}
                className='border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow block'
              >
                {/* Product Image */}
                <div className='w-full h-64 bg-gray-200 flex items-center justify-center overflow-hidden'>
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className='w-full h-full object-contain'
                    />
                  ) : (
                    <div className='text-gray-400'>No Image</div>
                  )}
                </div>
                
                {/* Product Information */}
                <div className='p-4'>
                  {/* Brand Name */}
                  <p className='text-lg font-bold text-gray-900 uppercase'>{product.brand?.name || 'Unknown Brand'}</p>
                  
                  {/* Product Type */}
                  <p className='text-sm font-semibold text-red-600 mt-1'>{product.category}</p>
                  
                  {/* Ratings Display */}
                  <div className='mt-3 space-y-1'>
                    {/* Dosage Rating */}
                    {product.dosage_rating !== undefined && (
                      <div className='text-xs text-gray-600'>
                        <span className='font-medium'>Dosage: </span>
                        <span className='text-blue-600 font-semibold'>{product.dosage_rating}/100</span>
                      </div>
                    )}
                    
                    {/* Danger Rating */}
                    {product.danger_rating !== undefined && (
                      <div className='text-xs text-gray-600'>
                        <span className='font-medium'>Safety: </span>
                        <span className={`font-semibold ${
                          product.danger_rating === 0 ? 'text-green-600' :
                          product.danger_rating < 50 ? 'text-yellow-600' :
                          product.danger_rating < 75 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {product.danger_rating}/100
                        </span>
                      </div>
                    )}
                    
                    {/* Community Rating */}
                    <div className='flex items-center'>
                      <div className='flex'>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.community_rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-300 text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {product.total_reviews && product.total_reviews > 0 ? (
                        <span className='ml-2 text-sm font-semibold text-red-600'>
                          {product.community_rating?.toFixed(1) || '0.0'} ({product.total_reviews})
                        </span>
                      ) : (
                        <span className='ml-2 text-sm text-gray-500'>No ratings</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Product Name */}
                  <p className='mt-3 font-semibold text-gray-900'>{product.name}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
