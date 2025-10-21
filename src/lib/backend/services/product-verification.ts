/**
 * Product Verification Service
 * Checks if products already exist before submission to prevent duplicates
 */

import { supabase } from '@/lib/supabase';
import { get } from 'fast-levenshtein';

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

            // Single database call to get all potentially matching products
            const allProducts = await findMatchingProducts(submission);
            
            // Separate exact matches from similar products
            const exactMatches = allProducts.filter(p => p.similarity_score === 1.0);
            const similarProducts = allProducts.filter(p => p.similarity_score < 1.0 && p.similarity_score > 0.7);

            // Step 1: Check for exact matches
            if (exactMatches.length > 0) {
                result.exists = true;
                result.matchType = 'exact';
                result.canSubmit = false;
                result.existingProducts = exactMatches;
                result.warnings.push('Exact product match found in database');
                return result;
            }

            // Step 2: Check for similar products
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
 * Find all potentially matching products with a single database call
 */
async function findMatchingProducts(submission: ProductSubmission): Promise<VerificationResult['existingProducts']> {
    // Single database call to get products with similar names or same brand
    const { data, error } = await supabase
        .from('products')
        .select('id, name, brand_name, flavor, year')
        .or(`name.ilike.%${submission.name}%,brand_name.eq.${submission.brand_name.toLowerCase()}`)
        .limit(30); // Increased limit since we're doing one call

    if (error) {
        console.error('❌ Error finding matching products:', error);
        return [];
    }

    const products = data || [];
    const matchingProducts: VerificationResult['existingProducts'] = [];

    for (const product of products) {
        const similarity = calculateSimilarity(submission, product);
        
        // Include all products with > 0.7 similarity (including exact matches)
        if (similarity > 0.7) {
            matchingProducts.push({
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
    return matchingProducts.sort((a, b) => b.similarity_score - a.similarity_score);
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
 * Calculate Levenshtein similarity between two strings using fast-levenshtein
 */
function levenshteinSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;

    // Use fast-levenshtein library for better performance
    const distance = get(str1, str2);
    return (maxLength - distance) / maxLength;
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
