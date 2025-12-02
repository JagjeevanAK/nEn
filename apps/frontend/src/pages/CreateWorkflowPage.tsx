import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReactFlow,
  type FitViewOptions,
  type OnNodeDrag,
  type DefaultEdgeOptions,
  Controls,
  Background,
  MiniMap,
  ControlButton,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AddTrigger } from "@/components/AddTrigger";
import { ManualTriggerNode } from "@/components/nodeComponents/ManualTriggerNode";
import { ScheduledTriggerNode } from "@/components/nodeComponents/ScheduleTrigger";
import { WebhookTriggerNode } from "@/components/nodeComponents/WebhookTrigger";
import { CreateWorkflowNavbar } from "@/components/CreateWorkflowNavbar";
import { useWorkflowStore } from "@/store/workflowStore";

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};
const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
};
const onNodeDrag: OnNodeDrag = (_, node) => {
  console.log("drag event", node.data);
};
const nodeTypes = {
  addTrigger: AddTrigger,
  manualTrigger: ManualTriggerNode,
  scheduleTrigger: ScheduledTriggerNode,
  webhookTrigger: WebhookTriggerNode,
};

const CreateWorkflowPage = () => {
  const navigate = useNavigate();

  const {
    nodes,
    edges,
    isWorkflowActive,
    projectName,
    onNodesChange,
    onEdgesChange,
    onConnect,
    saveWorkflow,
    setIsWorkflowActive,
    setProjectName,
    loadTriggers,
    loadUserCredentials,
    isSaving,
    resetWorkflow,
  } = useWorkflowStore();

  useEffect(() => {
    // Only reset if there's no work in progress (just the initial trigger node)
    // This prevents losing work on page refresh
    const hasOnlyInitialNode = nodes.length <= 1 && nodes[0]?.type === 'addTrigger';
    if (hasOnlyInitialNode) {
      resetWorkflow();
    }
    loadTriggers();
    loadUserCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, not when function references change

  const handleSave = async () => {
    try {
      const workflowId = await saveWorkflow();
      if (workflowId) {
        navigate(`/workflow/${workflowId}`);
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <CreateWorkflowNavbar
        projectName={projectName}
        isActive={isWorkflowActive}
        onSave={handleSave}
        onActiveToggle={setIsWorkflowActive}
        onNameChange={setProjectName}
        isSaving={isSaving}
      />
      <div className="flex-1">
        <ReactFlow
          className="h-full w-full"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDrag={onNodeDrag}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={fitViewOptions}
          defaultEdgeOptions={defaultEdgeOptions}
        >
          <Controls>
            <ControlButton
              onClick={() => { }}
            />
          </Controls>
          <Background />
          <MiniMap nodeStrokeWidth={3} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default CreateWorkflowPage;