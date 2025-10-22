'use client';

import Link from 'next/link';

interface CTASectionProps {
  isAuthenticated: boolean;
}

export default function CTASection({ isAuthenticated }: CTASectionProps) {
  return (
    <section className="bg-blue-600 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Make a Difference?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of contributors building the future of transparent supplement data.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={isAuthenticated ? "/contribute/new-product" : "/login?redirect=/contribute/new-product"}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Add New Product
          </Link>
          <Link
            href="/products"
            className="bg-transparent text-white px-8 py-3 rounded-lg font-semibold border border-white hover:bg-white hover:text-blue-600 transition-colors"
          >
            Update Existing
          </Link>
          {!isAuthenticated && (
            <Link
              href="/register"
              className="bg-transparent text-white px-8 py-3 rounded-lg font-semibold border border-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Create Account
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
