'use client';

import { useAuth, useUser } from '@/lib/contexts/AppContext';
import { LogOut, Menu, Shield, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className='bg-white shadow-sm border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link href='/' className='flex items-center space-x-2'>
              <Shield className='h-8 w-8 text-blue-600' />
              <span className='text-xl font-bold text-gray-900'>
                Supplement<span className='text-blue-600'>IQ</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center space-x-8'>
            <Link href='/products' className='text-gray-700 hover:text-blue-600 transition-colors'>
              Products
            </Link>
            <Link href='/rankings' className='text-gray-700 hover:text-blue-600 transition-colors'>
              Rankings
            </Link>
            <Link href='/contribute' className='text-gray-700 hover:text-blue-600 transition-colors'>
              Contribute
            </Link>
          </nav>

          {/* User Menu */}
          <div className='flex items-center space-x-4'>
            {isAuthenticated ? (
              <div className='flex items-center space-x-4'>
                <span className='text-sm text-gray-700'>
                  Welcome, {user?.username || user?.email}
                </span>
                <div className='flex items-center space-x-2'>
                  <Link
                    href='/user/dashboard'
                    className='flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors'
                  >
                    <User className='h-4 w-4' />
                    <span className='text-sm'>Dashboard</span>
                  </Link>
                  {user?.role === 'admin' || user?.role === 'owner' ? (
                    <Link
                      href='/admin/dashboard'
                      className='flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors'
                    >
                      <Shield className='h-4 w-4' />
                      <span className='text-sm'>Admin</span>
                    </Link>
                  ) : null}
                  <button
                    onClick={handleLogout}
                    className='flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors'
                  >
                    <LogOut className='h-4 w-4' />
                    <span className='text-sm'>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className='flex items-center space-x-4'>
                <Link
                  href='/login'
                  className='text-gray-700 hover:text-blue-600 transition-colors'
                >
                  Login
                </Link>
                <Link
                  href='/signup'
                  className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100'
            >
              <Menu className='h-5 w-5' />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className='md:hidden border-t border-gray-200 py-4'>
            <div className='flex flex-col space-y-4'>
              <Link href='/products' className='text-gray-700 hover:text-blue-600 transition-colors'>
                Products
              </Link>
              <Link href='/rankings' className='text-gray-700 hover:text-blue-600 transition-colors'>
                Rankings
              </Link>
              <Link href='/contribute' className='text-gray-700 hover:text-blue-600 transition-colors'>
                Contribute
              </Link>
              {isAuthenticated && (
                <>
                  <Link href='/user/dashboard' className='text-gray-700 hover:text-blue-600 transition-colors'>
                    Dashboard
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'owner') && (
                    <Link href='/admin/dashboard' className='text-gray-700 hover:text-blue-600 transition-colors'>
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className='text-left text-gray-700 hover:text-red-600 transition-colors'
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}