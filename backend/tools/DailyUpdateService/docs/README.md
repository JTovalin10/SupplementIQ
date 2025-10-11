# DailyUpdateService - Modular Architecture

A comprehensive daily update service for SupplementIQ that handles product queue management, cache operations, Trie data persistence, and Go component integration.

## Architecture Overview

The DailyUpdateService has been refactored into a modular architecture with separate components for better maintainability and separation of concerns:

```
DailyUpdateService/
├── components/                    # Modular components
│   ├── cache/                    # Cache management
│   │   ├── CacheManager.h
│   │   └── CacheManager.cpp
│   ├── trie/                     # Trie data management
│   │   ├── TrieManager.h
│   │   └── TrieManager.cpp
│   ├── queue/                    # Queue management
│   │   ├── QueueManager.h
│   │   └── QueueManager.cpp
│   └── go-integration/           # Go component integration
│       ├── GoIntegration.h
│       └── GoIntegration.cpp
├── go-supabase/                  # Go Supabase component
│   ├── main.go
│   ├── go.mod
│   └── README.md
├── DailyUpdateServiceV2.h        # Main orchestrator
├── DailyUpdateServiceV2.cpp      # Main implementation
├── DailyUpdateService.h          # Legacy implementation
├── DailyUpdateService.cpp        # Legacy implementation
└── README.md                     # This file
```

## Components

### 1. CacheManager (`components/cache/`)

**Responsibilities:**
- Reset SimpleCache (product pagination cache)
- Refresh AdminCache (admin/owner role cache)
- Clear cache directories
- Handle cache persistence and recovery

**Key Features:**
- Thread-safe cache operations
- Automatic cache directory creation
- Cache state persistence
- Statistics tracking

**Usage:**
```cpp
CacheManager cacheManager;
cacheManager.initialize("./data/cache");
cacheManager.resetAllCaches();
```

### 2. TrieManager (`components/trie/`)

**Responsibilities:**
- Update Trie data with new products
- Save Trie data to JSON files for persistence
- Load Trie data from JSON files (cold start recovery)
- Handle daily Trie synchronization
- Manage autocomplete data files

**Key Features:**
- JSON file persistence for system outage recovery
- Batch operations for performance
- Integration with existing autocomplete service
- Statistics tracking

**Usage:**
```cpp
TrieManager trieManager;
trieManager.initialize("./data/autocomplete");
trieManager.updateTrieWithProduct(product);
trieManager.saveTrieData();
```

### 3. QueueManager (`components/queue/`)

**Responsibilities:**
- Manage approved products queue
- Save queue to JSON file for persistence
- Load queue from JSON file (cold start recovery)
- Handle queue operations (add, remove, clear)
- Thread-safe queue operations

**Key Features:**
- Thread-safe queue operations
- JSON file persistence
- Queue statistics
- Condition variable for thread synchronization

**Usage:**
```cpp
QueueManager queueManager;
queueManager.initialize("./data/queue/products_queue.json");
queueManager.addProductForApproval(product);
```

### 4. GoIntegration (`components/go-integration/`)

**Responsibilities:**
- Call Go component to insert products into Supabase
- Call Go component for batch operations
- Handle Go binary execution and error handling
- Manage Go component communication protocols
- Handle Go component response parsing

**Key Features:**
- Shell command execution with JSON payloads
- Error handling and response parsing
- Batch operations support
- Statistics tracking

**Usage:**
```cpp
GoIntegration goIntegration;
goIntegration.initialize("./go-supabase/main");
goIntegration.insertProduct(product);
```

## Main Service (DailyUpdateServiceV2)

The main service orchestrates all components and provides:

### Features
- **Modular Architecture**: Separate components for different responsibilities
- **Background Processing**: Dedicated threads for scheduling and queue processing
- **File Persistence**: All data persisted to JSON files for system outage recovery
- **Scheduled Updates**: Daily updates at 12 AM PST
- **Thread Safety**: All operations are thread-safe
- **Comprehensive Statistics**: Detailed statistics for monitoring and debugging
- **Error Recovery**: Graceful handling of component failures

