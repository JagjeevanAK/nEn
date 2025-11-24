import { Queue } from "bullmq";

export const workflowQueue = new Queue("workflow:execution", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});
