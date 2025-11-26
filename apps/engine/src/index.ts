import { startTracing } from "./utils/tracing";
startTracing();

import "./config/metricsServer"; 

import { Workflow } from "./workers/workflow";
import { Worker } from "bullmq";
import { queueJobsCounter, queueProcessingDuration, activeWorkflowsGauge } from "./utils/metrics";
import { trace } from "@opentelemetry/api";
import logger, { createChildLogger } from "./utils/logger";
import { scheduleService } from "./services/scheduleService";

const tracer = trace.getTracer("nen-engine");

const worker = new Worker(
  "workflow:execution",
  async (job) => {
    const span = tracer.startSpan("workflow.execute");
    const start = Date.now();
    activeWorkflowsGauge.inc();
    const exectionData = job.data;
    const jobLogger = createChildLogger(exectionData.executionId);

    try {
      jobLogger.info("Starting workflow execution", {
        workflowId: exectionData.workflow.id,
        workflowName: exectionData.workflow.name,
        triggeredBy: exectionData.triggeredBy,
      });

      span.setAttributes({
        "workflow.id": exectionData.workflow.id,
        "workflow.name": exectionData.workflow.name,
        "execution.id": exectionData.executionId,
      });

      const workflowObj = new Workflow(exectionData);

      workflowObj.buildGraph();
      if (workflowObj.detectCycle()) {
        jobLogger.error("Cycle detected in workflow", { workflowId: exectionData.workflow.id });
        span.recordException(new Error("Cycle detected"));
        span.end();
        queueJobsCounter.inc({ queue_name: "workflow:execution", status: "failed" });
        activeWorkflowsGauge.dec();
        return;
      }
      workflowObj.getExecutionOrder();

      jobLogger.info("Executing workflow", { workflowId: exectionData.workflow.id });
      await workflowObj.execute();

      const duration = (Date.now() - start) / 1000;
      queueProcessingDuration.observe({ queue_name: "workflow:execution" }, duration);
      queueJobsCounter.inc({ queue_name: "workflow:execution", status: "completed" });
      jobLogger.info("Workflow execution completed", { 
        workflowId: exectionData.workflow.id,
        duration 
      });
      span.setStatus({ code: 1 }); // OK
      span.end();
    } catch (error: any) {
      jobLogger.error("Workflow execution failed", { 
        workflowId: exectionData.workflow.id,
        error: error.message,
        stack: error.stack 
      });
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message }); // ERROR
      span.end();
      queueJobsCounter.inc({ queue_name: "workflow:execution", status: "failed" });
      throw error;
    } finally {
      activeWorkflowsGauge.dec();
    }
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

worker.on("completed", (job) => {
  logger.info("Job completed", { jobId: job.id });
});

worker.on("failed", (job, err) => {
  logger.error("Job failed", { jobId: job?.id, error: err.message });
});

// Initialize schedule service
scheduleService.initialize().catch((error) => {
  logger.error("Failed to initialize schedule service:", error);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  scheduleService.shutdown();
  worker.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully...");
  scheduleService.shutdown();
  worker.close();
  process.exit(0);
});

logger.info("Workflow engine worker started");
