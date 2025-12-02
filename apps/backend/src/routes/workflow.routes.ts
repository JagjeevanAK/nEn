import { Router } from "express";
import {
  saveWorkflow,
  getWorkflowById,
  updateWorkflow,
  getUserWorkflows,
  executeFlow,
  deleteWorkflow
} from "../controllers/workflow.controller";
import {
  getUserExecutions,
  getExecutionDetails,
  getExecutionStats
} from "../controllers/execution.controller";
import { isLoggedIn } from "../middlewares/auth.middleware";

const router = Router();

router.get('/executions/list', isLoggedIn, getUserExecutions);
router.get('/executions/stats', isLoggedIn, getExecutionStats);
router.get('/executions/:executionId', isLoggedIn, getExecutionDetails);

router.post('/save', isLoggedIn, saveWorkflow);
router.get('/:workflowId', isLoggedIn, getWorkflowById);
router.put('/:workflowId', isLoggedIn, updateWorkflow);
router.get('/', isLoggedIn, getUserWorkflows);
router.post('/execute/:workflowId', isLoggedIn, executeFlow)
router.post('/getAllWorkflows', isLoggedIn, getUserWorkflows)
router.delete('/:workflowId', isLoggedIn, deleteWorkflow)
export default router;
