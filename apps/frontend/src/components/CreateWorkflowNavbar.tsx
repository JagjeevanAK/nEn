/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Save, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { ActionForm, availableActions, type ActionI } from "@/lib/Actions";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useWorkflowStore } from "@/store/workflowStore";

interface CreateWorkflowNavbarProps {
  projectName?: string;
  isActive?: boolean;
  onSave?: () => void;
  onActiveToggle?: (active: boolean) => void;
  onNameChange?: (newName: string) => void;
  isSaving?: boolean;
}

export function CreateWorkflowNavbar({
  projectName = "New Workflow",
  isActive = false,
  onSave,
  onActiveToggle,
  onNameChange,
  isSaving = false,
}: CreateWorkflowNavbarProps) {
  const [dialogState, setDialogState] = useState("actions");
  const [selectedAction, setSelectedAction] = useState<ActionI | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get addActionNode from store
  const addActionNode = useWorkflowStore((state) => state.addActionNode);

  const handleActionSelect = (action: ActionI) => {
    setSelectedAction(action);
    setDialogState("form");
  };

  const handleBackToActions = () => {
    setDialogState("actions");
    setSelectedAction(null);
  };

  const handleFormSubmit = (data: {
    action: ActionI;
    formData: any;
    credentials: any;
    metadata: any;
  }) => {
    console.log("Form submitted:", data);

    addActionNode({
      name: data.action.name,
      type: data.action.type,
      application: data.action.application,
      parameters: data.formData,
      credentials: data.credentials,
      metadata: data.metadata,
      actionDefinition: data.action,
    });

    setDialogState("actions");
    setSelectedAction(null);
    setIsDialogOpen(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setDialogState("actions");
      setSelectedAction(null);
    }
  };

  const handleNameClick = () => {
    setIsEditingName(true);
    setEditedName(projectName);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (editedName.trim() && editedName !== projectName) {
      onNameChange?.(editedName.trim());
    } else {
      setEditedName(projectName);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setEditedName(projectName);
      setIsEditingName(false);
    }
  };

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    setEditedName(projectName);
  }, [projectName]);

  return (
    <nav className="w-full flex items-center justify-between py-2 px-3 mt-1 border-b bg-white">
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 rounded bg-teal-600"></div>
        {isEditingName ? (
          <input
            ref={inputRef}
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="text-xl font-semibold text-gray-800 bg-transparent border-b-2 border-teal-500 focus:outline-none px-1 min-w-[200px]"
          />
        ) : (
          <h2 
            className="text-xl font-semibold text-gray-800 cursor-pointer hover:text-teal-600 transition-colors"
            onClick={handleNameClick}
          >
            {projectName}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">
            Active
          </span>
          <Switch
            checked={isActive}
            onCheckedChange={onActiveToggle}
            className="data-[state=checked]:bg-teal-500"
          />
          <span className="text-xs text-gray-500 sm:hidden">
            {isActive ? "On" : "Off"}
          </span>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black cursor-pointer border border-b-3 hover:bg-teal-100 border-neutral-700">
              Add Action
            </Button>
          </DialogTrigger>

          <DialogContent>
            {dialogState === "actions" && (
              <div className="flex flex-col max-h-[50vh] overflow-scroll">
                <DialogTitle className="font-semibold text-teal-600 text-lg mb-2">
                  Select the Action
                </DialogTitle>
                {availableActions.map((action) => {
                  return (
                    <div className="ml-5" key={action.id}>
                      <div
                        onClick={() => handleActionSelect(action)}
                        className="flex cursor-pointer bg-teal-50 items-center w-[90%] gap-2 py-1 my-1 px-2 border border-neutral-300 rounded-sm hover:bg-teal-100 transition-colors"
                      >
                        <span>{action.icon}</span>
                        <div>{action.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {dialogState === "form" && selectedAction && (
              <ActionForm
                action={selectedAction}
                onBack={handleBackToActions}
                onSubmit={handleFormSubmit}
              />
            )}
          </DialogContent>
        </Dialog>

        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isSaving ? "Creating..." : "Create Workflow"}
          </span>
        </Button>
      </div>
    </nav>
  );
}