-- Add hash index on users.role for efficient role-based queries
-- Hash indexes are faster than B-tree for exact equality matches
CREATE INDEX CONCURRENTLY idx_users_role_hash ON users USING hash (role);

-- Add B-tree index on users.id for efficient primary key lookups (if not already exists)
-- This is redundant since primary keys already have B-tree indexes, but being explicit
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_btree ON users USING btree (id);

-- Add composite index for admin queries (id + role)
-- This optimizes queries that check both user ID and role
CREATE INDEX CONCURRENTLY idx_users_id_role ON users (id, role);

-- Add index on role for counting queries
-- This optimizes getAdminCount() and similar functions
CREATE INDEX CONCURRENTLY idx_users_role_count ON users (role) WHERE role IN ('admin', 'owner');
