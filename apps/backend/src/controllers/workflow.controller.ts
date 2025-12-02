import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { CustomError } from "../utils/CustomError";
import { WorkflowSchema } from "../utils/workflowSchema";
import { prisma } from "@nen/db";
import { createClient } from "redis";
import { } from "../utils/queueWorker";
import { v4 as uuidv4 } from "uuid";
import { workflowQueue } from "../utils/queue";
import { queueJobsCounter, workflowExecutionCounter } from "../utils/metrics";
import { trace } from "@opentelemetry/api";
import logger, { createChildLogger } from "../utils/logger";

const tracer = trace.getTracer("nen-backend");
const publisherRedis = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });

const connectRedis = async () => {
  try {
    await publisherRedis.connect();
    logger.info("Redis connected successfully");
  } catch (error) {
    logger.error("Redis connection failed", { error });
  }
};
connectRedis();

export const saveWorkflow = asyncHandler(async (req, res) => {
  const payload = req.body;
  const parsed = WorkflowSchema.parse(payload);

  try {
    const savedWorkflow = await prisma.workflow.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        active: parsed.active,
        nodes: parsed.nodes,
        edges: parsed.edges,
        userId: req.user?.id,
        tags: [],
      },
    });

    logger.info("Workflow saved successfully", {
      workflowId: savedWorkflow.id,
      userId: req.user?.id,
      correlationId: req.correlationId
    });

    res.status(201).json(
      new ApiResponse(201, "workflow created successfully", {
        workflowId: savedWorkflow.id,
        name: savedWorkflow.name,
        active: savedWorkflow.active,
        createdAt: savedWorkflow.createdAt,
      })
    );
  } catch (error) {
    logger.error("Error saving workflow", { error, userId: req.user?.id, correlationId: req.correlationId });
    res.status(500).json(new ApiResponse(500, "failed to save workflow", null));
  }
});

export const getWorkflowById = asyncHandler(async (req, res) => {
  const { workflowId } = req.params;

  try {
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: req.user?.id,
      },
    });

    if (!workflow) {
      return res.status(404).json(new ApiResponse(404, "wf  not found", null));
    }

    const workflowData = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      active: workflow.active,
      nodes: workflow.nodes,
      edges: workflow.edges,
      tags: workflow.tags,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };

    res
      .status(200)
      .json(new ApiResponse(200, "wf retrieved successfully", workflowData));
  } catch (error) {
    console.error("Error retrieving wf:", error);
    res
      .status(500)
      .json(new ApiResponse(500, "Failed to retrieve workflow", null));
  }
});

export const updateWorkflow = asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const payload = req.body;

  const parsed = WorkflowSchema.parse(payload);

  try {
    const updatedWorkflow = await prisma.workflow.update({
      where: {
        id: workflowId,
        userId: req.user?.id,
      },
      data: {
        name: parsed.name,
        description: parsed.description,
        active: parsed.active,
        nodes: parsed.nodes,
        edges: parsed.edges,
        updatedAt: new Date(),
      },
    });

    console.log("Workflow updated successfully:", updatedWorkflow.id);

    try {
      await publisherRedis.publish(
        "workflow:schedule:refresh",
        JSON.stringify({ workflowId: updatedWorkflow.id })
      );
    } catch (error) {
      logger.warn("Failed to publish schedule refresh event", { error, workflowId });
    }

    res.status(200).json(
      new ApiResponse(200, "Workflow updated successfully", {
        workflowId: updatedWorkflow.id,
        name: updatedWorkflow.name,
        active: updatedWorkflow.active,
        updatedAt: updatedWorkflow.updatedAt,
      })
    );
  } catch (error: any) {
    console.error("Error updating workflow:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json(new ApiResponse(404, "Workflow not found", null));
    }

    res
      .status(500)
      .json(new ApiResponse(500, "Failed to update workflow", null));
  }
});

export const getUserWorkflows = asyncHandler(async (req, res) => {
  try {
    const workflows = await prisma.workflow.findMany({
      where: {
        userId: req.user?.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        nodes: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, "Workflows retrieved successfully", workflows)
      );
  } catch (error) {
    console.error("Error retrieving workflows:", error);
    res
      .status(500)
      .json(new ApiResponse(500, "Failed to retrieve workflows", null));
  }
});

export const executeFlow = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!userId) throw new CustomError(404, "userId Not Found invalid token");

  const { workflowId } = req.params;
  if (!workflowId) throw new CustomError(404, "workflow id not found");
  let workflow;

  try {
    workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: userId,
      },
    });
  } catch (error) {
    throw new CustomError(401, "Error in geting workflow ");
  }

  if (!workflow) throw new CustomError(404, "Workflow doesnot exists");

  console.log("Workflow==>>", workflow)

  try {
    const executionId = uuidv4();
    const span = tracer.startSpan("workflow.queue");

    const executionJob = {
      executionId: executionId,
      workflowId: workflow.id,
      userId: userId,
      triggeredBy: "manual",
      triggeredAt: new Date().toISOString(),
      workflow: {
        id: workflow.id,
        name: workflow.name,
        nodes: workflow.nodes,
        edges: workflow.edges,
        active: workflow.active,
      },
      status: "queued",
      priority: "normal",
      metadata: {
        source: "api",
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      },
    };

    span.setAttributes({
      "workflow.id": workflow.id,
      "workflow.name": workflow.name,
      "execution.id": executionId,
      "triggered.by": "manual",
    });

    await workflowQueue.add("execute-workflow", executionJob, {
      jobId: executionId,
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });

    queueJobsCounter.inc({ queue_name: "workflow:execution", status: "queued" });
    workflowExecutionCounter.inc({ status: "queued", workflow_id: workflow.id, triggered_by: "manual" });

    await publisherRedis.hSet(`execution:${executionId}`, {
      status: "queued",
      createdAt: new Date().toISOString(),
      workflowId: workflowId,
      userId: userId,
    });

    await publisherRedis.expire(`execution:${executionId}`, 86400);

    console.log(
      `Workflow ${workflowId} queued for execution with ID: ${executionId}`
    );

    span.end();

    res.status(200).json(
      new ApiResponse(200, "Workflow queued for execution successfully", {
        executionId: executionId,
        workflowId: workflowId,
        status: "queued",
        estimatedStartTime: "within 30 seconds",
      })
    );
  } catch (error) {
    console.error("Error queuing workflow for execution:", error);
    throw new CustomError(500, "Failed to queue workflow for execution");
  }
});

export const deleteWorkflow = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { workflowId } = req.params
  if (!userId) throw new CustomError(404, "userid not found")
  let delWf;
  try {
    delWf = await prisma.workflow.update({
      where: {
        id: workflowId,
        userId: userId
      },
      data: {
        deletedAt: new Date(),
        active: false
      }
    })

  } catch (error) {
    throw new CustomError(400, "failed to delete the workflow")
  }

  res.status(200).json(new ApiResponse(200, "Workflow deleted successfully", delWf))
})

