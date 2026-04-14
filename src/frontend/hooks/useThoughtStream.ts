/**
 * useThoughtStream — Custom hook for real-time agent reasoning via SSE
 *
 * Connects to the /api/defi/thought-stream SSE endpoint and
 * maintains a buffer of the agent's reasoning steps for display.
 */

import { useState, useEffect, useRef, useCallback } from "react";

export interface ThoughtEntry {
  id: string;
  agentName: string;
  type:
    | "wake"
    | "read_context"
    | "reasoning"
    | "action_decision"
    | "action_result"
    | "risk_flag"
    | "sleep";
  content: string;
  timestamp: string;
}

interface UseThoughtStreamOptions {
  serverUrl?: string;
  maxEntries?: number;
}

export function useThoughtStream(options: UseThoughtStreamOptions = {}) {
  const {
    serverUrl = process.env.NEXT_PUBLIC_ELIZA_URL || "http://localhost:3000",
    maxEntries = 50,
  } = options;

  const [thoughts, setThoughts] = useState<ThoughtEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let es: EventSource;

    function connect() {
      try {
        es = new EventSource(`${serverUrl}/api/defi/thought-stream`);

        es.onopen = () => {
          setIsConnected(true);
        };

        es.onmessage = (event) => {
          try {
            const thought: ThoughtEntry = JSON.parse(event.data);
            setThoughts((prev) => {
              const updated = [...prev, thought];
              // Keep buffer bounded
              if (updated.length > maxEntries) {
                return updated.slice(-maxEntries);
              }
              return updated;
            });
          } catch {
            // Skip malformed events
          }
        };

        es.onerror = () => {
          setIsConnected(false);
          // EventSource auto-reconnects
        };

        eventSourceRef.current = es;
      } catch {
        setIsConnected(false);
      }
    }

    connect();

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [serverUrl, maxEntries]);

  const clearThoughts = useCallback(() => {
    setThoughts([]);
  }, []);

  return {
    thoughts,
    isConnected,
    clearThoughts,
  };
}

// Map thought types to display properties
export function getThoughtMeta(type: ThoughtEntry["type"]) {
  switch (type) {
    case "wake":
      return { label: "WAKE", color: "#5DCAA5", icon: "◉" };
    case "read_context":
      return { label: "READ", color: "#85B7EB", icon: "◎" };
    case "reasoning":
      return { label: "THINK", color: "#AFA9EC", icon: "◈" };
    case "action_decision":
      return { label: "DECIDE", color: "#F0997B", icon: "◆" };
    case "action_result":
      return { label: "RESULT", color: "#5DCAA5", icon: "◇" };
    case "risk_flag":
      return { label: "RISK", color: "#F09595", icon: "◬" };
    case "sleep":
      return { label: "SLEEP", color: "#888780", icon: "◌" };
    default:
      return { label: "LOG", color: "#888780", icon: "·" };
  }
}

export default useThoughtStream;
