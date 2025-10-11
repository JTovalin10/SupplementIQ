# Image Handling Strategy

## Problem Analysis
- **Storage Options:** Zip files to save space vs. uncompressed files for better performance
- **Trade-offs:** Space savings vs. latency and client-side CPU load

## Decision
- **No compression/decompression** to prioritize user experience
- **Image links instead of storage:** Contributors provide image URLs rather than uploading files
- **Benefits:** Reduced storage costs and simplified backend architecture

---

# Architecture Decision: Moving from Next.js + Express.js to Next.js-only

## Problem
- **Communication issues** between backend and frontend
- **Complexity** of managing two separate applications

## Solution
- **Switch to Next.js-only** with simple backend routes
- **Future-proofing:** Easier integration for potential mobile app development
- **Simplified architecture** with unified Next.js routes linking to backend

---

# Realizing Overengineering: C++ to Golang Migration

## The Problem
- **Overdesigned daily push** using multithreaded C++
- **Wrong optimization focus:** Optimized for CPU speed instead of network speed
- **Supabase limitations:** Too many threads causing system issues

## The Solution
- **Switch to Golang** for daily push operations
- **Better suited for the job:** Faster than JavaScript but more appropriate for network-bound operations
- **Simplified architecture** without unnecessary complexity

# Security: Admin Dashboard Hierarchy

## Permission Levels

### Owner
- **Full unrestricted access** to all system functions
- Can create admins (preferably from moderators, but override feature available)
- No limitations or timeouts

### Admin
- **All moderator privileges plus:**
  - Force system updates (requires 75% approval from other admins within 10 minutes)
  - Limited to once per day to minimize system load
  - Ban users
  - Accept/deny new products or edits without caution
  - Promote users to moderators (if they have 1000+ contribution points)

### Moderator
- **Requirements:** 1000+ contribution points + approval from admin/owner
- **Permissions:**
  - Accept requests to add new products or edits
  - Ensure information accuracy
- **Limitations:** 30-second timeout for every acceptance to limit potential damage

## User Submission Limits

### New Contributors (< 10 contributions)
- **5-minute delay** between submissions to prevent mass spam

### Regular Contributors (10+ contributions)
- **1-minute delay** between submissions

---

# Security Tree: Force Update Protection

## Purpose
- **24-hour segment tree** to track force update requests
- **Prevents malicious admins** from overloading the server with multiple force update attempts

## How It Works
- **Request tracking:** If a force update request has already been made within 24 hours, subsequent admin requests are automatically rejected
- **"Trust nobody" principle:** Even legitimate admins cannot bypass this protection
- **Server protection:** Prevents potential DoS attacks or accidental overload scenarios

## Implementation
- **Segment tree data structure** for efficient 24-hour window tracking
- **Automatic rejection** of duplicate force update requests
- **Additional layer of security** beyond the 75% admin approval requirement

---

# Trie Implementation: Autocomplete with Resilience

## The Challenge
- **Need for speed:** Created a Trie tree in C++ to maximize autocomplete performance
- **System vulnerability:** Risk of losing all data during system outages
- **Data persistence:** In-memory trie would be lost on server restart

## The Solution
- **JSON backup file:** Stores the last updated items from the trie
- **Daily synchronization:** Database updates at 12 AM PST, then updates the JSON file
- **Cold start recovery:** On server restart, loads from JSON file to restore trie data
- **Data integrity:** Ensures no autocomplete data is lost during outages

## Implementation Details
- **C++ Trie tree** for maximum autocomplete speed
- **Node.js bindings** for JavaScript integration via V8 engine
- **Persistent storage** via JSON file for resilience
- **Automated sync** with database updates
- **Fault tolerance** through backup and recovery system

## Security & Testing
- **Comprehensive security testing** against common attack vectors:
  - SQL injection attempts
  - XSS attack patterns
  - Path traversal attempts
  - Command injection tests
  - Format string vulnerability tests
- **Edge case handling:** Unicode characters, special symbols, empty strings
- **Performance testing** with malicious inputs
- **Dual implementation:** Both C++ (performance) and TypeScript (fallback) versions

## Autocomplete Features
- **Supplement-specific vocabulary** including alphanumeric product names:
  - Standard supplements: protein, whey, creatine, bcaa, omega3
  - Alphanumeric products: jacked3d, c4, pre-jym, alpha-gpc, l-arginine
  - Complex names: n.o.-xplode, superpump250, iso-100, gold-standard
- **Case-insensitive search** with automatic lowercase conversion
- **Prefix matching** for partial input completion
- **Bulk insertion** for loading multiple words efficiently
- **Export functionality** for integration with other modules

---

# C++ Performance Tools: High-Speed Backend Services

## AutocompleteService: Multithreaded Performance Engine
- **High-performance multithreaded service** with thread-safe operations
- **Lock-free read operations** supporting 10,000+ concurrent searches
- **Fine-grained locking** for write operations with minimal contention
- **Performance benchmarks**: 7.5x faster than TypeScript, 4x less memory usage
- **Zero-downtime updates** with background thread processing
- **Node.js V8 bindings** for seamless JavaScript integration
- **Persistence layer** with automatic file backup and recovery

