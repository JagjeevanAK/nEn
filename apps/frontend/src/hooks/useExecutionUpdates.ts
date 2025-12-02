import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { BACKEND_URL, WS_URL } from "@/config/api";

interface ExecutionEvent {
  executionId: string;
  workflowId: string;
  workflowName: string;
  userId: string;
  nodeId: string;
  timeStamp: string;
  status: "started" | "completed" | "failed";
  data?: unknown;
}

interface UseExecutionUpdatesOptions {
  onEvent?: (event: ExecutionEvent) => void;
  onNewExecution?: (event: ExecutionEvent) => void;
  onExecutionComplete?: (event: ExecutionEvent) => void;
}

export const useExecutionUpdates = (options: UseExecutionUpdatesOptions = {}) => {
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const activeExecutionsRef = useRef<Set<string>>(new Set());
  const maxReconnectAttempts = 5;

  const fetchUserId = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/v1/auth/me`, {
        withCredentials: true,
      });
      setUserId(res.data.data.id);
      return res.data.data.id;
    } catch {
      console.error("Failed to fetch user ID");
      return null;
    }
  }, []);

  const connect = useCallback((uid: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const wsUrl = `${WS_URL}/user/${uid}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Execution WebSocket connected");
      setConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data: ExecutionEvent = JSON.parse(event.data);
        
        options.onEvent?.(data);
        
        if (data.nodeId === "workflow" && data.status === "started") {
          activeExecutionsRef.current.add(data.executionId);
          options.onNewExecution?.(data);
        }
        
        if (data.nodeId === "workflow" && (data.status === "completed" || data.status === "failed")) {
          activeExecutionsRef.current.delete(data.executionId);
          options.onExecutionComplete?.(data);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    ws.onclose = () => {
      console.log("Execution WebSocket closed");
      setConnected(false);
      wsRef.current = null;
      
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(3000 * reconnectAttemptsRef.current, 15000);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (uid) connect(uid);
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error("Execution WebSocket error", error);
    };

    wsRef.current = ws;
  }, [options]);

  useEffect(() => {
    const init = async () => {
      const uid = await fetchUserId();
      if (uid) {
        connect(uid);
      }
    };
    
    init();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchUserId, connect]);

  return { connected, userId };
};
