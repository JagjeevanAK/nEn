import express from "express";
import { register } from "../utils/metrics"
import logger from "../utils/logger";

const app = express();
const PORT = process.env.ENGINE_METRICS_PORT || 3000;

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
