/**
 * Product Verification Service
 * Checks if products already exist before submission to prevent duplicates
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ProductSubmission {
    name: string;
    brand_name: string;
    flavor?: string;
    year?: string; // For formula changes
    category?: string;
    description?: string;
}

export interface VerificationResult {
    canSubmit: boolean;
    exists: boolean;
    matchType: 'exact' | 'similar' | 'none';
    existingProducts: Array<{
        id: string;
        name: string;
        brand_name: string;
        flavor?: string;
        year?: string;
        similarity_score: number;
    }>;
    warnings: string[];
    suggestions: string[];
}

/**
 * Verify if a product submission already exists
 */
export async function verifyProductSubmission(submission: ProductSubmission): Promise<VerificationResult> {
    const result: VerificationResult = {
        canSubmit: true,
        exists: false,
        matchType: 'none',
        existingProducts: [],
        warnings: [],
        suggestions: []
    };

    try {
        console.log(`🔍 Verifying product submission: ${submission.name} (${submission.brand_name})`);

        // Step 1: Check for exact matches
        const exactMatches = await findExactMatches(submission);
        if (exactMatches.length > 0) {
            result.exists = true;
            result.matchType = 'exact';
            result.canSubmit = false;
            result.existingProducts = exactMatches;
            result.warnings.push('Exact product match found in database');
            return result;
        }

        // Step 2: Check for similar products
        const similarProducts = await findSimilarProducts(submission);
        if (similarProducts.length > 0) {
            result.matchType = 'similar';
            result.existingProducts = similarProducts;
            
            // Check similarity scores
            const highSimilarity = similarProducts.some(p => p.similarity_score > 0.9);
            if (highSimilarity) {
                result.canSubmit = false;
                result.warnings.push('Very similar product found - review required');
            } else {
                result.warnings.push('Similar products found - please review');
            }
        }

        // Step 3: Trie functionality removed (autocomplete was disabled)

        // Step 4: Generate suggestions
        generateSuggestions(submission, result);

        console.log(`✅ Verification completed: ${result.canSubmit ? 'Can submit' : 'Needs review'}`);
        return result;

    } catch (error) {
        console.error('❌ Error verifying product submission:', error);
        result.canSubmit = false;
        result.warnings.push('Verification failed - please try again');
        return result;
    }
}

/**
 * Find exact matches in the database
 */
async function findExactMatches(submission: ProductSubmission): Promise<VerificationResult['existingProducts']> {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, brand_name, flavor, year')
        .eq('name', submission.name.toLowerCase())
        .eq('brand_name', submission.brand_name.toLowerCase())
        .limit(10);

    if (error) {
        console.error('❌ Error finding exact matches:', error);
        return [];
    }

    return (data || []).map(product => ({
        id: product.id,
        name: product.name,
        brand_name: product.brand_name,
        flavor: product.flavor,
        year: product.year,
        similarity_score: 1.0
    }));
}

/**
 * Find similar products using fuzzy matching
 */
async function findSimilarProducts(submission: ProductSubmission): Promise<VerificationResult['existingProducts']> {
    // Search for products with similar names or same brand
    const { data, error } = await supabase
        .from('products')
        .select('id, name, brand_name, flavor, year')
        .or(`name.ilike.%${submission.name}%,brand_name.eq.${submission.brand_name.toLowerCase()}`)
        .limit(20);

    if (error) {
        console.error('❌ Error finding similar products:', error);
        return [];
    }

    const products = data || [];
    const similarProducts: VerificationResult['existingProducts'] = [];

    for (const product of products) {
        const similarity = calculateSimilarity(submission, product);
        
        // Only include products with > 0.7 similarity
        if (similarity > 0.7) {
            similarProducts.push({
                id: product.id,
                name: product.name,
                brand_name: product.brand_name,
                flavor: product.flavor,
                year: product.year,
                similarity_score: similarity
            });
        }
    }

    // Sort by similarity score (highest first)
    return similarProducts.sort((a, b) => b.similarity_score - a.similarity_score);
}

/**
 * Calculate similarity score between two products
 */
function calculateSimilarity(submission: ProductSubmission, existing: any): number {
    let score = 0;
    let factors = 0;

    // Name similarity (weight: 0.6)
    const nameSimilarity = levenshteinSimilarity(
        submission.name.toLowerCase(), 
        existing.name.toLowerCase()
    );
    score += nameSimilarity * 0.6;
    factors += 0.6;

    // Brand similarity (weight: 0.3)
    if (submission.brand_name.toLowerCase() === existing.brand_name.toLowerCase()) {
        score += 1.0 * 0.3;
    }
    factors += 0.3;

    // Flavor similarity (weight: 0.1)
    if (submission.flavor && existing.flavor) {
        if (submission.flavor.toLowerCase() === existing.flavor.toLowerCase()) {
            score += 1.0 * 0.1;
        }
    } else if (!submission.flavor && !existing.flavor) {
        score += 1.0 * 0.1;
    }
    factors += 0.1;

    return score / factors;
}

/**
 * Calculate Levenshtein similarity between two strings
 */
function levenshteinSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;

    const distance = levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + cost
            );
        }
    }

    return matrix[str2.length][str1.length];
}

/**
 * Check Trie for autocomplete matches - REMOVED (autocomplete service no longer used)
 */
async function checkTrieMatches(submission: ProductSubmission, result: VerificationResult): Promise<void> {
    // Autocomplete functionality removed
    // This function is kept for compatibility but does nothing
}

/**
 * Generate suggestions for the user
 */
function generateSuggestions(submission: ProductSubmission, result: VerificationResult): void {
    if (result.matchType === 'similar' && result.existingProducts.length > 0) {
        const mostSimilar = result.existingProducts[0];
        
        if (mostSimilar.similarity_score > 0.9) {
            result.suggestions.push('Consider using the existing product instead');
            result.suggestions.push('If this is a new formula, specify the year');
        } else {
            result.suggestions.push('Double-check the product name spelling');
            result.suggestions.push('Verify the brand name is correct');
        }
    }

    if (submission.flavor && result.existingProducts.some(p => p.flavor === submission.flavor)) {
        result.suggestions.push('This flavor already exists for this brand');
    }

    if (!submission.year && submission.category === 'pre_workout') {
        result.suggestions.push('Consider adding the year for pre-workout formulas');
    }
}

/**
 * Submit a verified product for admin approval
 */
export async function submitProductForApproval(
    submission: ProductSubmission, 
    submitterId: string,
    submitterName: string
): Promise<{ success: boolean; message: string; productId?: string }> {
    try {
        // Create a pending product record
        const { data, error } = await supabase
            .from('pending_products')
            .insert({
                name: submission.name,
                brand_name: submission.brand_name,
                flavor: submission.flavor,
                year: submission.year,
                category: submission.category,
                description: submission.description,
                submitted_by: submitterId,
                submitted_by_name: submitterName,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error submitting product for approval:', error);
            return {
                success: false,
                message: 'Failed to submit product for approval'
            };
        }

        console.log(`✅ Product submitted for approval: ${submission.name} (${submission.brand_name})`);
        return {
            success: true,
            message: 'Product submitted for admin review',
            productId: data.id
        };

    } catch (error) {
        console.error('❌ Error submitting product for approval:', error);
        return {
            success: false,
            message: 'Failed to submit product for approval'
        };
    }
}
