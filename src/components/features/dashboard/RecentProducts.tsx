'use client';

import { supabase } from '@/lib/database/supabase/client';
import { Calendar, CheckCircle, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface RecentProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  submittedBy: string;
  approvedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function RecentProducts() {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent accepted products
  useEffect(() => {
    const fetchRecentProducts = async () => {
      try {
        setIsLoading(true);
        
        // Get the current session and access token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error('No active session found. Please log in again.');
        }

        const response = await fetch('/api/admin/dashboard/recent-products?limit=10', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        setRecentProducts(data.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentProducts();
  }, []);

  const formatDate = useMemo(() => (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            Recent Accepted Products
          </h3>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="text-gray-600">Loading recent products...</div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          </div>
        ) : recentProducts.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">No recent accepted products found.</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentProducts.map((product) => (
              <div key={product.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">Brand: {product.brand}</p>
                        <p className="text-sm text-gray-600">Category: {product.category}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>Submitted by: {product.submittedBy}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Approved by: {product.approvedBy}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(product.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Approved
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
