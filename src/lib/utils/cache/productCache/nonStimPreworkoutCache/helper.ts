// Non-stim preworkout top-products cache helper backed by Redis
import { getRedis } from "../redis";

export type NonStimTopItem = {
  productId: string;
  details: Record<string, unknown>;
};

const KEY = "top:non_stim_preworkout";

async function fetchTopFromApi(): Promise<NonStimTopItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const res = await fetch(
    `${baseUrl}/api/products/non-stim-preworkout/top-product`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.items || []) as NonStimTopItem[];
}

export async function seedNonStimTop(): Promise<void> {
  const redis = getRedis();
  const items = (await fetchTopFromApi()).slice(0, 75);
  if (redis) {
    await redis.set(KEY, JSON.stringify(items), 86400);
    return;
  }
}

export async function getNonStimTop(): Promise<NonStimTopItem[]> {
  const redis = getRedis();
  if (redis) {
    const cached = await redis.get(KEY);
    if (cached) return JSON.parse(cached) as NonStimTopItem[];
    await seedNonStimTop();
    const afterSeed = await redis.get(KEY);
    return afterSeed ? (JSON.parse(afterSeed) as NonStimTopItem[]) : [];
  }
  return await fetchTopFromApi();
}
