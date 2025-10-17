import { supabase } from '@/lib/supabase';

export type RecentActivityItem = {
  type: 'comment' | 'product_approved' | 'product_created';
  id: string;
  timestamp: string;
  metadata: Record<string, unknown>;
  user: null | { id: string; username: string; avatar_url: string | null };
  product: null | { id: number; name: string; brand: null | { id: number; name: string } };
};

export type RecentActivityResponse = {
  activities: RecentActivityItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export async function fetchRecentActivity(page: number, limit: number, opts?: { q?: string | null }): Promise<RecentActivityResponse> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const requestedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const safeLimit = Math.min(requestedLimit, 100);
  const hasSearchQuery = !!(opts && opts.q && opts.q.trim().length > 0);
  const oneWeekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Reduce fetched rows; scale with page, cap small for default, larger for search
  const perSourceLimit = (opts && opts.q && opts.q.trim().length > 0)
    ? Math.min(safeLimit * Math.max(1, safePage), 200)
    : Math.min(safeLimit * Math.max(1, safePage), 60);

  const reviewsQuery = supabase
    .from('product_reviews')
    .select(
      `id, created_at, title, rating, comment, product_id,
       users:user_id ( id, username, avatar_url ),
       products:product_id ( id, name, brand_id, brands:brand_id ( id, name ) )`
    )
    .order('created_at', { ascending: false })
    .limit(perSourceLimit);
  const approvedQuery = supabase
    .from('temporary_products')
    .select(
      `id, name, reviewed_at, submitted_by,
       brands:brand_id ( id, name ),
       users:submitted_by ( id, username, avatar_url )`
    )
    .eq('approval_status', 1)
    .order('reviewed_at', { ascending: false })
    .limit(perSourceLimit);
  const productsQuery = supabase
    .from('products')
    .select(`id, name, created_at, brands:brand_id ( id, name )`)
    .order('created_at', { ascending: false })
    .limit(perSourceLimit);

  // Apply last-week constraint unless searching
  const reviewsExec = hasSearchQuery ? reviewsQuery : reviewsQuery.gte('created_at', oneWeekAgoIso);
  const approvedExec = hasSearchQuery ? approvedQuery : approvedQuery.gte('reviewed_at', oneWeekAgoIso);
  const productsExec = hasSearchQuery ? productsQuery : productsQuery.gte('created_at', oneWeekAgoIso);

  const [reviewsRes, approvedRes, createdRes] = await Promise.all([
    reviewsExec,
    approvedExec,
    productsExec,
  ]);

  const reviews = (reviewsRes.data || []).map((r: any) => ({
    type: 'comment' as const,
    id: `review_${r.id}`,
    timestamp: r.created_at,
    metadata: {
      title: r.title,
      rating: r.rating,
      comment: r.comment,
    },
    user: r.users ? { id: r.users.id, username: r.users.username, avatar_url: r.users.avatar_url } : null,
    product: r.products
      ? {
          id: r.products.id,
          name: r.products.name,
          brand: r.products.brands ? { id: r.products.brands.id, name: r.products.brands.name } : null,
        }
      : null,
  }));

  const approvals = (approvedRes.data || []).map((p: any) => ({
    type: 'product_approved' as const,
    id: `approved_${p.id}`,
    timestamp: p.reviewed_at,
    metadata: {},
    user: p.users ? { id: p.users.id, username: p.users.username, avatar_url: p.users.avatar_url } : null,
    product: {
      id: p.id,
      name: p.name,
      brand: p.brands ? { id: p.brands.id, name: p.brands.name } : null,
    },
  }));

  const creations = (createdRes.data || []).map((p: any) => ({
    type: 'product_created' as const,
    id: `product_${p.id}`,
    timestamp: p.created_at,
    metadata: {},
    user: null,
    product: {
      id: p.id,
      name: p.name,
      brand: p.brands ? { id: p.brands.id, name: p.brands.name } : null,
    },
  }));

  const merged: RecentActivityItem[] = [...reviews, ...approvals, ...creations]
    .filter((e) => !!e.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = merged.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const offset = (safePage - 1) * safeLimit;
  const pageItems = merged.slice(offset, offset + safeLimit);

  return {
    activities: pageItems,
    total,
    page: safePage,
    limit: safeLimit,
    total_pages: totalPages,
  };
}


