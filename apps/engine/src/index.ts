import "dotenv/config";
import { Workflow } from "./workflow";
import { Worker } from "bullmq";

const worker = new Worker(
  "workflow:execution",
  async (job) => {
    console.log("inside Engine");
    const exectionData = job.data;
    console.log("ExecutionDATA====>>>", exectionData);
    console.log("Nodes===> ", exectionData.workflow.nodes);
    console.log("EDGES===> ", exectionData.workflow.edges);

    const workflowObj = new Workflow(exectionData);

    workflowObj.buildGraph();
    if (workflowObj.detectCycle()) {
      console.error("Cycle detected in workflow", exectionData.workflow.id);
      return;
    }
    workflowObj.getExecutionOrder();

    console.log("executing the workflow ", exectionData.workflow.id);
    await workflowObj.execute();
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
