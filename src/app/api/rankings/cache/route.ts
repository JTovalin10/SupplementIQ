import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "../../../../../Database/Redis/client";

// Cache management API for rankings
// This endpoint allows admins to manage the Redis cache

export async function GET(request: NextRequest) {
  try {
    const redis = getRedis();

    // Get all ranking cache keys
    const keys = await redis.keys("rankings:*");

    // Get cache info for each key
    const cacheInfo = await Promise.all(
      keys.map(async (key) => {
        const ttl = await redis.ttl(key);
        const data = await redis.get(key);
        let parsedData = null;

        try {
          parsedData = JSON.parse(data || "{}");
        } catch (e) {
          // Ignore parse errors
        }

        return {
          key,
          ttl,
          hasData: !!data,
          lastUpdated: parsedData?.lastUpdated || null,
          source: parsedData?.source || "unknown",
          timeRange: parsedData?.timeRange || "unknown",
          page: parsedData?.currentPage || "unknown",
          limit: parsedData?.limit || "unknown",
        };
      }),
    );

    return NextResponse.json({
      success: true,
      cacheKeys: cacheInfo,
      totalKeys: keys.length,
    });
  } catch (error) {
    console.error("Cache management error:", error);
    return NextResponse.json(
      {
        error: "Failed to get cache info",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "all";
    const timeRange = searchParams.get("timeRange");

    const redis = getRedis();

    let deletedKeys = 0;

    if (action === "all") {
      // Delete all ranking cache keys
      const keys = await redis.keys("rankings:*");
      if (keys.length > 0) {
        await redis.del(keys);
        deletedKeys = keys.length;
      }
    } else if (action === "timeRange" && timeRange) {
      // Delete cache for specific time range
      const keys = await redis.keys(`rankings:${timeRange}:*`);
      if (keys.length > 0) {
        await redis.del(keys);
        deletedKeys = keys.length;
      }
    } else if (action === "stale") {
      // Delete only stale cache entries
      const keys = await redis.keys("rankings:*");
      let staleKeys = [];

      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          try {
            const parsedData = JSON.parse(data);
            const lastUpdated = new Date(parsedData.lastUpdated);
            const now = new Date();
            const hoursDiff =
              (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

            if (hoursDiff >= 24) {
              staleKeys.push(key);
            }
          } catch (e) {
            // If we can't parse it, consider it stale
            staleKeys.push(key);
          }
        }
      }

      if (staleKeys.length > 0) {
        await redis.del(staleKeys);
        deletedKeys = staleKeys.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedKeys} cache entries`,
      deletedKeys,
    });
  } catch (error) {
    console.error("Cache deletion error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete cache",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "refresh";

    if (action === "refresh") {
      // Force refresh all cache entries by deleting them
      const redis = getRedis();

      const keys = await redis.keys("rankings:*");
      if (keys.length > 0) {
        await redis.del(keys);
      }

      return NextResponse.json({
        success: true,
        message: `Refreshed ${keys.length} cache entries - they will be rebuilt on next request`,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Cache refresh error:", error);
    return NextResponse.json(
      {
        error: "Failed to refresh cache",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
