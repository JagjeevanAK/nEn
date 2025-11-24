import "dotenv/config";
import { startTracing } from "./tracing";
startTracing();

import "./metricsServer";

import { Workflow } from "./workflow";
import { Worker } from "bullmq";
import { queueJobsCounter, queueProcessingDuration, activeWorkflowsGauge } from "./metrics";
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("nen-engine");

const worker = new Worker(
  "workflow:execution",
  async (job) => {
    const span = tracer.startSpan("workflow.execute");
    const start = Date.now();
    activeWorkflowsGauge.inc();

    try {
      console.log("inside Engine");
      const exectionData = job.data;
      console.log("ExecutionDATA====>>>", exectionData);
      console.log("Nodes===> ", exectionData.workflow.nodes);
      console.log("EDGES===> ", exectionData.workflow.edges);

      span.setAttributes({
        "workflow.id": exectionData.workflow.id,
        "workflow.name": exectionData.workflow.name,
        "execution.id": exectionData.executionId,
      });

      const workflowObj = new Workflow(exectionData);

      workflowObj.buildGraph();
      if (workflowObj.detectCycle()) {
        console.error("Cycle detected in workflow", exectionData.workflow.id);
        span.recordException(new Error("Cycle detected"));
        span.end();
        queueJobsCounter.inc({ queue_name: "workflow:execution", status: "failed" });
        activeWorkflowsGauge.dec();
        return;
      }
      workflowObj.getExecutionOrder();

      console.log("executing the workflow ", exectionData.workflow.id);
      await workflowObj.execute();

      const duration = (Date.now() - start) / 1000;
      queueProcessingDuration.observe({ queue_name: "workflow:execution" }, duration);
      queueJobsCounter.inc({ queue_name: "workflow:execution", status: "completed" });
      span.setStatus({ code: 1 }); // OK
      span.end();
    } catch (error: any) {
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
  console.log(`${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});

console.log("Worker started");
