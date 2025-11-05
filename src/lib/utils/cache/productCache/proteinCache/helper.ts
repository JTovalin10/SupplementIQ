import { getRedis } from "../redis";

export type ProteinTopItem = {
  productId: string;
  details: Record<string, unknown>;
};

const KEY = "top:protein";

async function fetchTopFromApi(): Promise<ProteinTopItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const res = await fetch(`${baseUrl}/api/products/protein/top-product`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.items || []) as ProteinTopItem[];
}

export async function seedProteinTop(): Promise<void> {
  const redis = getRedis();
  const items = await fetchTopFromApi();
  if (redis) {
    await redis.set(KEY, JSON.stringify(items), 3600);
    return;
  }
}

export async function getProteinTop(): Promise<ProteinTopItem[]> {
  const redis = getRedis();
  if (redis) {
    const cached = await redis.get(KEY);
    if (cached) return JSON.parse(cached) as ProteinTopItem[];
    await seedProteinTop();
    const afterSeed = await redis.get(KEY);
    return afterSeed ? (JSON.parse(afterSeed) as ProteinTopItem[]) : [];
  }
  return await fetchTopFromApi();
}
