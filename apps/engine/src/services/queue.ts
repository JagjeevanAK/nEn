import { Queue } from "bullmq";
import config from "@nen/config";

const redisUrl = config.redis.url;
const redisConfig = new URL(redisUrl);

export const workflowQueue = new Queue("workflow-execution", {
  connection: {
    host: redisConfig.hostname,
    port: parseInt(redisConfig.port) || 6379,
  },
});
