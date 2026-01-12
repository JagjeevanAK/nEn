import { createClient, RedisClientType } from "redis";
import appConfig from "@nen/config";

export interface RedisConfig {
  url?: string;
}

export function createRedisClient(config: RedisConfig = {}): RedisClientType {
  const url = config.url || appConfig.redis.url;
  return createClient({ url });
}

export async function connectRedis(client: RedisClientType): Promise<void> {
  if (!client.isOpen) {
    await client.connect();
  }
}

export async function disconnectRedis(client: RedisClientType): Promise<void> {
  if (client.isOpen) {
    await client.quit();
  }
}

export function getRedisConfig() {
  const url = appConfig.redis.url;
  const redisConfig = new URL(url);
  
  return {
    url,
    host: redisConfig.hostname,
    port: parseInt(redisConfig.port) || 6379,
  };
}
