import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className='bg-gray-50 border-t border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Brand */}
          <div className='col-span-1 md:col-span-2'>
            <div className='flex items-center space-x-2 mb-4'>
              <Shield className='h-6 w-6 text-blue-600' />
              <span className='text-lg font-bold text-gray-900'>
                Supplement<span className='text-blue-600'>IQ</span>
              </span>
            </div>
            <p className='text-gray-600 text-sm max-w-md'>
              The transparency engine for the supplement industry. Discover real protein content, 
              transparency scores, and make informed supplement choices.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className='text-sm font-semibold text-gray-900 mb-4'>Quick Links</h3>
            <ul className='space-y-2'>
              <li>
                <Link href='/products' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                  Products
                </Link>
              </li>
              <li>
                <Link href='/rankings' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                  Rankings
                </Link>
              </li>
              <li>
                <Link href='/contribute' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                  Contribute
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className='text-sm font-semibold text-gray-900 mb-4'>Support</h3>
            <ul className='space-y-2'>
              <li>
                <Link href='/about' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                  About
                </Link>
              </li>
              <li>
                <Link href='/contact' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                  Contact
                </Link>
              </li>
              <li>
                <Link href='/privacy' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className='border-t border-gray-200 mt-8 pt-8'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <p className='text-gray-500 text-sm'>
              © 2024 SupplementIQ. All rights reserved.
            </p>
            <div className='flex space-x-6 mt-4 md:mt-0'>
              <Link href='/terms' className='text-gray-500 hover:text-blue-600 transition-colors text-sm'>
                Terms of Service
              </Link>
              <Link href='/privacy' className='text-gray-500 hover:text-blue-600 transition-colors text-sm'>
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}