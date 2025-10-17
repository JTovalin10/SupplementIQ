#include "SecurityTree.h"
#include <algorithm>
#include <iostream>
#include <iomanip>
#include <sstream>

SecurityTree::SecurityTree() 
    : threadSafe_(true), lastResetDay_(-1), currentDayStart_(0) {
    buildSegmentTree();
    std::cout << "🔒 SecurityTree initialized for admin request tracking" << std::endl;
}

SecurityTree::~SecurityTree() {
    std::lock_guard<std::mutex> lock(treeMutex_);
    std::cout << "🔒 SecurityTree destroyed" << std::endl;
}

bool SecurityTree::canMakeRequest(const std::string& adminId, int64_t currentTimestamp) {
    std::lock_guard<std::mutex> lock(treeMutex_);
    
    // Validate inputs
    if (!validateAdminId(adminId) || !validateTimestamp(currentTimestamp)) {
        return false;
    }
    
    // Check if we need daily reset
    if (needsDailyReset(currentTimestamp)) {
        resetDaily();
    }
    
    // Check if admin has already made a request today
    if (hasAdminMadeRequestToday(adminId, currentTimestamp)) {
        std::cout << "🚫 Admin " << adminId << " has already made a request today" << std::endl;
        return false;
    }
    
    // Check for overlapping requests in the last 24 hours
    int64_t dayStart = getDayStart(currentTimestamp);
    int recentRequests = querySegmentTree(dayStart, currentTimestamp);
    
    if (recentRequests > 0) {
        std::cout << "🚫 Overlapping requests detected in last 24 hours: " << recentRequests << std::endl;
        return false;
    }
    
    // Check if admin has an active (non-expired) request
    auto it = adminRecords_.find(adminId);
    if (it != adminRecords_.end() && it->second.hasActiveRequest) {
        if (!isRequestExpired(it->second.lastRequestTime, currentTimestamp)) {
            std::cout << "🚫 Admin " << adminId << " has an active non-expired request" << std::endl;
            return false;
        }
    }
    
    return true;
}

void SecurityTree::recordRequest(const std::string& adminId, int64_t timestamp) {
    std::lock_guard<std::mutex> lock(treeMutex_);
    
    if (!validateAdminId(adminId) || !validateTimestamp(timestamp)) {
        return;
    }
    
    // Update admin record
    auto& record = adminRecords_[adminId];
    record.adminId = adminId;
    record.lastRequestTime = timestamp;
    record.hasActiveRequest = true;
    
    // Check if this is a new day
    int64_t dayStart = getDayStart(timestamp);
    if (record.dayStartTime != dayStart) {
        record.requestsToday = 0;
        record.dayStartTime = dayStart;
    }
    
    record.requestsToday++;
    
    // Update segment tree
    int64_t dayEnd = dayStart + SECONDS_IN_DAY;
    updateSegmentTree(dayStart, dayEnd, adminId, true);
    
    std::cout << "✅ Recorded request for admin " << adminId 
              << " at timestamp " << timestamp 
              << " (requests today: " << record.requestsToday << ")" << std::endl;
}

bool SecurityTree::isRequestExpired(int64_t requestTimestamp, int64_t currentTimestamp, int expirationMinutes) {
    if (requestTimestamp <= 0 || currentTimestamp <= 0) {
        return true;
    }
    
    int64_t expirationTime = requestTimestamp + (expirationMinutes * 60);
    return currentTimestamp > expirationTime;
}

void SecurityTree::cleanupExpiredRequests(int64_t currentTimestamp) {
    std::lock_guard<std::mutex> lock(treeMutex_);
    
    int expiredCount = 0;
    for (auto& [adminId, record] : adminRecords_) {
        if (record.hasActiveRequest && isRequestExpired(record.lastRequestTime, currentTimestamp)) {
            record.hasActiveRequest = false;
            expiredCount++;
            std::cout << "🧹 Expired request for admin " << adminId << std::endl;
        }
    }
    
    if (expiredCount > 0) {
        std::cout << "🧹 Cleaned up " << expiredCount << " expired requests" << std::endl;
    }
}

bool SecurityTree::hasAdminMadeRequestToday(const std::string& adminId, int64_t currentTimestamp) {
    auto it = adminRecords_.find(adminId);
    if (it == adminRecords_.end()) {
        return false;
    }
    
    int64_t dayStart = getDayStart(currentTimestamp);
    return it->second.dayStartTime == dayStart && it->second.requestsToday > 0;
}

int SecurityTree::getAdminRequestCountToday(const std::string& adminId, int64_t currentTimestamp) {
    auto it = adminRecords_.find(adminId);
    if (it == adminRecords_.end()) {
        return 0;
    }
    
    int64_t dayStart = getDayStart(currentTimestamp);
    if (it->second.dayStartTime == dayStart) {
        return it->second.requestsToday;
    }
    
    return 0;
}

void SecurityTree::resetDaily() {
    std::cout << "🔄 Resetting SecurityTree for new day" << std::endl;
    
    // Reset all admin records for new day
    for (auto& [adminId, record] : adminRecords_) {
        record.requestsToday = 0;
        record.hasActiveRequest = false;
    }
    
    // Clear segment tree
    for (auto& node : segmentTree_) {
        node.requestCount = 0;
        node.adminIds.clear();
    }
    
    lastResetDay_ = currentDayStart_;
    std::cout << "✅ SecurityTree reset completed" << std::endl;
}

