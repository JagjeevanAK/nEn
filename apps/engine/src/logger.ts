import winston from "winston";
import LokiTransport from "winston-loki";

const isDevelopment = process.env.NODE_ENV !== "production";

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, executionId, ...meta }) => {
    let log = `${timestamp} [${service}] ${level}: ${message}`;
    if (executionId) {
      log += ` [EID: ${executionId}]`;
    }
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// JSON format for Loki
const lokiFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: isDevelopment ? "debug" : "info",
  }),
];

// Add Loki transport in production or if LOKI_URL is set
if (process.env.LOKI_URL) {
  transports.push(
    new LokiTransport({
      host: process.env.LOKI_URL || "http://localhost:3100",
      labels: { app: "nen-engine", environment: process.env.NODE_ENV || "development" },
      format: lokiFormat,
      json: true,
      batching: true,
      interval: 5,
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "nen-engine" },
  transports,
});

// Helper to add execution ID to logs
export const createChildLogger = (executionId: string) => {
  return logger.child({ executionId });
};

// Export for easier import
export default logger;
