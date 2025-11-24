import { Registry, Counter, Histogram, Gauge } from "prom-client";

export const register = new Registry();

// Workflow metrics
export const workflowExecutionCounter = new Counter({
  name: "workflow_executions_total",
  help: "Total number of workflow executions",
  labelNames: ["status", "workflow_id"],
  registers: [register],
});

export const workflowExecutionDuration = new Histogram({
  name: "workflow_execution_duration_seconds",
  help: "Duration of workflow executions in seconds",
  labelNames: ["workflow_id", "status"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [register],
});

export const activeWorkflowsGauge = new Gauge({
  name: "active_workflows_count",
  help: "Number of currently executing workflows",
  registers: [register],
});

// Queue metrics
export const queueJobsCounter = new Counter({
  name: "queue_jobs_total",
  help: "Total number of jobs processed",
  labelNames: ["queue_name", "status"],
  registers: [register],
});

export const queueProcessingDuration = new Histogram({
  name: "queue_processing_duration_seconds",
  help: "Time taken to process queue jobs",
  labelNames: ["queue_name"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

// Node execution metrics
export const nodeExecutionCounter = new Counter({
  name: "node_executions_total",
  help: "Total number of node executions",
  labelNames: ["node_type", "status"],
  registers: [register],
});

export const nodeExecutionDuration = new Histogram({
  name: "node_execution_duration_seconds",
  help: "Duration of individual node executions",
  labelNames: ["node_type"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Error metrics
export const errorCounter = new Counter({
  name: "errors_total",
  help: "Total number of errors",
  labelNames: ["error_type", "component"],
  registers: [register],
});
