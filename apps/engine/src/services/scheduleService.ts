import * as cron from "node-cron";
import { prisma } from "@nen/db";
import { workflowQueue } from "./queue";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";
import { createClient } from "redis";

interface ScheduledJob {
  workflowId: string;
  nodeId: string;
  cronExpression: string;
  task: cron.ScheduledTask;
}

class ScheduleService {
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private subscriber = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });

  constructor() {
    // Debug heartbeat to monitor active schedules
    setInterval(() => {
      logger.info(`[ScheduleService Heartbeat] Active jobs: ${this.scheduledJobs.size}`);
      this.scheduledJobs.forEach((job, key) => {
        logger.info(`- Job ${key}: ${job.cronExpression}`);
      });
    }, 60000);
  }

  async initialize() {
    logger.info("Initializing schedule service...");
    
    await this.subscriber.connect();
    
    await this.subscriber.subscribe("workflow:schedule:refresh", (message) => {
      try {
        const { workflowId } = JSON.parse(message);
        logger.info(`Received schedule refresh request for workflow ${workflowId}`);
        this.refreshWorkflowSchedules(workflowId);
      } catch (error) {
        logger.error("Error processing schedule refresh message:", error);
      }
    });
    
    await this.loadActiveSchedules();
    logger.info(`Schedule service initialized with ${this.scheduledJobs.size} active schedules`);
  }

  private async loadActiveSchedules() {
    try {
      const activeWorkflows = await prisma.workflow.findMany({
        where: { active: true },
      });

      for (const workflow of activeWorkflows) {
        const nodes = workflow.nodes as any[];
        const scheduleTriggers = nodes.filter(
          (node) => node.type === "scheduleTrigger"
        );

        for (const trigger of scheduleTriggers) {
          if (trigger.data?.cronExpression) {
            this.scheduleWorkflow(
              workflow.id,
              trigger.id,
              trigger.data.cronExpression,
              workflow.userId
            );
          }
        }
      }
    } catch (error: any) {
      logger.error("Error loading active schedules:", error);
    }
  }

  scheduleWorkflow(
    workflowId: string,
    nodeId: string,
    cronExpression: string,
    userId: string
  ) {
    const jobKey = `${workflowId}-${nodeId}`;

    if (this.scheduledJobs.has(jobKey)) {
      logger.warn(`Schedule already exists for ${jobKey}, removing old schedule`);
      this.unscheduleWorkflow(workflowId, nodeId);
    }

    if (!cron.validate(cronExpression)) {
      logger.error(`Invalid cron expression: ${cronExpression} for workflow ${workflowId}`);
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    logger.info(`Creating cron schedule for workflow ${workflowId} with expression: ${cronExpression}`);

    const task = cron.schedule(
      cronExpression, 
      async (context) => {
        try {
          logger.info(`[CRON TICK] Executing scheduled workflow ${workflowId} at ${new Date().toISOString()}, trigger time: ${context.date}`);
          await this.triggerScheduledWorkflow(workflowId, nodeId, userId);
        } catch (error) {
          logger.error(`[CRON ERROR] Error in cron task for workflow ${workflowId}:`, error);
        }
      },
      {
        timezone: "UTC",
        name: `workflow-${workflowId}-${nodeId}`
      }
    );

    this.scheduledJobs.set(jobKey, {
      workflowId,
      nodeId,
      cronExpression,
      task,
    });

    logger.info(`Successfully scheduled workflow ${workflowId} with cron: ${cronExpression}`);
  }

  private async triggerScheduledWorkflow(
    workflowId: string,
    nodeId: string,
    userId: string
  ) {
    try {
      logger.info(`Triggering scheduled workflow: ${workflowId}`);

      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow || !workflow.active) {
        logger.warn(`[CRON CHECK] Workflow ${workflowId} not found or inactive (active=${workflow?.active}), unscheduling`);
        this.unscheduleWorkflow(workflowId, nodeId);
        return;
      }

      const executionId = uuidv4();

      const executionData = {
        executionId,
        workflowId: workflow.id,
        userId: userId,
        triggeredBy: "schedule" as const,
        triggeredAt: new Date().toISOString(),
        status: "queued" as const,
        priority: "normal" as const,
        maxRetries: 3,
        timeout: 300000,
        metadata: {
          source: "schedule",
          nodeId,
          scheduledTime: new Date().toISOString(),
        },
        workflow: {
          id: workflow.id,
          name: workflow.name,
          active: workflow.active,
          nodes: workflow.nodes,
          edges: workflow.edges,
        },
      };

      await workflowQueue.add("execute-workflow", executionData, {
        jobId: executionId,
        priority: 2,
      });

      logger.info(`Scheduled workflow ${workflowId} queued for execution: ${executionId}`);
    } catch (error: any) {
      logger.error(`Error triggering scheduled workflow ${workflowId}:`, error);
    }
  }

  unscheduleWorkflow(workflowId: string, nodeId: string) {
    const jobKey = `${workflowId}-${nodeId}`;
    const job = this.scheduledJobs.get(jobKey);

    if (job) {
      logger.info(`Stopping schedule for ${jobKey}`);
      job.task.stop();
      this.scheduledJobs.delete(jobKey);
      logger.info(`Unscheduled workflow ${workflowId} node ${nodeId}`);
    } else {
      logger.debug(`Attempted to unschedule non-existent job ${jobKey}`);
    }
  }

  async refreshWorkflowSchedules(workflowId: string) {
    try {
      const existingJobs = Array.from(this.scheduledJobs.entries()).filter(
        ([key]) => key.startsWith(workflowId)
      );

      for (const [key] of existingJobs) {
        const parts = key.split("-");
        if (parts.length >= 2 && parts[0] && parts[1]) {
          this.unscheduleWorkflow(parts[0], parts[1]);
        }
      }

      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (workflow && workflow.active) {
        const nodes = workflow.nodes as any[];
        const scheduleTriggers = nodes.filter(
          (node) => node.type === "scheduleTrigger"
        );

        for (const trigger of scheduleTriggers) {
          if (trigger.data?.cronExpression) {
            this.scheduleWorkflow(
              workflow.id,
              trigger.id,
              trigger.data.cronExpression,
              workflow.userId
            );
          }
        }
      }

      logger.info(`Refreshed schedules for workflow ${workflowId}`);
    } catch (error: any) {
      logger.error(`Error refreshing schedules for workflow ${workflowId}:`, error);
    }
  }

  getScheduledJobs() {
    return Array.from(this.scheduledJobs.entries()).map(([key, job]) => ({
      key,
      workflowId: job.workflowId,
      nodeId: job.nodeId,
      cronExpression: job.cronExpression,
    }));
  }

  shutdown() {
    logger.info("Shutting down schedule service...");
    for (const [, job] of this.scheduledJobs) {
      job.task.stop();
    }
    this.scheduledJobs.clear();
    this.subscriber.disconnect();
    logger.info("Schedule service shut down");
  }
}

export const scheduleService = new ScheduleService();
