-- Test query to check if the foreign key relationship exists
-- Run this in your Supabase SQL editor to debug the relationship issue

-- 1. Check if temporary_products table exists and has data
SELECT 
    'temporary_products' as table_name,
    COUNT(*) as row_count,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'temporary_products' 
    AND table_schema = 'public'
GROUP BY column_name, data_type, is_nullable
ORDER BY column_name;

-- 2. Check if preworkout_details table exists and has data
SELECT 
    'preworkout_details' as table_name,
    COUNT(*) as row_count,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'preworkout_details' 
    AND table_schema = 'public'
GROUP BY column_name, data_type, is_nullable
ORDER BY column_name;

-- 3. Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name = 'temporary_products' OR tc.table_name = 'preworkout_details')
    AND tc.table_schema = 'public';

-- 4. Test the exact query that's failing
SELECT 
    tp.id,
    tp.name,
    tp.category,
    pd.id as preworkout_id,
    pd.temp_product_id
FROM temporary_products tp
LEFT JOIN preworkout_details pd ON tp.id = pd.temp_product_id
WHERE tp.id = 1;

-- 5. Check if there's any data in temporary_products
SELECT * FROM temporary_products LIMIT 5;

-- 6. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('temporary_products', 'preworkout_details')
    AND schemaname = 'public';

-- 7. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('temporary_products', 'preworkout_details')
    AND schemaname = 'public';
