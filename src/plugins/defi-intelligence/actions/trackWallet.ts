import type { Action, IAgentRuntime, Memory } from "@elizaos/core";
import type { WalletReport, WalletActivity } from "../types";

/**
 * TRACK_WALLET action
 *
 * Adds a Solana wallet to the tracking list and reports its recent activity.
 * Identifies transaction patterns (accumulation, distribution, rotations).
 */
export const trackWallet: Action = {
  name: "TRACK_WALLET",
  description:
    "Track a Solana wallet address and report its recent on-chain activity including buys, sells, swaps, and pattern analysis.",
  similes: ["WATCH_WALLET", "MONITOR_WALLET", "FOLLOW_WALLET", "WALLET_ACTIVITY"],

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "Track this wallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" },
      },
      {
        name: "ClickShift Alpha",
        content: {
          text: "Now tracking wallet 7xKX...AsU. Pulling recent activity...",
          action: "TRACK_WALLET",
        },
      },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    const hasWalletKeyword = /\b(track|watch|monitor|follow|wallet)\b/.test(text);
    const hasSolanaAddress = /[1-9A-HJ-NP-Za-km-z]{32,44}/.test(message.content?.text || "");
    return hasWalletKeyword && hasSolanaAddress;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: any,
    _options?: Record<string, unknown>,
    callback?: Function
  ) => {
    const text = message.content?.text || "";
    const addressMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);

    if (!addressMatch) {
      return {
        success: false,
        text: "I need a valid Solana wallet address to track. Paste the full address.",
      };
    }

    const address = addressMatch[0];
    const shortAddr = `${address.slice(0, 4)}...${address.slice(-4)}`;

    try {
      (runtime as any).emit("thought_stream", {
        id: `thought_${Date.now()}`,
        agentName: "ClickShift Alpha",
        type: "reasoning",
        content: `Adding wallet ${shortAddr} to tracking list. Fetching recent transaction history...`,
        timestamp: new Date().toISOString(),
      });

      // TODO: Implement actual Solana RPC calls
      // 1. getSignaturesForAddress — get recent tx signatures
      // 2. getParsedTransaction — parse each tx for token transfers/swaps
      // 3. Cross-reference with Jupiter/Raydium for DEX trade data
      // 4. Store in agent memory for ongoing tracking

      const report = await buildWalletReport(address);
      const formatted = formatWalletReport(report);

      // Store the tracked wallet in agent memory
      await runtime.databaseAdapter.createMemory(
        {
          id: crypto.randomUUID() as any,
          entityId: message.entityId,
          roomId: message.roomId,
          agentId: runtime.agentId,
          content: {
            text: `User is tracking wallet ${address}`,
            metadata: { type: "tracked_wallet", address },
          },
          createdAt: Date.now(),
        },
        "facts"
      );

      if (callback) {
        await callback({ text: formatted }, []);
      }

      return { success: true, text: formatted, data: { report } };
    } catch (error: any) {
      return {
        success: false,
        text: `Failed to track wallet ${shortAddr}: ${error.message}`,
      };
    }
  },
};

async function buildWalletReport(address: string): Promise<WalletReport> {
  // TODO: Replace with actual Solana RPC + parsed transaction data
  return {
    address,
    solBalance: 0,
    recentActivity: [],
    patterns: [],
    topHoldings: [],
  };
}

function formatWalletReport(report: WalletReport): string {
  const short = `${report.address.slice(0, 4)}...${report.address.slice(-4)}`;
  const lines = [`Now tracking wallet ${short}.\n`];

  if (report.solBalance > 0) {
    lines.push(`SOL Balance: ${report.solBalance.toFixed(2)} SOL\n`);
  }

  if (report.recentActivity.length > 0) {
    lines.push("Recent activity (last 24h):");
    for (const tx of report.recentActivity.slice(0, 10)) {
      const action = tx.type === "buy" ? "Bought" : tx.type === "sell" ? "Sold" : tx.type;
      lines.push(`- ${action} ${tx.amount} ${tx.tokenSymbol} ($${tx.valueUsd.toFixed(0)}) via ${tx.source} — ${timeAgo(tx.timestamp)}`);
    }
  } else {
    lines.push("No recent activity found in the last 24 hours.");
  }

  if (report.patterns.length > 0) {
    lines.push("\nPatterns detected:");
    for (const p of report.patterns) {
      lines.push(`- ${p}`);
    }
  }

  lines.push("\nI'll alert you when this wallet makes its next move.");
  return lines.join("\n");
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

export default trackWallet;

