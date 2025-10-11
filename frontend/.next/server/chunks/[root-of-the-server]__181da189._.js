module.exports = [
"[project]/frontend/.next-internal/server/app/api/v1/products/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/frontend/src/lib/backend/core/cache.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Simple in-memory cache utility for product pagination
 * In production, you would use Redis or another caching solution
 */ __turbopack_context__.s([
    "cache",
    ()=>cache,
    "getCachedProducts",
    ()=>getCachedProducts,
    "setCachedProducts",
    ()=>setCachedProducts
]);
class SimpleCache {
    cache = new Map();
    /**
   * Set a cache entry with TTL
   * 
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlSeconds - Time to live in seconds (default: 1 hour)
   */ set(key, data, ttlSeconds = 3600) {
        const entry = {
            data,
            timestamp: Date.now(),
            ttl: ttlSeconds * 1000
        };
        this.cache.set(key, entry);
    }
    /**
   * Get a cache entry if it exists and hasn't expired
   * 
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */ get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    /**
   * Delete a cache entry
   * 
   * @param key - Cache key to delete
   */ delete(key) {
        this.cache.delete(key);
    }
    /**
   * Clear all cache entries
   */ clear() {
        this.cache.clear();
    }
    /**
   * Generate cache key for product pagination
   * 
   * @param page - Page number
   * @param limit - Items per page
   * @param category - Optional category filter
   * @param search - Optional search query
   * @param sort - Sort field
   * @param order - Sort order
   * @returns Cache key string
   */ generateProductKey(page, limit, category, search, sort = 'created_at', order = 'desc') {
        const params = [
            `page:${page}`,
            `limit:${limit}`,
            `sort:${sort}`,
            `order:${order}`
        ];
        if (category) {
            params.push(`category:${category}`);
        }
        if (search) {
            params.push(`search:${search}`);
        }
        return `products:${params.join('|')}`;
    }
    /**
   * Get cache statistics
   * 
   * @returns Cache statistics object
   */ getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
const cache = new SimpleCache();
const getCachedProducts = (page, limit, category, search, sort = 'created_at', order = 'desc')=>{
    // Only cache first 2 pages
    if (page > 2) {
        return null;
    }
    const key = cache.generateProductKey(page, limit, category, search, sort, order);
    return cache.get(key);
};
const setCachedProducts = (page, limit, data, category, search, sort = 'created_at', order = 'desc', ttlSeconds = 3600)=>{
    // Only cache first 2 pages
    if (page > 2) {
        return;
    }
    const key = cache.generateProductKey(page, limit, category, search, sort, order);
    cache.set(key, data, ttlSeconds);
};
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/punycode [external] (punycode, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("punycode", () => require("punycode"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[project]/frontend/src/lib/backend/supabase.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAuthenticatedUser",
    ()=>getAuthenticatedUser,
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-route] (ecmascript) <locals>");
;
/**
 * Supabase configuration and client initialization
 * Sets up the Supabase client for server-side operations with service role key
 */ // Environment variable validation
const supabaseUrl = ("TURBOPACK compile-time value", "https://elpjjfzkitdyctaputiy.supabase.co");
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
const getAuthenticatedUser = async (authHeader)=>{
    if (!authHeader) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return null;
    }
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
            return null;
        }
        return user;
    } catch (error) {
        console.error('Error getting authenticated user:', error);
        return null;
    }
};
}),
"[project]/frontend/src/lib/constants.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Shared constants between frontend and backend
__turbopack_context__.s([
    "API_BASE_URL",
    ()=>API_BASE_URL,
    "API_VERSION",
    ()=>API_VERSION,
    "CACHE_DURATIONS",
    ()=>CACHE_DURATIONS,
    "CACHE_PAGINATION",
    ()=>CACHE_PAGINATION,
    "CONTRIBUTION_TYPES",
    ()=>CONTRIBUTION_TYPES,
    "ENV_VARS",
    ()=>ENV_VARS,
    "ERROR_MESSAGES",
    ()=>ERROR_MESSAGES,
    "INGREDIENT_TYPES",
    ()=>INGREDIENT_TYPES,
    "PAGINATION_DEFAULTS",
    ()=>PAGINATION_DEFAULTS,
    "PRODUCT_CATEGORIES",
    ()=>PRODUCT_CATEGORIES,
    "RATING_SCALES",
    ()=>RATING_SCALES,
    "SUCCESS_MESSAGES",
    ()=>SUCCESS_MESSAGES,
    "UPLOAD_LIMITS",
    ()=>UPLOAD_LIMITS
]);
const API_VERSION = 'v1';
const API_BASE_URL = `/api/${API_VERSION}`;
const PRODUCT_CATEGORIES = {
    PROTEIN: 'protein',
    PRE_WORKOUT: 'pre-workout',
    ENERGY_DRINK: 'energy-drink',
    BCAA: 'bcaa',
    EAA: 'eaa',
    FAT_BURNER: 'fat-burner',
    APPETITE_SUPPRESSANT: 'appetite-suppressant'
};
const INGREDIENT_TYPES = {
    AMINO_ACID: 'amino-acid',
    VITAMIN: 'vitamin',
    MINERAL: 'mineral',
    HERBAL: 'herbal',
    PROBIOTIC: 'probiotic',
    OMEGA: 'omega'
};
const CONTRIBUTION_TYPES = {
    REVIEW: 'review',
    RATING: 'rating',
    FACT_CHECK: 'fact_check',
    TRANSPARENCY_SCORE: 'transparency_score'
};
const RATING_SCALES = {
    PRODUCT_RATING: {
        min: 1,
        max: 5
    },
    TRANSPARENCY_SCORE: {
        min: 0,
        max: 100
    },
    VALUE_FOR_MONEY: {
        min: 1,
        max: 5
    }
};
const PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 25,
    MAX_LIMIT: 100
};
const CACHE_PAGINATION = {
    CACHE_FIRST_PAGES: 2,
    PRODUCTS_PER_PAGE: 25
};
const UPLOAD_LIMITS = {
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: [
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
};
const CACHE_DURATIONS = {
    PRODUCTS: 86400,
    INGREDIENTS: 86400,
    RANKINGS: 86400,
    USER_PROFILE: 86400,
    BRANDS: 86400,
    CATEGORIES: 86400,
    CONTRIBUTIONS: 43200,
    SEARCH_RESULTS: 3600
};
const ENV_VARS = {
    NODE_ENV: 'NODE_ENV',
    PORT: 'PORT',
    HOSTNAME: 'HOSTNAME',
    DATABASE_URL: 'DATABASE_URL',
    SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    SUPABASE_SERVICE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
    FRONTEND_URL: 'FRONTEND_URL'
};
const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'You do not have permission to perform this action',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation failed',
    INTERNAL_ERROR: 'Internal server error',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
};
const SUCCESS_MESSAGES = {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful',
    REGISTER: 'Registration successful'
};
}),
"[project]/frontend/src/lib/middleware/validation.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Validation utilities for Next.js API routes
 * Provides input sanitization and validation functions
 */ /**
 * Sanitize input string to prevent injection attacks
 * Removes potentially dangerous characters and normalizes whitespace
 * 
 * @param input - Raw input string to sanitize
 * @returns Sanitized string safe for database queries
 * 
 * @example
 * const sanitized = sanitizeInput("user' input; DROP TABLE users;");
 * // Returns: "user input DROP TABLE users"
 */ __turbopack_context__.s([
    "createAuthError",
    ()=>createAuthError,
    "createAuthorizationError",
    ()=>createAuthorizationError,
    "createDatabaseError",
    ()=>createDatabaseError,
    "createInternalError",
    ()=>createInternalError,
    "createNotFoundError",
    ()=>createNotFoundError,
    "createValidationError",
    ()=>createValidationError,
    "isValidEmail",
    ()=>isValidEmail,
    "isValidUUID",
    ()=>isValidUUID,
    "isValidUrl",
    ()=>isValidUrl,
    "sanitizeInput",
    ()=>sanitizeInput,
    "validatePagination",
    ()=>validatePagination,
    "validatePassword",
    ()=>validatePassword,
    "validateSort",
    ()=>validateSort
]);
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return '';
    }
    return input.trim().replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['";]/g, '') // Remove SQL injection characters
    .replace(/[()]/g, '') // Remove parentheses
    .replace(/[{}]/g, '') // Remove braces
    .replace(/[\[\]]/g, '') // Remove brackets
    .replace(/[\\]/g, '') // Remove backslashes
    .replace(/[\/]/g, ' ') // Replace forward slashes with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 1000); // Limit length to prevent buffer overflow
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch  {
        return false;
    }
}
function validatePassword(password) {
    if (!password || password.length < 8) {
        return {
            isValid: false,
            error: 'Password must be at least 8 characters long'
        };
    }
    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            error: 'Password must contain at least one uppercase letter'
        };
    }
    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            error: 'Password must contain at least one lowercase letter'
        };
    }
    if (!/[0-9]/.test(password)) {
        return {
            isValid: false,
            error: 'Password must contain at least one number'
        };
    }
    return {
        isValid: true
    };
}
function validatePagination(page, limit) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 25;
    if (isNaN(pageNum) || pageNum < 1) {
        return {
            isValid: false,
            error: 'Page must be a positive integer'
        };
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return {
            isValid: false,
            error: 'Limit must be between 1 and 100'
        };
    }
    return {
        isValid: true,
        page: pageNum,
        limit: limitNum
    };
}
function validateSort(sort, order, allowedFields = [
    'name',
    'created_at',
    'rating',
    'price'
]) {
    const sortField = sort || 'created_at';
    const sortOrder = order || 'desc';
    if (!allowedFields.includes(sortField)) {
        return {
            isValid: false,
            error: `Invalid sort field. Allowed: ${allowedFields.join(', ')}`
        };
    }
    if (![
        'asc',
        'desc'
    ].includes(sortOrder)) {
        return {
            isValid: false,
            error: 'Sort order must be "asc" or "desc"'
        };
    }
    return {
        isValid: true,
        sort: sortField,
        order: sortOrder
    };
}
function createValidationError(message, details) {
    return {
        error: 'Validation error',
        message,
        ...details && {
            details
        }
    };
}
function createDatabaseError(message, originalError) {
    return {
        error: 'Database error',
        message,
        ...originalError && {
            details: originalError
        }
    };
}
function createAuthError(message) {
    return {
        error: 'Unauthorized',
        message
    };
}
function createAuthorizationError(message) {
    return {
        error: 'Forbidden',
        message
    };
}
function createNotFoundError(message) {
    return {
        error: 'Not found',
        message
    };
}
function createInternalError(message) {
    return {
        error: 'Internal server error',
        message
    };
}
}),
"[project]/frontend/src/app/api/v1/products/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$backend$2f$core$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/backend/core/cache.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$backend$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/backend/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/constants.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$middleware$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/middleware/validation.ts [app-route] (ecmascript)");
;
;
;
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PAGINATION_DEFAULTS"].PAGE.toString());
        const limit = parseInt(searchParams.get('limit') || __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PAGINATION_DEFAULTS"].LIMIT.toString());
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const sort = searchParams.get('sort') || 'created_at';
        const order = searchParams.get('order') || 'desc';
        // Validation
        if (page < 1) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Validation error',
                message: 'Page must be a positive integer'
            }, {
                status: 400
            });
        }
        if (limit < 1 || limit > 100) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Validation error',
                message: 'Limit must be between 1 and 100'
            }, {
                status: 400
            });
        }
        const validSortFields = [
            'name',
            'created_at',
            'rating',
            'price'
        ];
        if (!validSortFields.includes(sort)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Validation error',
                message: 'Invalid sort field'
            }, {
                status: 400
            });
        }
        if (![
            'asc',
            'desc'
        ].includes(order)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Validation error',
                message: 'Order must be asc or desc'
            }, {
                status: 400
            });
        }
        // Check if this page should be cached (first 2 pages only)
        const shouldCache = page <= __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CACHE_PAGINATION"].CACHE_FIRST_PAGES;
        // Sanitize search input to prevent injection
        const sanitizedSearch = search ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$middleware$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeInput"])(search) : null;
        // Try to get from cache first (only for first 2 pages)
        if (shouldCache) {
            const cachedData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$backend$2f$core$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCachedProducts"])(page, limit, category, sanitizedSearch, sort, order);
            if (cachedData) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(cachedData, {
                    headers: {
                        'Cache-Control': 'public, max-age=3600',
                        'X-Cache-Status': 'hit'
                    }
                });
            }
        }
        let query = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$backend$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from('products').select(`
        *,
        categories(name),
        ingredients(
          id,
          name,
          amount,
          unit,
          ingredient_types(name)
        )
      `).order(sort, {
            ascending: order === 'asc'
        });
        // Apply filters with sanitized inputs
        if (category) {
            query = query.eq('category_id', category);
        }
        if (sanitizedSearch) {
            query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
        }
        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
        const { data, error, count } = await query;
        if (error) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Database error',
                message: error.message
            }, {
                status: 400
            });
        }
        // Calculate pagination info
        const totalPages = Math.ceil((count || 0) / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        const response = {
            products: data,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: totalPages,
                hasNext,
                hasPrev,
                cached: shouldCache
            }
        };
        // Cache the response for first 2 pages only
        if (shouldCache) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$backend$2f$core$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setCachedProducts"])(page, limit, response, category, sanitizedSearch, sort, order, 3600 // Cache for 1 hour
            );
        }
        const headers = {};
        if (shouldCache) {
            headers['Cache-Control'] = 'public, max-age=3600';
            headers['X-Cache-Status'] = 'miss';
        } else {
            headers['Cache-Control'] = 'no-cache';
            headers['X-Cache-Status'] = 'not-cached';
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(response, {
            headers
        });
    } catch (error) {
        console.error('Get products error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error',
            message: 'Failed to fetch products'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const { name, description, category_id, brand, price, image_url } = body;
        // Validation
        if (!name || name.trim().length < 2) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Validation error',
                message: 'Product name is required and must be at least 2 characters'
            }, {
                status: 400
            });
        }
        if (!category_id) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Validation error',
                message: 'Category ID is required'
            }, {
                status: 400
            });
        }
        if (price !== undefined && (typeof price !== 'number' || price < 0)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Validation error',
                message: 'Price must be a positive number'
            }, {
                status: 400
            });
        }
        if (image_url && !isValidUrl(image_url)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Validation error',
                message: 'Image URL must be valid'
            }, {
                status: 400
            });
        }
        // Get user from auth header
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized',
                message: 'Authorization header required'
            }, {
                status: 401
            });
        }
        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$backend$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].auth.getUser(token);
        if (authError || !user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized',
                message: 'Invalid token'
            }, {
                status: 401
            });
        }
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$backend$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from('products').insert([
            {
                name: name.trim(),
                description,
                category_id,
                brand,
                price,
                image_url,
                created_by: user.id
            }
        ]).select().single();
        if (error) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Database error',
                message: error.message
            }, {
                status: 400
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Product created successfully',
            product: data
        }, {
            status: 201
        });
    } catch (error) {
        console.error('Create product error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error',
            message: 'Failed to create product'
        }, {
            status: 500
        });
    }
}
// Helper function to validate URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__181da189._.js.map