### Usage
```cpp
DailyUpdateServiceV2 service;
service.initialize("./data/daily-update");
service.start();

// Add products for approval
ProductData product("Whey Protein", "Optimum Nutrition", "Vanilla");
service.addProductForApproval(product);

// Get statistics
auto stats = service.getServiceStats();
```

## Go Component Integration

The Go component (`go-supabase/`) handles all Supabase database operations:

### Features
- **Duplicate Prevention**: Checks if product exists before inserting
- **New Product Addition**: Only adds new products to ensure database accuracy
- **Batch Operations**: Efficient batch processing for daily updates
- **Performance Optimized**: Fastest possible database operations
- **Error Handling**: Comprehensive error handling with detailed logging

### Communication Protocol
The C++ components communicate with the Go component via shell commands:

```bash
# Insert single product
./go-supabase/main insert-product '{"name":"Whey Protein","brand_name":"Optimum Nutrition",...}'

# Batch insert
./go-supabase/main batch-insert '[{"name":"Product1",...},{"name":"Product2",...}]'

# Check product exists
./go-supabase/main check-product '{"name":"Whey Protein","brand":"Optimum Nutrition"}'
```

## Data Persistence

All components use JSON files for persistence to ensure system resilience:

### Cache Data
- `./data/cache/cache_state.json` - Cache statistics and state
- Cache directories cleared on reset

### Trie Data
- `./data/autocomplete/products.json` - Product names for autocomplete
- `./data/autocomplete/brands.json` - Brand names for autocomplete
- `./data/autocomplete/flavors.json` - Flavor names for autocomplete
- `./data/autocomplete/trie_state.json` - Trie statistics and state

### Queue Data
- `./data/queue/products_queue.json` - Pending products queue

## Daily Update Process

The daily update process runs at 12 AM PST and includes:

1. **Process Approved Queue**: Send all approved products to Go component
2. **Reset Caches**: Clear all server caches (SimpleCache, AdminCache)
3. **Update Trie**: Sync Trie with all current products
4. **Save State**: Persist all component states to files

## Error Handling and Recovery

### Cold Start Recovery
- All components load their state from JSON files on startup
- Queue is restored from persistence file
- Trie data is loaded from autocomplete files
- Cache state is restored from cache state file

### Component Failure Handling
- Individual component failures don't stop the entire service
- Detailed error logging for debugging
- Graceful degradation when components are unavailable

## Statistics and Monitoring

Each component provides detailed statistics:

```cpp
auto stats = service.getServiceStats();

// Cache statistics
std::cout << "Cache resets: " << stats.cacheStats.cacheResets << std::endl;

// Trie statistics
std::cout << "Products added: " << stats.trieStats.productsAdded << std::endl;

// Queue statistics
std::cout << "Queue size: " << stats.queueStats.currentQueueSize << std::endl;

// Go integration statistics
std::cout << "Successful inserts: " << stats.goStats.successfulInserts << std::endl;
```

## Thread Safety

All components are designed with thread safety in mind:

- **Mutex Protection**: All shared data protected by mutexes
- **Atomic Operations**: Statistics use atomic operations
- **Condition Variables**: Thread synchronization for queue operations
- **Lock-Free Design**: Where possible, components use lock-free algorithms

## Performance Considerations

- **Batch Operations**: Trie and Go components support batch operations for efficiency
- **File I/O Optimization**: JSON files are only written when necessary
- **Memory Management**: Smart pointers and RAII for automatic cleanup
- **Async Processing**: Background threads handle time-consuming operations

## Future Enhancements

- **Redis Integration**: Replace file-based persistence with Redis
- **Database Sync**: Real-time synchronization with database changes
- **Metrics Collection**: Integration with monitoring systems
- **Health Checks**: Component health monitoring and automatic recovery
- **Configuration Management**: External configuration files for all settings
