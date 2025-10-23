-- Simple test to check if the relationship works
-- Run this first to see if there's any data

-- Check if we have any temporary_products
SELECT id, name, category FROM temporary_products LIMIT 3;

-- Check if we have any preworkout_details
SELECT id, temp_product_id FROM preworkout_details LIMIT 3;

-- Try the join that's failing
SELECT 
    tp.id,
    tp.name,
    pd.temp_product_id
FROM temporary_products tp
LEFT JOIN preworkout_details pd ON tp.id = pd.temp_product_id
LIMIT 3;
