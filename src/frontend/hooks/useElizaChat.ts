/**
 * useElizaChat — Custom hook for ElizaOS Socket.IO communication
 *
 * Handles:
 * - Socket.IO connection to the ElizaOS server
 * - Sending messages through the message bus
 * - Receiving agent responses via messageBroadcast
 * - Connection state management
 *
 * ElizaOS messaging flow:
 *   Client → API Proxy → ElizaOS Server → Message Bus → Agent Runtime
 *   Client ← Socket.IO ← Message Bus ← Agent Response
 */

import { useState, useEffect, useRef, useCallback } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseElizaChatOptions {
  serverUrl?: string;
  agentId?: string;
}

// Default channel for ElizaOS centralized messaging
const CENTRAL_CHANNEL = "00000000-0000-0000-0000-000000000000";

export function useElizaChat(options: UseElizaChatOptions = {}) {
  const {
    serverUrl = process.env.NEXT_PUBLIC_ELIZA_URL || "http://localhost:3000",
    agentId,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string>(agentId || "");

  const socketRef = useRef<any>(null);
  const userEntityRef = useRef<string>(`user_${Date.now()}`);

  // Initialize connection
  useEffect(() => {
    let socket: any;

    async function connect() {
      try {
        // Dynamically import socket.io-client
        const { io } = await import("socket.io-client");

        socket = io(serverUrl, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });

        socket.on("connect", async () => {
          setIsConnected(true);
          setError(null);
          console.log("[ElizaChat] Connected to ElizaOS server");

          // Fetch available agents if no agentId provided
          if (!currentAgentId) {
            try {
              const res = await fetch(`${serverUrl}/api/agents`);
              const data = await res.json();
              if (data?.agents?.length > 0) {
                const firstAgent = data.agents[0];
                setCurrentAgentId(firstAgent.id);

                // Add agent to central channel
                await fetch(
                  `${serverUrl}/api/agents/${firstAgent.id}/rooms/${CENTRAL_CHANNEL}`,
                  { method: "POST" }
                );
              }
            } catch (e) {
              console.warn("[ElizaChat] Could not fetch agents:", e);
            }
          }
        });

        // Listen for agent responses
        socket.on("messageBroadcast", (data: any) => {
          if (
            data.channelId === CENTRAL_CHANNEL &&
            data.senderId !== userEntityRef.current
          ) {
            const agentMessage: ChatMessage = {
              id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              role: "agent",
              text: data.body?.text || data.text || "",
              timestamp: new Date(),
            };

            setMessages((prev) => [...prev, agentMessage]);
            setIsLoading(false);
          }
        });

        socket.on("disconnect", () => {
          setIsConnected(false);
          console.log("[ElizaChat] Disconnected from ElizaOS server");
        });

        socket.on("connect_error", (err: any) => {
          setError(`Connection failed: ${err.message}`);
          setIsConnected(false);
        });

        socketRef.current = socket;
      } catch (err: any) {
        setError(`Failed to initialize: ${err.message}`);
      }
    }

    connect();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [serverUrl, currentAgentId]);

  // Send a message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        text: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Send via REST API (more reliable than Socket.IO for initial message)
        const response = await fetch(
          `${serverUrl}/api/agents/${currentAgentId}/message`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: text.trim(),
              entityId: userEntityRef.current,
              roomId: CENTRAL_CHANNEL,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();

        // If response comes back directly (non-streaming), add it
        if (data?.text || data?.[0]?.text) {
          const responseText = data?.text || data?.[0]?.text;
          const agentMessage: ChatMessage = {
            id: `msg_${Date.now()}_agent`,
            role: "agent",
            text: responseText,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, agentMessage]);
          setIsLoading(false);
        }
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);

        // Add error message to chat
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}_error`,
            role: "agent",
            text: `Connection issue: ${err.message}. Make sure the ElizaOS server is running.`,
            timestamp: new Date(),
          },
        ]);
      }
    },
    [serverUrl, currentAgentId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isConnected,
    isLoading,
    error,
    agentId: currentAgentId,
  };
}

export default useElizaChat;
