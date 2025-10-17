'use client';

import { LogOut, Menu, Search, Settings, Shield, User } from 'lucide-react';

import { useState } from 'react';

import { useJWTAuth } from '@/lib/contexts/JWTAuthContext';
import Link from 'next/link';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useJWTAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search navigation
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <header className='bg-white shadow-sm border-b'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link href='/' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-lg'>S</span>
              </div>
              <span className='text-xl font-bold text-gray-900'>
                SupplementIQ
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className='flex-1 max-w-lg mx-6'>
            <form onSubmit={handleSearch} className='relative'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4' />
                <input
                  type='text'
                  placeholder='Search products, brands, ingredients...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-black'
                />
              </div>
            </form>
          </div>

          {/* Navigation */}
          <div className='hidden md:flex items-center space-x-8 mr-12'>
            <Link
              href='/products'
              className='text-black hover:text-blue-600 font-medium'
            >
              Products
            </Link>
            <Link
              href='/rankings'
              className='text-black hover:text-blue-600 font-medium'
            >
              Rankings
            </Link>
            <Link
              href='/brands'
              className='text-black hover:text-blue-600 font-medium'
            >
              Brands
            </Link>
          </div>

          {/* User Actions */}
          <div className='flex items-center space-x-4'>
            {isAuthenticated ? (
              <>
                {/* User Menu */}
                <div className='flex items-center space-x-4'>
                  <span className='hidden sm:block text-sm text-black'>
                    Welcome, {user?.username}
                  </span>
                  <Link
                    href='/user/profile'
                    className='p-2 text-gray-400 hover:text-gray-600'
                    title='Profile'
                  >
                    <User className='w-5 h-5' />
                  </Link>
                  
                  {/* Admin/Owner Dashboard Button */}
                  {(user?.role === 'admin' || user?.role === 'owner') && (
                    <Link
                      href={user.role === 'owner' ? '/owner' : '/admin/dashboard'}
                      className='p-2 text-gray-400 hover:text-gray-600'
                      title={`${user.role === 'owner' ? 'Owner' : 'Admin'} Dashboard`}
                    >
                      {user.role === 'owner' ? (
                        <Shield className='w-5 h-5' />
                      ) : (
                        <Settings className='w-5 h-5' />
                      )}
                    </Link>
                  )}
                  
                  <button
                    onClick={logout}
                    className='p-2 text-gray-400 hover:text-gray-600'
                    title='Logout'
                  >
                    <LogOut className='w-5 h-5' />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Auth Buttons */}
                <div className='hidden md:flex items-center space-x-3'>
                  <Link
                    href='/login'
                    className='text-black hover:text-blue-600 font-medium'
                  >
                    Sign In
                  </Link>
                  <Link
                    href='/register'
                    className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium'
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            )}
            <button
              className='md:hidden p-2 text-gray-400 hover:text-gray-600'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className='md:hidden border-t border-gray-200 py-4'>
            <div className='flex flex-col space-y-4'>
              <Link
                href='/products'
                className='text-black hover:text-blue-600 font-medium'
              >
                Products
              </Link>
              <Link
                href='/rankings'
                className='text-black hover:text-blue-600 font-medium'
              >
                Rankings
              </Link>
              <Link
                href='/brands'
                className='text-black hover:text-blue-600 font-medium'
              >
                Brands
              </Link>
              
              {/* Mobile Auth Section */}
              {isAuthenticated ? (
                <>
                  <div className='border-t border-gray-200 pt-4 mt-4'>
                    <div className='flex items-center space-x-2 mb-3'>
                      <User className='w-5 h-5 text-gray-400' />
                      <span className='text-sm text-black'>
                        {user?.username}
                      </span>
                    </div>
                    <Link
                      href='/user/profile'
                      className='block text-black hover:text-blue-600 font-medium mb-2'
                    >
                      Profile
                    </Link>
                    
                    {/* Admin/Owner Dashboard Link for Mobile */}
                    {(user?.role === 'admin' || user?.role === 'owner') && (
                      <Link
                        href={user.role === 'owner' ? '/owner' : '/admin/dashboard'}
                        className='block text-black hover:text-blue-600 font-medium mb-2'
                      >
                        {user.role === 'owner' ? 'Owner Dashboard' : 'Admin Dashboard'}
                      </Link>
                    )}
                    
                    <button
                      onClick={logout}
                      className='block text-black hover:text-blue-600 font-medium'
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className='border-t border-gray-200 pt-4 mt-4'>
                    <Link
                      href='/login'
                      className='block text-black hover:text-blue-600 font-medium mb-2'
                    >
                      Sign In
                    </Link>
                    <Link
                      href='/register'
                      className='block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center'
                    >
                      Sign Up
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
