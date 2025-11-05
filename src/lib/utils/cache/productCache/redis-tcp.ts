import { createClient, RedisClientType } from "redis";

let client: RedisClientType | null = null;

export function getRedisTCP(): RedisClientType {
  if (client) return client;
  const host = process.env.REDIS_HOST!;
  const port = Number(process.env.REDIS_PORT!);
  const username = process.env.REDIS_USERNAME || "default";
  const password = process.env.REDIS_PASSWORD!;
  client = createClient({ socket: { host, port }, username, password });
  client.on("error", (err) => console.error("Redis Client Error", err));
  return client;
}