## DailyUpdateService: Dual-Component Architecture
- **Split architecture** separating Supabase operations from file/cache management
- **Go component** with optimized batch processing and exponential backoff
- **File/cache component** managing server cache resets and Trie data updates
- **Single-operation batch processing** to minimize database calls
- **Rate limiting and connection pooling** to prevent Supabase rate limiting
- **Product verification system** preventing duplicate entries
- **Queue management** for approved products with automatic processing
- **Scheduled updates** every hour (instead of every minute) for efficiency
- **Single batch product checking** reducing database calls from N to 1
- **Comprehensive testing suite** with mock data and performance benchmarks
- **Thread-safe operations** supporting high-volume product processing

### Database Operation Optimization: Single-Query Approach
- **Problem**: Processing 1000 products required 1000+ individual database calls
- **Solution**: Single query to check all products (brand + product + year combinations) at once
- **Implementation**: 
  - Collect all unique products (brand|name|flavor|year combinations) from queue
  - Single query: `SELECT brand_name, name, year FROM products WHERE (brand_name=brand1 AND name=prod1 AND year=year1) OR (brand_name=brand2 AND name=prod2 AND year IS NULL) OR ...`
  - Insert only products that don't exist (brands are created automatically if they don't exist)
  - Return clean set of new products for trie updates (duplicates removed)
  - NULL handling for products without year (standard database practice)
- **Efficiency**: One query checks all products instead of separate brand/product checks
- **Result**: 1 single query + individual inserts for new products only
- **Performance**: Eliminates redundant brand checking - direct product existence verification
- **Example**: 1000 products = 1 query + inserts for new products only

### Trie Integration: Clean Set for Autocomplete Updates
- **Duplicate Removal**: Set automatically removes products that already exist in database
- **User-Focused Data**: Only brand, product name, and flavor (year excluded - users search "Gorilla Mode" not "Gorilla Mode 2023")
- **Unique Data Processing**: Only truly new products are processed by trie
- **JSON Backup First**: Trie saves new products to JSON before updating (system outage protection)
- **Efficient Updates**: Trie only processes new, unique data without reformulation info
- **Workflow**: Database processing → Extract trie data → Clean set → JSON backup → Trie update

## SecurityTree: Advanced Security & Rate Limiting
- **Segment tree implementation** for 24-hour request tracking
- **Admin rate limiting** with one request per admin per day
- **Request validation** with UUID v4 support and timestamp verification
- **Automatic cleanup** of expired requests (10-minute timeout)
- **Real-time monitoring** with security statistics and anomaly detection
- **Thread-safe concurrent operations** for high-throughput scenarios
- **Zero-trust security model** preventing insider threats and spam attacks

---

# Development Approach: AI-Assisted Solo Development

## AI Collaboration Strategy
- **Solo team development** with AI assistance to accelerate development speed
- **Comprehensive linting setup** with multiple linters to create guardrails for AI-generated code
- **Quality assurance** through automated code quality checks and formatting
- **Consistent code standards** enforced across the entire codebase
- **Rapid iteration** while maintaining code quality and best practices

## AI Code Review & Optimization
- **Thorough code review** of all AI-generated code before implementation
- **Performance optimization** by identifying and fixing inefficiencies
- **Example optimization**: Combined separate admin/owner check functions into a single unified function
- **Database query reduction** by eliminating redundant privilege checks
- **Code consolidation** to improve maintainability and reduce complexity

---

# AdminCache: Performance vs. Resource Trade-off

## The Problem
- **Database bottleneck**: Checking admin privileges required database queries every time
- **Democracy calculation overhead**: Fetching all admins to calculate 75% approval percentage
- **Scalability issues**: Database queries don't scale well with increased traffic
- **Performance degradation**: Privilege checks becoming a bottleneck for admin operations

## The Solution
- **In-memory admin cache** storing admin count and privilege information
- **Cold start initialization** loading admin data once at startup
- **Cache invalidation** on admin additions/removals to maintain consistency
- **Fast privilege checks** using cached data instead of database queries
- **Democracy calculation optimization** using cached admin count

## Trade-offs
- **Performance benefits**: Significantly faster privilege checks and democracy calculations
- **Better scalability**: Operations scale with memory access rather than database queries
- **Startup cost**: More expensive cold start due to initial cache loading
- **Memory overhead**: Additional RAM usage for caching admin data
- **Complexity increase**: Cache invalidation logic and consistency management

---

# Database Technology Choice: Supabase vs Firebase

## The Decision
- **Chose Supabase over Firebase** for backend database solution
- **PostgreSQL foundation** providing robust relational database capabilities
- **Complex relationship support** for intricate data models and foreign key constraints

## Why Not Firebase?
- **NoSQL limitations**: Firebase's document-based storage insufficient for complex relations
- **GraphQL alternative**: Could have used GraphQL to eliminate under/over-fetching
- **Cost considerations**: GraphQL would be more expensive for a passion project
- **Budget constraints**: Minimizing potential spending on personal project

## Why Not GraphQL?
- **Higher cost**: More expensive than REST API with Supabase
- **Passion project budget**: Want to minimize ongoing costs
- **Simplicity preference**: REST API sufficient for current needs

## Hosting Considerations
- **Single backend deployment**: Will be hosted on a single online backend
- **No distributed architecture**: No need for multi-server database splitting
- **Simplified scaling**: PostgreSQL on single server meets current requirements
- **Cost efficiency**: Single-server deployment reduces infrastructure costs

