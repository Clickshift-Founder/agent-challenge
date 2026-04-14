import type { Plugin, IAgentRuntime } from "@elizaos/core";

// Actions
import { checkRugScore } from "./actions/checkRugScore";
import { analyzeToken } from "./actions/analyzeToken";
import { trackWallet } from "./actions/trackWallet";
import { portfolioStatus } from "./actions/portfolioStatus";

// Providers
import { portfolioProvider } from "./providers/portfolioProvider";
import { marketDataProvider } from "./providers/marketDataProvider";
import { thoughtStreamProvider, addThought } from "./providers/thoughtStreamProvider";

// Evaluators
import { riskAssessor } from "./evaluators/riskAssessor";
import { factExtractor } from "./evaluators/factExtractor";

// Services
import { SolanaService } from "./services/solanaService";

// Routes
import { routes } from "./routes";

/**
 * defi-intelligence plugin
 *
 * The core plugin for the ClickShift Alpha agent. Provides:
 * - 4 Actions: rug check, token analysis, wallet tracking, portfolio status
 * - 3 Providers: portfolio context, market data, thought stream
 * - 2 Evaluators: risk assessor, fact extractor
 * - 1 Service: Solana RPC connection
 * - 3 Routes: thought stream SSE, recent thoughts API, health check
 *
 * Architecture follows the ElizaOS v2 plugin pattern:
 *   Providers (context) → Agent reasoning → Actions (execution) → Evaluators (learning)
 */
export const defiIntelligencePlugin: Plugin = {
  name: "defi-intelligence",
  description:
    "DeFi trading intelligence plugin for Solana — rug detection, token analysis, wallet tracking, and transparent reasoning.",

  // ── Initialization ────────────────────────────────────
  init: async (_config: Record<string, string>, runtime: IAgentRuntime) => {
    console.log("[defi-intelligence] Plugin initializing...");

    // Wire up the thought stream event listener
    // When any action emits a thought, capture it in the buffer
    (runtime as any).on("thought_stream", (thought: any) => {
      addThought(thought);
    });

    // Emit startup thought
    (runtime as any).emit("thought_stream", {
      id: `init_${Date.now()}`,
      agentName: "ClickShift Alpha",
      type: "wake",
      content: "ClickShift Alpha online. DeFi intelligence systems active. Ready for analysis.",
      timestamp: new Date().toISOString(),
    });

    console.log("[defi-intelligence] Plugin initialized successfully.");
  },

  // ── Actions (what the agent can DO) ───────────────────
  actions: [
    checkRugScore,
    analyzeToken,
    trackWallet,
    portfolioStatus,
  ],

  // ── Providers (what the agent can SEE) ────────────────
  providers: [
    portfolioProvider,
    marketDataProvider,
    thoughtStreamProvider,
  ],

  // ── Evaluators (what the agent LEARNS) ────────────────
  evaluators: [
    riskAssessor,
    factExtractor,
  ],

  // ── Services (persistent connections) ─────────────────
  services: [SolanaService],

  // ── Routes (HTTP endpoints) ───────────────────────────
  routes,

  // ── Events ────────────────────────────────────────────
  events: {
    MESSAGE_RECEIVED: [
      async (params: any) => {
        // Log incoming messages to thought stream
        const runtime = params.runtime as IAgentRuntime;
        if (runtime) {
          (runtime as any).emit("thought_stream", {
            id: `msg_${Date.now()}`,
            agentName: "ClickShift Alpha",
            type: "wake",
            content: `Message received. Processing...`,
            timestamp: new Date().toISOString(),
          });
        }
      },
    ],
  },
};

export default defiIntelligencePlugin;

