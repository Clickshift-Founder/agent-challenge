/**
 * Shared types for the ClickShift Alpha defi-intelligence plugin.
 * All actions, providers, evaluators, and services reference these types.
 */

// ── Risk Levels ──────────────────────────────────────────────

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export function getRiskLevel(score: number): RiskLevel {
  if (score < 20) return RiskLevel.LOW;
  if (score < 50) return RiskLevel.MEDIUM;
  if (score < 75) return RiskLevel.HIGH;
  return RiskLevel.CRITICAL;
}

// ── Rug Check ────────────────────────────────────────────────

export interface RugCheckResult {
  mint: string;
  tokenName: string;
  tokenSymbol: string;
  score: number; // 0-100, higher = more risky
  riskLevel: RiskLevel;
  risks: RugRiskFactor[];
  mintAuthority: AuthorityStatus;
  freezeAuthority: AuthorityStatus;
  lpStatus: LpStatus;
  topHolderConcentration: number; // percentage held by top 10
  totalLiquidity: number; // USD value
  tokenAge: number; // hours since creation
}

export interface RugRiskFactor {
  name: string;
  description: string;
  severity: RiskLevel;
  value: string;
}

export type AuthorityStatus = "revoked" | "active" | "unknown";

export interface LpStatus {
  burned: number; // percentage of LP tokens burned
  locked: number; // percentage locked
  unlocked: number; // percentage unlocked (risky)
}

// ── Token Analysis ───────────────────────────────────────────

export interface TokenAnalysis {
  mint: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number; // percentage
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holderCount: number;
  topHolders: HolderInfo[];
  rugScore: number;
  riskLevel: RiskLevel;
  priceImpact1k: number; // price impact for $1000 trade
  createdAt: string;
}

export interface HolderInfo {
  address: string;
  percentage: number;
  isKnownEntity: boolean; // exchange, protocol, etc.
  label?: string; // "Raydium Pool", "Binance Hot Wallet", etc.
}

// ── Portfolio ────────────────────────────────────────────────

export interface PortfolioPosition {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  valueUsd: number;
  priceChange24h: number;
  rugScore: number;
  riskLevel: RiskLevel;
  lastChecked: string;
}

export interface PortfolioSummary {
  totalValueUsd: number;
  positions: PortfolioPosition[];
  riskAlerts: RiskAlert[];
  lastUpdated: string;
}

export interface RiskAlert {
  mint: string;
  symbol: string;
  alertType: "rug_score_increase" | "liquidity_drop" | "whale_movement" | "authority_change";
  message: string;
  severity: RiskLevel;
  timestamp: string;
}

// ── Wallet Tracking ──────────────────────────────────────────

export interface TrackedWallet {
  address: string;
  label?: string; // user-assigned label
  addedAt: string;
}

export interface WalletActivity {
  signature: string;
  type: "buy" | "sell" | "transfer_in" | "transfer_out" | "swap" | "unknown";
  tokenSymbol: string;
  tokenMint: string;
  amount: number;
  valueUsd: number;
  counterparty?: string; // other wallet or DEX
  timestamp: string;
  source: string; // "Jupiter", "Raydium", "direct transfer", etc.
}

export interface WalletReport {
  address: string;
  label?: string;
  solBalance: number;
  recentActivity: WalletActivity[];
  patterns: string[]; // human-readable pattern descriptions
  topHoldings: { symbol: string; valueUsd: number }[];
}

// ── Thought Stream ───────────────────────────────────────────

export interface ThoughtStreamEntry {
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
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ── Market Data ──────────────────────────────────────────────

export interface MarketData {
  solPrice: number;
  trending: TrendingToken[];
  lastUpdated: string;
}

export interface TrendingToken {
  mint: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
}
