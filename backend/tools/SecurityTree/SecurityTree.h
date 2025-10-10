#pragma once
#include <vector>
#include <chrono>
#include <mutex>
#include <atomic>

/**
 * SecurityTree - A C++ segment tree for tracking admin request patterns
 * Prevents malicious insider attacks by limiting overlapping requests within 24-hour cycles
 * Automatically resets every day at midnight
 */
class SecurityTree {
public:
    SecurityTree();
    ~SecurityTree();

    // Core functionality
    bool canMakeRequest(const std::string& adminId, int64_t currentTimestamp);
    void recordRequest(const std::string& adminId, int64_t timestamp);
    
    // Request expiration management
    bool isRequestExpired(int64_t requestTimestamp, int64_t currentTimestamp, int expirationMinutes = 10);
    void cleanupExpiredRequests(int64_t currentTimestamp);
    
    // Admin tracking within 24-hour cycles
    bool hasAdminMadeRequestToday(const std::string& adminId, int64_t currentTimestamp);
    int getAdminRequestCountToday(const std::string& adminId, int64_t currentTimestamp);
    
    // Daily reset functionality
    void resetDaily();
    bool needsDailyReset(int64_t currentTimestamp);
    
    // Statistics and monitoring
    struct AdminStats {
        std::string adminId;
        int requestsToday;
        int64_t lastRequestTime;
        bool hasActiveRequest;
    };
    
    std::vector<AdminStats> getAllAdminStats(int64_t currentTimestamp);
    int getTotalRequestsToday(int64_t currentTimestamp);
    
    // Thread safety
    bool isThreadSafe() const { return threadSafe_.load(); }
    
private:
    // 24-hour cycle management (in seconds)
    static constexpr int64_t SECONDS_IN_DAY = 24 * 60 * 60;
    static constexpr int MAX_REQUESTS_PER_DAY = 1;
    static constexpr int REQUEST_EXPIRATION_MINUTES = 10;
    
    // Segment tree for efficient range queries
    struct SegmentNode {
        int64_t startTime;
        int64_t endTime;
        int requestCount;
        std::vector<std::string> adminIds;
        
        SegmentNode() : startTime(0), endTime(0), requestCount(0) {}
    };
    
    // Admin tracking
    struct AdminRecord {
        std::string adminId;
        int requestsToday;
        int64_t lastRequestTime;
        int64_t dayStartTime;
        bool hasActiveRequest;
        
        AdminRecord(const std::string& id) 
            : adminId(id), requestsToday(0), lastRequestTime(0), 
              dayStartTime(0), hasActiveRequest(false) {}
    };
    
    // Data structures
    std::vector<SegmentNode> segmentTree_;
    std::unordered_map<std::string, AdminRecord> adminRecords_;
    std::mutex treeMutex_;
    std::atomic<bool> threadSafe_;
    
    // Daily reset tracking
    int64_t lastResetDay_;
    int64_t currentDayStart_;
    
    // Helper methods
    void buildSegmentTree();
    void updateSegmentTree(int64_t startTime, int64_t endTime, const std::string& adminId, bool add);
    int querySegmentTree(int64_t startTime, int64_t endTime);
    int64_t getDayStart(int64_t timestamp);
    bool isSameDay(int64_t timestamp1, int64_t timestamp2);
    void expandTreeIfNeeded(int64_t maxTime);
    
    // Tree operations
    int leftChild(int index) const { return 2 * index + 1; }
    int rightChild(int index) const { return 2 * index + 2; }
    int parent(int index) const { return (index - 1) / 2; }
    
    // Security validation
    bool validateTimestamp(int64_t timestamp);
    bool validateAdminId(const std::string& adminId);
    bool isTimestampInValidRange(int64_t timestamp);
};
