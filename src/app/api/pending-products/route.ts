import { supabase } from '@/lib/supabase';
import * as ipaddr from 'ipaddr.js';
import { NextRequest, NextResponse } from 'next/server';
import isURL from 'validator/lib/isURL';
import { z } from 'zod';

// Validation schemas
const PendingProductRequestSchema = z.object({
  product_id: z.number().optional(),
  name: z.string().min(1),
  brand_name: z.string().min(1),
  category: z.enum(['protein', 'pre-workout', 'non-stim-pre-workout', 'energy-drink', 'bcaa', 'eaa', 'fat-burner', 'appetite-suppressant', 'creatine']),
  job_type: z.enum(['add', 'update', 'delete']),
  flavor: z.string().optional(),
  year: z.string().optional(),
  image_url: z.string().url().optional(),
  description: z.string().optional(),
  servings_per_container: z.number().optional(),
  price: z.number().positive(),
  serving_size_g: z.number().positive().optional(),
  transparency_score: z.number().min(0).max(100).default(0),
  confidence_level: z.enum(['verified', 'likely', 'estimated', 'unknown']).default('estimated'),
  submitted_by: z.string().uuid(),
  notes: z.string().optional(),
});

const ProductApprovalRequestSchema = z.object({
  id: z.number(),
  status: z.enum(['approved', 'rejected']),
  reviewed_by: z.string().uuid(),
});

// URL sanitization helper (defense-in-depth against JS/data/blob/ssrf-ish inputs)
function sanitizeHttpUrl(input: string | undefined): string | null {
  if (!input) return null;
  const candidate = input.trim();
  if (candidate.length === 0 || candidate.length > 2048) return null;
  // Quick structural check
  if (!isURL(candidate, { protocols: ['http','https'], require_protocol: true, allow_fragment: false })) {
    return null;
  }
  try {
    const url = new URL(candidate);
    if (url.username || url.password) return null;
    const hostname = url.hostname;
    // If hostname is an IP, block private/loopback/link-local
    if (ipaddr.isValid(hostname)) {
      const addr = ipaddr.parse(hostname);
      if (addr.range() !== 'unicast') return null; // blocks private, loopback, link-local, etc.
      // ipaddr.js marks RFC1918 as 'private'; also disallow 'loopback', 'linkLocal', 'uniqueLocal'
      const rng = addr.range();
      if (rng === 'private' || rng === 'loopback' || rng === 'linkLocal' || rng === 'uniqueLocal') return null;
    } else {
      // Block common local hostnames
      const lower = hostname.toLowerCase();
      if (lower === 'localhost' || lower.endsWith('.local') || lower.endsWith('.internal')) return null;
    }
    url.hash = '';
    // Normalize stray '?'
    if (url.search === '?') url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper function to parse year
function parseYear(yearStr?: string): number | null {
  if (!yearStr) return null;
  const year = parseInt(yearStr, 10);
  return isNaN(year) ? null : year;
}

// POST /api/pending-products - Submit product for approval
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = PendingProductRequestSchema.parse(body);

    // Check if user has permission to submit image URLs
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's reputation points and role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('reputation_points, role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Use database role as primary, fallback to header role
    const effectiveRole = userData.role || userRole;
    
    // Check if user can submit image URLs (1000+ points OR admin/owner/moderator)
    const canSubmitImageUrl = userData.reputation_points >= 1000 || 
      ['admin', 'owner', 'moderator'].includes(effectiveRole);

    // If image_url is provided but user doesn't have permission, reject
    if (validatedData.image_url && !canSubmitImageUrl) {
      return NextResponse.json(
        { 
          error: 'Image URL submission requires 1000+ reputation points or moderator/admin/owner role',
          required_points: 1000,
          current_points: userData.reputation_points,
          current_role: effectiveRole
        },
        { status: 403 }
      );
    }

    // Sanitize optional image_url
    let safeImageUrl: string | null = null;
    if (validatedData.image_url) {
      safeImageUrl = sanitizeHttpUrl(validatedData.image_url);
      if (!safeImageUrl) {
        return NextResponse.json(
          { error: 'Invalid image_url. Only http/https URLs to public hosts are allowed.' },
          { status: 400 }
        );
      }
    }

    // Get or create brand
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select('id')
      .eq('name', validatedData.brand_name)
      .single();

    let brandId: number;
    if (brandError || !brandData) {
      // Create new brand
      const { data: newBrand, error: createBrandError } = await supabase
        .from('brands')
        .insert({
          name: validatedData.brand_name,
          slug: generateSlug(validatedData.brand_name),
        })
        .select('id')
        .single();

      if (createBrandError || !newBrand) {
        return NextResponse.json(
          { error: 'Failed to create brand' },
          { status: 500 }
        );
      }
      brandId = newBrand.id;
    } else {
      brandId = brandData.id;
    }

    // Insert pending product
    const { data: pendingProduct, error: insertError } = await supabase
      .from('pending_products')
      .insert({
        product_id: validatedData.product_id || null,
        submitted_by: validatedData.submitted_by,
        status: 'pending',
        job_type: validatedData.job_type,
        brand_id: brandId,
        category: validatedData.category,
        name: validatedData.name,
        slug: generateSlug(validatedData.name),
        release_year: parseYear(validatedData.year),
        image_url: safeImageUrl,
        description: validatedData.description,
        servings_per_container: validatedData.servings_per_container,
        price: validatedData.price,
        serving_size_g: validatedData.serving_size_g,
        transparency_score: validatedData.transparency_score,
        confidence_level: validatedData.confidence_level,
        notes: validatedData.notes,
      })
      .select(`
        *,
        brands:brand_id (
          id,
          name,
          slug,
          website
        )
      `)
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to submit product for approval' },
        { status: 500 }
      );
    }

    // Insert category-specific details based on category
    await insertCategorySpecificDetails(pendingProduct.id, validatedData.category);

    return NextResponse.json(
      {
        message: 'Product submitted for approval',
        product: pendingProduct,
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting pending product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/pending-products - Get pending products with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Validate parameters
    if (page <= 0) {
      return NextResponse.json(
        { error: 'Page must be greater than 0' },
        { status: 400 }
      );
    }

    if (limit <= 0 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, approved, or rejected' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('pending_products')
      .select(`
        *,
        brands:brand_id (
          id,
          name,
          slug,
          website,
          product_count,
          created_at
        )
      `, { count: 'exact' });

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch pending products' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      page,
      limit,
      total_pages: totalPages,
    });

  } catch (error) {
    console.error('Error fetching pending products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to insert category-specific details
async function insertCategorySpecificDetails(productId: number, category: string) {
  const baseDetails = {
    product_id: productId,
  };

  switch (category) {
    case 'pre-workout':
      await supabase.from('pending_preworkout_details').insert(baseDetails);
      break;
    case 'non-stim-pre-workout':
      await supabase.from('pending_non_stim_preworkout_details').insert(baseDetails);
      break;
    case 'energy-drink':
      await supabase.from('pending_energy_drink_details').insert(baseDetails);
      break;
    case 'protein':
      await supabase.from('pending_protein_details').insert(baseDetails);
      break;
    case 'bcaa':
    case 'eaa':
      await supabase.from('pending_amino_acid_details').insert(baseDetails);
      break;
    case 'fat-burner':
    case 'appetite-suppressant':
      await supabase.from('pending_fat_burner_details').insert(baseDetails);
      break;
    case 'creatine':
      // Creatine doesn't have a specific details table
      break;
    default:
      throw new Error(`Unsupported product category: ${category}`);
  }
}
