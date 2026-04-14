import type { Route, IAgentRuntime } from "@elizaos/core";
import { getRecentThoughts } from "../providers/thoughtStreamProvider";

/**
 * Plugin routes expose HTTP endpoints for the frontend.
 *
 * /api/defi/thought-stream  — SSE endpoint for real-time thought stream
 * /api/defi/thoughts        — GET recent thoughts (polling fallback)
 * /api/defi/health           — Health check
 */

export const routes: Route[] = [
  // ── Thought Stream SSE ─────────────────────────────────
  {
    name: "thought-stream-sse",
    path: "/api/defi/thought-stream",
    type: "GET",
    public: true,
    handler: async (req: any, res: any, runtime: IAgentRuntime) => {
      // Set SSE headers
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });

      // Send initial thoughts
      const recent = getRecentThoughts(20);
      for (const thought of recent) {
        res.write(`data: ${JSON.stringify(thought)}\n\n`);
      }

      // Listen for new thoughts and push them
      const onThought = (thought: any) => {
        try {
          res.write(`data: ${JSON.stringify(thought)}\n\n`);
        } catch {
          // Client disconnected
        }
      };

      runtime.on("thought_stream", onThought);

      // Keep alive ping every 30s
      const keepAlive = setInterval(() => {
        try {
          res.write(": keepalive\n\n");
        } catch {
          clearInterval(keepAlive);
        }
      }, 30_000);

      // Cleanup on close
      req.on("close", () => {
        runtime.off("thought_stream", onThought);
        clearInterval(keepAlive);
      });
    },
  },

  // ── Recent Thoughts (polling fallback) ─────────────────
  {
    name: "recent-thoughts",
    path: "/api/defi/thoughts",
    type: "GET",
    public: true,
    handler: async (_req: any, res: any, _runtime: IAgentRuntime) => {
      const thoughts = getRecentThoughts(50);
      res.json({
        success: true,
        thoughts,
        count: thoughts.length,
      });
    },
  },

  // ── Health Check ───────────────────────────────────────
  {
    name: "defi-health",
    path: "/api/defi/health",
    type: "GET",
    public: true,
    handler: async (_req: any, res: any, _runtime: IAgentRuntime) => {
      res.json({
        status: "ok",
        agent: "ClickShift Alpha",
        plugin: "defi-intelligence",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      });
    },
  },
];

export default routes;
