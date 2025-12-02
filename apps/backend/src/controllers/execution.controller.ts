import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { CustomError } from "../utils/CustomError";
import { prisma } from "@nen/db";
import logger from "../utils/logger";

export const getUserExecutions = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { status, workflowId, limit = "50", offset = "0" } = req.query;

    if (!userId) {
        throw new CustomError(401, "User not authenticated");
    }

    try {
        const where: any = { userId };

        if (status && typeof status === "string") {
            where.status = status.toUpperCase();
        }

        if (workflowId && typeof workflowId === "string") {
            where.workflowId = workflowId;
        }

        const executions = await prisma.workflowExecution.findMany({
            where,
            orderBy: { startedAt: "desc" },
            take: Number(limit),
            skip: Number(offset),
            select: {
                id: true,
                workflowId: true,
                workflowName: true,
                status: true,
                triggeredBy: true,
                startedAt: true,
                finishedAt: true,
                duration: true,
                error: true,
                workflow: {
                    select: {
                        active: true,
                    },
                },
            },
        });

        const total = await prisma.workflowExecution.count({ where });

        logger.info("Executions retrieved", {
            userId,
            count: executions.length,
            total,
            filters: { status, workflowId }
        });

        res.status(200).json(
            new ApiResponse(200, "Executions retrieved successfully", {
                executions,
                total,
                limit: Number(limit),
                offset: Number(offset),
            })
        );
    } catch (error: any) {
        logger.error("Error retrieving executions", { error, userId });
        throw new CustomError(500, "Failed to retrieve executions");
    }
});

export const getExecutionDetails = asyncHandler(async (req, res) => {
    const { executionId } = req.params;
    const userId = req.user.id;

    if (!userId) {
        throw new CustomError(401, "User not authenticated");
    }

    if (!executionId) {
        throw new CustomError(400, "Execution ID is required");
    }

    try {
        const execution = await prisma.workflowExecution.findFirst({
            where: {
                id: executionId,
                userId
            },
        });

        if (!execution) {
            return res.status(404).json(
                new ApiResponse(404, "Execution not found", null)
            );
        }

        logger.info("Execution details retrieved", { executionId, userId });

        res.status(200).json(
            new ApiResponse(200, "Execution details retrieved successfully", execution)
        );
    } catch (error: any) {
        logger.error("Error retrieving execution details", { error, executionId, userId });
        throw new CustomError(500, "Failed to retrieve execution details");
    }
});

export const getExecutionStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    if (!userId) {
        throw new CustomError(401, "User not authenticated");
    }

    try {
        const stats = await prisma.workflowExecution.groupBy({
            by: ["status"],
            where: { userId },
            _count: true,
        });

        const totalExecutions = await prisma.workflowExecution.count({
            where: { userId },
        });

        const recentExecutions = await prisma.workflowExecution.count({
            where: {
                userId,
                startedAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
        });

        res.status(200).json(
            new ApiResponse(200, "Execution stats retrieved successfully", {
                total: totalExecutions,
                recent24h: recentExecutions,
                byStatus: stats.reduce((acc: any, stat) => {
                    acc[stat.status] = stat._count;
                    return acc;
                }, {}),
            })
        );
    } catch (error: any) {
        logger.error("Error retrieving execution stats", { error, userId });
        throw new CustomError(500, "Failed to retrieve execution stats");
    }
});