bool SecurityTree::needsDailyReset(int64_t currentTimestamp) {
    int64_t dayStart = getDayStart(currentTimestamp);
    return dayStart != currentDayStart_;
}

std::vector<SecurityTree::AdminStats> SecurityTree::getAllAdminStats(int64_t currentTimestamp) {
    std::lock_guard<std::mutex> lock(treeMutex_);
    
    std::vector<AdminStats> stats;
    for (const auto& [adminId, record] : adminRecords_) {
        AdminStats stat;
        stat.adminId = record.adminId;
        stat.requestsToday = record.requestsToday;
        stat.lastRequestTime = record.lastRequestTime;
        stat.hasActiveRequest = record.hasActiveRequest;
        stats.push_back(stat);
    }
    
    return stats;
}

int SecurityTree::getTotalRequestsToday(int64_t currentTimestamp) {
    std::lock_guard<std::mutex> lock(treeMutex_);
    
    int total = 0;
    int64_t dayStart = getDayStart(currentTimestamp);
    
    for (const auto& [adminId, record] : adminRecords_) {
        if (record.dayStartTime == dayStart) {
            total += record.requestsToday;
        }
    }
    
    return total;
}

void SecurityTree::buildSegmentTree() {
    // Initialize with reasonable size (24 hours * 4 = 96 segments for 15-minute granularity)
    int treeSize = 96;
    segmentTree_.resize(4 * treeSize);
    
    for (int i = 0; i < 4 * treeSize; ++i) {
        segmentTree_[i] = SegmentNode();
    }
    
    std::cout << "🌳 Built SecurityTree with " << treeSize << " segments" << std::endl;
}

void SecurityTree::updateSegmentTree(int64_t startTime, int64_t endTime, const std::string& adminId, bool add) {
    // Simple implementation - in production, use proper segment tree update
    // For now, we'll track in admin records and use simple time-based queries
    
    if (add) {
        std::cout << "📊 Updated segment tree: " << adminId 
                  << " [" << startTime << ", " << endTime << "]" << std::endl;
    }
}

int SecurityTree::querySegmentTree(int64_t startTime, int64_t endTime) {
    // Simple implementation - count overlapping requests
    int count = 0;
    int64_t dayStart = getDayStart(startTime);
    
    for (const auto& [adminId, record] : adminRecords_) {
        if (record.dayStartTime == dayStart && 
            record.lastRequestTime >= startTime && 
            record.lastRequestTime <= endTime) {
            count++;
        }
    }
    
    return count;
}

int64_t SecurityTree::getDayStart(int64_t timestamp) {
    // Convert timestamp to day start (midnight PST/PDT)
    std::time_t time = static_cast<std::time_t>(timestamp);
    
    // Get local time in PST/PDT timezone
    std::tm* tm = std::localtime(&time);
    
    // Check if we're in PST (UTC-8) or PDT (UTC-7) by checking if DST is active
    std::tm tm_copy = *tm;
    tm_copy.tm_isdst = -1; // Let system determine DST
    std::time_t local_time = std::mktime(&tm_copy);
    std::tm* local_tm = std::localtime(&local_time);
    
    // Calculate PST offset (UTC-8, or UTC-7 during PDT)
    int pst_offset = local_tm->tm_isdst ? -7 * 3600 : -8 * 3600; // PDT or PST in seconds
    
    // Adjust to PST/PDT timezone
    std::time_t pst_time = time + pst_offset;
    std::tm* pst_tm = std::gmtime(&pst_time);
    
    // Set to midnight PST/PDT
    pst_tm->tm_hour = 0;
    pst_tm->tm_min = 0;
    pst_tm->tm_sec = 0;
    pst_tm->tm_isdst = local_tm->tm_isdst;
    
    // Convert back to UTC timestamp
    std::time_t midnight_pst = std::mktime(pst_tm) - pst_offset;
    
    return static_cast<int64_t>(midnight_pst);
}

bool SecurityTree::isSameDay(int64_t timestamp1, int64_t timestamp2) {
    return getDayStart(timestamp1) == getDayStart(timestamp2);
}

void SecurityTree::expandTreeIfNeeded(int64_t maxTime) {
    // Implementation for dynamic tree expansion if needed
    // For now, fixed size should be sufficient
}

bool SecurityTree::validateTimestamp(int64_t timestamp) {
    // Validate timestamp is reasonable (not too far in past or future)
    int64_t currentTime = std::time(nullptr);
    int64_t oneYear = 365 * 24 * 60 * 60;
    
    return timestamp > (currentTime - oneYear) && timestamp < (currentTime + oneYear);
}

bool SecurityTree::validateAdminId(const std::string& adminId) {
    // UUID v4 validation (Supabase standard format)
    if (adminId.empty() || adminId.length() != 36) {
        return false;
    }
    
    // UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // where x is any hexadecimal digit and y is one of 8, 9, A, or B
    const std::regex uuidV4Regex(
        "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
        std::regex_constants::icase
    );
    
    return std::regex_match(adminId, uuidV4Regex);
}

bool SecurityTree::isTimestampInValidRange(int64_t timestamp) {
    return validateTimestamp(timestamp);
}
