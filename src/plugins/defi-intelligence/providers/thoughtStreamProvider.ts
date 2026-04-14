import type { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import type { ThoughtStreamEntry } from "../types";

/**
 * thoughtStreamProvider
 *
 * The secret weapon. Collects and exposes the agent's internal reasoning
 * steps so the frontend can display them in real time.
 *
 * Actions emit thoughts via runtime.emit("thought_stream", {...}).
 * This provider aggregates recent thoughts and injects them as context,
 * so the agent is aware of its own reasoning chain.
 */

// In-memory circular buffer for recent thoughts
const MAX_THOUGHTS = 100;
const thoughtBuffer: ThoughtStreamEntry[] = [];

export function addThought(entry: ThoughtStreamEntry): void {
  thoughtBuffer.push(entry);
  if (thoughtBuffer.length > MAX_THOUGHTS) {
    thoughtBuffer.shift();
  }
}

export function getRecentThoughts(count: number = 20): ThoughtStreamEntry[] {
  return thoughtBuffer.slice(-count);
}

export function clearThoughts(): void {
  thoughtBuffer.length = 0;
}

export const thoughtStreamProvider: Provider = {
  name: "THOUGHT_STREAM",
  description: "Provides the agent's recent reasoning chain for self-awareness and transparent UI.",
  dynamic: true,
  private: true, // Don't expose in the public provider list

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state?: State
  ) => {
    const recent = getRecentThoughts(10);

    if (recent.length === 0) {
      return {
        text: "No recent reasoning chain.",
        data: { thoughts: [] },
      };
    }

    const summary = recent
      .map((t) => `[${t.type}] ${t.content}`)
      .join("\n");

    return {
      text: `Recent reasoning chain:\n${summary}`,
      data: { thoughts: recent, count: recent.length },
    };
  },
};

export default thoughtStreamProvider;
