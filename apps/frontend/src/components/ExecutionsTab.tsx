/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/config/api";
import { 
  Clock, 
  ChevronRight, 
  ChevronDown,
  AlertCircle,
  Calendar
} from "lucide-react";
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
  workflow?: {
    active: boolean;
  };
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
  isActive: boolean;
}

export const ExecutionsTabImproved = () => {
  const [workflowGroups, setWorkflowGroups] = useState<WorkflowGroup[]>([]);
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());
  const [expandedExecutions, setExpandedExecutions] = useState<Set<string>>(new Set());
  const [hoveredWorkflow, setHoveredWorkflow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [executionDetails, setExecutionDetails] = useState<Map<string, ExecutionDetails>>(new Map());
  const [detailsLoading, setDetailsLoading] = useState<Set<string>>(new Set());

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
            isActive: exec.workflow?.active ?? true,
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
    if (executionDetails.has(executionId)) {
      return;
    }

    try {
      setDetailsLoading(prev => new Set(prev).add(executionId));
      const res = await axios.get(
        `${BACKEND_URL}/api/v1/workflow/executions/${executionId}`,
        { withCredentials: true }
      );
      setExecutionDetails(prev => new Map(prev).set(executionId, res.data.data));
    } catch (error) {
      console.error("Failed to fetch execution details", error);
      toast.error("Failed to load execution details");
    } finally {
      setDetailsLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(executionId);
        return newSet;
      });
    }
  };

  const toggleExecution = async (executionId: string) => {
    const newExpanded = new Set(expandedExecutions);
    if (newExpanded.has(executionId)) {
      newExpanded.delete(executionId);
    } else {
      newExpanded.add(executionId);
      await fetchExecutionDetails(executionId);
    }
    setExpandedExecutions(newExpanded);
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
            <Card key={group.workflowId} className="border border-gray-200 overflow-hidden py-0 gap-0">
              {/* Workflow Header */}
              <div
                onClick={() => toggleWorkflow(group.workflowId)}
                onMouseEnter={() => setHoveredWorkflow(group.workflowId)}
                onMouseLeave={() => setHoveredWorkflow(null)}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{group.workflowName}</h4>
                    {hoveredWorkflow === group.workflowId && (
                      expandedWorkflows.has(group.workflowId) ? (
                        <ChevronDown className="w-[1em] h-[1em] text-gray-600" />
                      ) : (
                        <ChevronRight className="w-[1em] h-[1em] text-gray-600" />
                      )
                    )}
                    <p className="text-xs text-gray-500">
                      Last run: {formatRelativeTime(group.lastRun)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Active Status Label - Middle */}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      group.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {group.isActive ? 'Active' : 'Not Active'}
                    </span>
                    
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
              </div>

              {/* Executions List (Expanded) */}
              {expandedWorkflows.has(group.workflowId) && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="divide-y divide-gray-200">
                    {group.executions.map((exec) => {
                      const isExpanded = expandedExecutions.has(exec.id);
                      const details = executionDetails.get(exec.id);
                      const isLoadingDetails = detailsLoading.has(exec.id);

                      return (
                        <div key={exec.id}>
                          <div
                            onClick={() => toggleExecution(exec.id)}
                            className="p-3 hover:bg-white cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                )}
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
                              
                              <div className="flex items-center gap-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  exec.status === 'COMPLETED' 
                                    ? 'bg-green-100 text-green-700' 
                                    : exec.status === 'FAILED'
                                    ? 'bg-red-100 text-red-700'
                                    : exec.status === 'RUNNING'
                                    ? 'bg-blue-100 text-blue-700'
                                    : exec.status === 'QUEUED'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {exec.status === 'COMPLETED' ? 'Success' : exec.status === 'FAILED' ? 'Failed' : exec.status}
                                </span>
                                
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

                          {/* Execution Details (Expanded) */}
                          {isExpanded && (
                            <div className="bg-white border-t border-gray-200 p-4">
                              {isLoadingDetails && (
                                <div className="flex justify-center items-center py-8">
                                  <div className="h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="ml-2 text-teal-600">Loading details...</span>
                                </div>
                              )}

                              {!isLoadingDetails && details && (
                                <div className="space-y-4">
                                  {/* Overview */}
                                  <Card className="border-gray-200">
                                    <CardContent className="pt-4">
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <p className="text-gray-500 mb-1">Execution ID</p>
                                          <p className="font-mono text-xs">{details.id}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 mb-1">Duration</p>
                                          <p className="font-medium">{formatDuration(details.duration)}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 mb-1">Started At</p>
                                          <p className="font-medium flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(details.startedAt).toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 mb-1">Finished At</p>
                                          <p className="font-medium">
                                            {details.finishedAt 
                                              ? new Date(details.finishedAt).toLocaleString()
                                              : "In progress"}
                                          </p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Error Display */}
                                  {details.error && (
                                    <Card className="border-red-200 bg-red-50">
                                      <CardContent className="pt-4">
                                        <div className="flex items-start gap-2">
                                          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                          <div>
                                            <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                                            <p className="text-sm text-red-800 whitespace-pre-wrap font-mono">
                                              {details.error}
                                            </p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}

                                  {/* Node Results */}
                                  {details.nodeResults && details.nodeResults.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-3">Node Execution Results</h4>
                                      <div className="space-y-2">
                                        {details.nodeResults.map((nodeResult: any, index: number) => (
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
                                  {details.metadata && Object.keys(details.metadata).length > 0 && (
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-3">Metadata</h4>
                                      <Card className="border border-gray-200">
                                        <CardContent className="pt-4">
                                          <pre className="text-xs overflow-x-auto bg-gray-50 p-3 rounded">
                                            {JSON.stringify(details.metadata, null, 2)}
                                          </pre>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};
