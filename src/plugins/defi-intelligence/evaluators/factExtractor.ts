import type { Evaluator, IAgentRuntime, Memory, State } from "@elizaos/core";

/**
 * factExtractor evaluator
 *
 * Extracts portfolio-relevant facts from user messages and stores them.
 * Examples: "I hold 500 JUP", "I'm bearish on memes", "My wallet is 7xKX..."
 */
export const factExtractor: Evaluator = {
  name: "defi-fact-extractor",
  description: "Extracts and stores DeFi-relevant facts like holdings, preferences, and wallet addresses from user messages.",
  alwaysRun: true,

  examples: [
    {
      prompt: "Extract portfolio facts",
      messages: [
        { name: "user", content: { text: "I have 12.5 SOL and about 2 million BONK" } },
      ],
      outcome: "Stored: User holds 12.5 SOL and 2M BONK",
    },
  ],

  validate: async (): Promise<boolean> => {
    return true; // Always check for extractable facts
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State
  ) => {
    const text = message.content?.text || "";

    // Pattern: "I have/hold/own X amount of TOKEN"
    const holdingPatterns = text.match(
      /\b(?:i\s+(?:have|hold|own|got|bought))\s+(?:about\s+)?(\d[\d,.]*[kmb]?)\s+(?:of\s+)?(\$?[a-zA-Z]{2,10})\b/gi
    );

    // Pattern: Solana wallet address
    const walletPatterns = text.match(
      /\b(?:my\s+wallet\s+(?:is|address)?:?\s*)?([1-9A-HJ-NP-Za-km-z]{32,44})\b/g
    );

    const facts: string[] = [];

    if (holdingPatterns) {
      for (const match of holdingPatterns) {
        facts.push(`User stated: ${match.trim()}`);
      }
    }

    if (walletPatterns) {
      for (const addr of walletPatterns) {
        facts.push(`User's wallet address: ${addr.trim()}`);
      }
    }

    // Store extracted facts
    if (facts.length > 0) {
      for (const fact of facts) {
        try {
          await runtime.databaseAdapter.createMemory(
            {
              id: crypto.randomUUID() as any,
              entityId: message.entityId,
              roomId: message.roomId,
              agentId: runtime.agentId,
              content: {
                text: fact,
                metadata: { type: "portfolio_fact", source: "user_message" },
              },
              createdAt: Date.now(),
            },
            "facts"
          );
        } catch {
          // Non-critical — continue even if storage fails
        }
      }

      runtime.emit("thought_stream", {
        id: `fact_${Date.now()}`,
        agentName: "ClickShift Alpha",
        type: "read_context",
        content: `Extracted ${facts.length} fact(s): ${facts.join("; ")}`,
        timestamp: new Date().toISOString(),
      });
    }

    return { factsExtracted: facts.length, facts };
  },
};

export default factExtractor;
