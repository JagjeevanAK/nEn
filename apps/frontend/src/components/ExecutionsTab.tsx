/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/config/api";
import { CheckCircle2, Clock, XCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";

interface Execution {
    id: string;
    workflowId: string;
    workflowName: string;
    status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
    triggeredBy: string;
    startedAt: string;
    finishedAt: string | null;
    duration: number | null;
    error: string | null;
}

export const ExecutionsTab = () => {
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    const fetchExecutions = async () => {
        try {
            setLoading(true);
            const params: any = { limit: 100 };
            if (filter !== "all") {
                params.status = filter;
            }

            const res = await axios.get(
                `${BACKEND_URL}/api/v1/workflow/executions/list`,
                {
                    params,
                    withCredentials: true
                }
            );

            setExecutions(res.data.data.executions);
        } catch (error) {
            console.error("Failed to fetch executions", error);
            toast.error("Failed to load executions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExecutions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            COMPLETED: { color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle2 },
            FAILED: { color: "bg-red-100 text-red-700 border-red-300", icon: XCircle },
            RUNNING: { color: "bg-blue-100 text-blue-700 border-blue-300", icon: PlayCircle },
            QUEUED: { color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: Clock },
            CANCELLED: { color: "bg-gray-100 text-gray-700 border-gray-300", icon: XCircle },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.QUEUED;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                <Icon className="w-3 h-3" />
                {status}
            </span>
        );
    };

    const formatDuration = (duration: number | null) => {
        if (!duration) return "N/A";
        const seconds = duration / 1000;
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Filter:</span>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                    <option value="all">All</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                    <option value="RUNNING">Running</option>
                    <option value="QUEUED">Queued</option>
                </select>
            </div>

            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="h-8 w-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-teal-600">Loading executions...</span>
                </div>
            )}

            {!loading && executions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No executions found</p>
                </div>
            )}

            {!loading && executions.length > 0 && (
                <div className="space-y-3">
                    {executions.map((exec) => (
                        <Card
                            key={exec.id}
                            className="hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-base font-semibold">
                                            {exec.workflowName}
                                        </CardTitle>
                                        {getStatusBadge(exec.status)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(exec.startedAt).toLocaleString()}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Triggered by:</span>
                                        <p className="font-medium capitalize">{exec.triggeredBy}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Duration:</span>
                                        <p className="font-medium">{formatDuration(exec.duration)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Started:</span>
                                        <p className="font-medium">
                                            {new Date(exec.startedAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Finished:</span>
                                        <p className="font-medium">
                                            {exec.finishedAt
                                                ? new Date(exec.finishedAt).toLocaleTimeString()
                                                : "In progress"}
                                        </p>
                                    </div>
                                </div>
                                {exec.error && (
                                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                        <strong>Error:</strong> {exec.error}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
