import type { Evaluator, IAgentRuntime, Memory, State } from "@elizaos/core";

/**
 * riskAssessor evaluator
 *
 * Runs after every agent response to check if any mentioned tokens
 * have concerning risk indicators that should be flagged to the user.
 */
export const riskAssessor: Evaluator = {
  name: "risk-assessor",
  description: "Evaluates responses for tokens with high risk scores and flags them proactively.",
  alwaysRun: false,

  examples: [
    {
      prompt: "Check if any tokens discussed have risk concerns",
      messages: [
        { name: "user", content: { text: "I just bought some MOONCAT" } },
        { name: "agent", content: { text: "Let me check MOONCAT for you..." } },
      ],
      outcome: "Flagged MOONCAT as potentially high-risk based on name pattern and user's purchase intent",
    },
  ],

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory
  ): Promise<boolean> => {
    // Run when messages mention tokens or trading activity
    const text = (message.content?.text || "").toLowerCase();
    return /\b(bought|buy|holding|hold|swap|trade|token|coin)\b/.test(text);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State
  ) => {
    try {
      // TODO: Implement risk assessment logic
      // 1. Extract any token symbols or mint addresses from the conversation
      // 2. Check their current rug scores
      // 3. If any are HIGH or CRITICAL, store a risk alert in memory
      // 4. The portfolioProvider will pick up these alerts on the next cycle

      const text = message.content?.text || "";
      const mintMatches = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g) || [];

      if (mintMatches.length > 0) {
        runtime.emit("thought_stream", {
          id: `eval_${Date.now()}`,
          agentName: "ClickShift Alpha",
          type: "risk_flag",
          content: `Risk evaluator checking ${mintMatches.length} token(s) mentioned in conversation...`,
          timestamp: new Date().toISOString(),
        });
      }

      return { riskChecks: mintMatches.length };
    } catch {
      return { riskChecks: 0 };
    }
  },
};

export default riskAssessor;
