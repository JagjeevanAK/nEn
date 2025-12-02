/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/config/api";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  PlayCircle, 
  ChevronRight, 
  ChevronDown,
  AlertCircle,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

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

interface ExecutionDetails extends Execution {
  nodeResults: any[];
  metadata: any;
}

interface WorkflowGroup {
  workflowId: string;
  workflowName: string;
  executions: Execution[];
  stats: {
    total: number;
    completed: number;
    failed: number;
    running: number;
  };
  lastRun: string;
}

export const ExecutionsTabImproved = () => {
  const [workflowGroups, setWorkflowGroups] = useState<WorkflowGroup[]>([]);
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedExecution, setSelectedExecution] = useState<ExecutionDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 500 };
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

      const executions: Execution[] = res.data.data.executions;
      
      const grouped = executions.reduce((acc: { [key: string]: WorkflowGroup }, exec) => {
        if (!acc[exec.workflowId]) {
          acc[exec.workflowId] = {
            workflowId: exec.workflowId,
            workflowName: exec.workflowName,
            executions: [],
            stats: {
              total: 0,
              completed: 0,
              failed: 0,
              running: 0,
            },
            lastRun: exec.startedAt,
          };
        }

        acc[exec.workflowId].executions.push(exec);
        acc[exec.workflowId].stats.total++;
        
        if (exec.status === "COMPLETED") acc[exec.workflowId].stats.completed++;
        if (exec.status === "FAILED") acc[exec.workflowId].stats.failed++;
        if (exec.status === "RUNNING") acc[exec.workflowId].stats.running++;
        
        if (new Date(exec.startedAt) > new Date(acc[exec.workflowId].lastRun)) {
          acc[exec.workflowId].lastRun = exec.startedAt;
        }

        return acc;
      }, {});

      const groupsArray = Object.values(grouped).sort(
        (a, b) => new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime()
      );

      setWorkflowGroups(groupsArray);
    } catch (error) {
      console.error("Failed to fetch executions", error);
      toast.error("Failed to load executions");
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutionDetails = async (executionId: string) => {
    try {
      setDetailsLoading(true);
      const res = await axios.get(
        `${BACKEND_URL}/api/v1/workflow/executions/${executionId}`,
        { withCredentials: true }
      );
      setSelectedExecution(res.data.data);
    } catch (error) {
      console.error("Failed to fetch execution details", error);
      toast.error("Failed to load execution details");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const toggleWorkflow = (workflowId: string) => {
    const newExpanded = new Set(expandedWorkflows);
    if (newExpanded.has(workflowId)) {
      newExpanded.delete(workflowId);
    } else {
      newExpanded.add(workflowId);
    }
    setExpandedWorkflows(newExpanded);
  };

  const getStatusBadge = (status: string, compact = false) => {
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
        {!compact && status}
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

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div>
      {/* Header with Filter */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Workflow Executions</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="RUNNING">Running</option>
            <option value="QUEUED">Queued</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-teal-600">Loading executions...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && workflowGroups.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No executions found</p>
          <p className="text-sm mt-1">Execute a workflow to see results here</p>
        </div>
      )}

      {/* Workflow Groups */}
      {!loading && workflowGroups.length > 0 && (
        <div className="space-y-3">
          {workflowGroups.map((group) => (
            <Card key={group.workflowId} className="border border-gray-200 overflow-hidden">
              {/* Workflow Header */}
              <div
                onClick={() => toggleWorkflow(group.workflowId)}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="shrink-0">
                      {expandedWorkflows.has(group.workflowId) ? (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{group.workflowName}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Last run: {formatRelativeTime(group.lastRun)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Stats Badges */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      {group.stats.total} total
                    </span>
                    {group.stats.completed > 0 && (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                        ✓ {group.stats.completed}
                      </span>
                    )}
                    {group.stats.failed > 0 && (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
                        ✕ {group.stats.failed}
                      </span>
                    )}
                    {group.stats.running > 0 && (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 animate-pulse">
                        ▶ {group.stats.running}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Executions List (Expanded) */}
              {expandedWorkflows.has(group.workflowId) && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="divide-y divide-gray-200">
                    {group.executions.map((exec) => (
                      <div
                        key={exec.id}
                        onClick={() => fetchExecutionDetails(exec.id)}
                        className="p-3 hover:bg-white cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {getStatusBadge(exec.status, true)}
                            <div className="text-sm">
                              <p className="text-gray-700">
                                <span className="font-medium">
                                  {new Date(exec.startedAt).toLocaleString()}
                                </span>
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Triggered by: <span className="font-medium capitalize">{exec.triggeredBy}</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-right">
                              <p className="text-gray-500 text-xs">Duration</p>
                              <p className="font-medium text-gray-700">{formatDuration(exec.duration)}</p>
                            </div>
                            {exec.error && (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Execution Details Dialog */}
      <Dialog open={!!selectedExecution} onOpenChange={() => setSelectedExecution(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Execution Details
              {selectedExecution && getStatusBadge(selectedExecution.status)}
            </DialogTitle>
          </DialogHeader>

          {detailsLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-teal-600">Loading details...</span>
            </div>
          )}

          {!detailsLoading && selectedExecution && (
            <div className="space-y-4">
              {/* Overview */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Workflow</p>
                      <p className="font-medium">{selectedExecution.workflowName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Execution ID</p>
                      <p className="font-mono text-xs">{selectedExecution.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Triggered By</p>
                      <p className="font-medium capitalize">{selectedExecution.triggeredBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Duration</p>
                      <p className="font-medium">{formatDuration(selectedExecution.duration)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Started At</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(selectedExecution.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Finished At</p>
                      <p className="font-medium">
                        {selectedExecution.finishedAt 
                          ? new Date(selectedExecution.finishedAt).toLocaleString()
                          : "In progress"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Error Display */}
              {selectedExecution.error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                        <p className="text-sm text-red-800 whitespace-pre-wrap font-mono">
                          {selectedExecution.error}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Node Results */}
              {selectedExecution.nodeResults && selectedExecution.nodeResults.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Node Execution Results</h4>
                  <div className="space-y-2">
                    {selectedExecution.nodeResults.map((nodeResult: any, index: number) => (
                      <Card key={index} className="border border-gray-200">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">
                                {nodeResult.nodeId || `Node ${index + 1}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {nodeResult.executedAt && new Date(nodeResult.executedAt).toLocaleString()}
                              </p>
                            </div>
                            {nodeResult.status && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                nodeResult.status === 'completed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {nodeResult.status}
                              </span>
                            )}
                          </div>
                          {nodeResult.output && (
                            <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(nodeResult.output, null, 2)}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedExecution.metadata && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Metadata</h4>
                  <Card className="border border-gray-200">
                    <CardContent className="pt-4">
                      <pre className="text-xs overflow-x-auto bg-gray-50 p-3 rounded">
                        {JSON.stringify(selectedExecution.metadata, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
