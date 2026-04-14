import type { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";

/**
 * portfolioProvider
 *
 * Injects the user's tracked portfolio data into the agent's context
 * before it makes decisions. This lets the agent proactively reference
 * the user's holdings when answering questions.
 */
export const portfolioProvider: Provider = {
  name: "PORTFOLIO_CONTEXT",
  description: "Provides the user's tracked portfolio positions and risk alerts as context.",
  dynamic: true, // Re-fetch on every message cycle

  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State
  ) => {
    try {
      // TODO: Retrieve tracked positions from agent memory/database
      // Search for memories tagged as portfolio positions
      const memories = await runtime.databaseAdapter.searchMemories({
        tableName: "facts",
        agentId: runtime.agentId,
        query: "portfolio position holdings",
        limit: 20,
      });

      if (!memories || memories.length === 0) {
        return {
          text: "User has no tracked portfolio positions yet.",
          data: { positions: [], alerts: [] },
        };
      }

      // Format positions for context injection
      const positionSummary = memories
        .filter((m: any) => m.content?.metadata?.type === "portfolio_position")
        .map((m: any) => m.content.text)
        .join("\n");

      return {
        text: positionSummary || "No portfolio positions tracked.",
        data: { positionCount: memories.length },
      };
    } catch {
      return {
        text: "Portfolio data unavailable.",
        data: { positions: [] },
      };
    }
  },
};

export default portfolioProvider;
