// Minimal Upstash Redis REST client for product caches

type Fetcher = typeof fetch;

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
  del(key: string): Promise<boolean>;
}

function createUpstashClient(fetcher: Fetcher): RedisClient {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!baseUrl || !token) {
    throw new Error("Upstash Redis env not configured");
  }
  const headers = { Authorization: `Bearer ${token}` };

  return {
    async get(key: string): Promise<string | null> {
      const res = await fetcher(`${baseUrl}/get/${encodeURIComponent(key)}`, {
        headers,
        cache: "no-store",
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.result ?? null;
    },
    async set(
      key: string,
      value: string,
      ttlSeconds?: number,
    ): Promise<boolean> {
      const url = ttlSeconds
        ? `${baseUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=${ttlSeconds}`
        : `${baseUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
      const res = await fetcher(url, { headers, cache: "no-store" });
      return res.ok;
    },
    async del(key: string): Promise<boolean> {
      const res = await fetcher(`${baseUrl}/del/${encodeURIComponent(key)}`, {
        headers,
        cache: "no-store",
      });
      return res.ok;
    },
  };
}

let client: RedisClient | null = null;

export function getRedis(): RedisClient | null {
  if (client) return client;
  try {
    client = createUpstashClient(fetch);
    return client;
  } catch {
    return null;
  }
}
