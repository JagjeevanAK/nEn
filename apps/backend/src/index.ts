import { startTracing } from "./utils/tracing";
startTracing();

import cookieParser from "cookie-parser";
import express, { urlencoded } from "express";
import cors from "cors";
import { httpRequestCounter, httpRequestDuration } from "./utils/metrics";
import { correlationIdMiddleware } from "./middlewares/correlationId.middleware";
import logger from "./utils/logger";

const app = express();
const PORT = process.env.BACKEND_PORT || 8080

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
app.use(urlencoded({ extended: true }));
app.use(express.json());

// Correlation ID middleware
app.use(correlationIdMiddleware);

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestCounter.inc({ method: req.method, route: req.path, status_code: res.statusCode });
    httpRequestDuration.observe({ method: req.method, route: req.path, status_code: res.statusCode }, duration);
  });
  next();
});

import v1 from "./routes"
import metricsRouter from "./routes/metrics.routes";
import { errorHandler } from "./middlewares/error.middleware";

app.use("/api/v1", v1);
app.use("/", metricsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Backend server listening on port ${PORT}`);
});
