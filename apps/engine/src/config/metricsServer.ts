import express from "express";
import { register, createLogger } from "@nen/monitoring";
import config from "@nen/config";

const logger = createLogger({ serviceName: "nen-engine" });

const app = express();
const PORT = config.engine.metricsPort;

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "nen-engine" });
});

app.listen(PORT, () => {
  logger.info(`Engine metrics server listening on port ${PORT}`);
});
