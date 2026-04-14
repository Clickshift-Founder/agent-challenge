import { Service, type IAgentRuntime, logger } from "@elizaos/core";

/**
 * SolanaService
 *
 * Persistent service managing the Solana RPC connection.
 * Provides methods for on-chain queries used by actions and providers.
 */
export class SolanaService extends Service {
  static serviceType = "solana-rpc";
  capabilityDescription = "Provides Solana RPC connectivity for on-chain token queries, wallet lookups, and transaction parsing.";

  private rpcUrl: string = "";
  private connection: any = null; // Will be @solana/web3.js Connection

  constructor(protected runtime: IAgentRuntime) {
    super();
  }

  static async start(runtime: IAgentRuntime): Promise<SolanaService> {
    logger.info("[SolanaService] Initializing Solana RPC connection...");
    const service = new SolanaService(runtime);
    await service.initialize();
    return service;
  }

  async stop(): Promise<void> {
    logger.info("[SolanaService] Shutting down Solana RPC connection.");
    this.connection = null;
  }

  private async initialize(): Promise<void> {
    // Use runtime settings or env for RPC URL
    this.rpcUrl =
      this.runtime.getSetting("SOLANA_RPC_URL") ||
      (process as any).env.SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com";

    // TODO: Initialize @solana/web3.js Connection
    // import { Connection } from "@solana/web3.js";
    // this.connection = new Connection(this.rpcUrl, "confirmed");

    logger.info(`[SolanaService] Connected to RPC: ${this.rpcUrl}`);
  }

  /**
   * Get token account info (supply, decimals, authorities)
   */
  async getTokenInfo(mintAddress: string) {
    // TODO: Implement using @solana/web3.js
    // const mintPubkey = new PublicKey(mintAddress);
    // const mintInfo = await getMint(this.connection, mintPubkey);
    // return {
    //   supply: mintInfo.supply,
    //   decimals: mintInfo.decimals,
    //   mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
    //   freezeAuthority: mintInfo.freezeAuthority?.toBase58() || null,
    // };
    return null;
  }

  /**
   * Get recent transactions for a wallet address
   */
  async getWalletTransactions(address: string, limit: number = 20) {
    // TODO: Implement using @solana/web3.js
    // const pubkey = new PublicKey(address);
    // const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit });
    // const transactions = await Promise.all(
    //   signatures.map(sig => this.connection.getParsedTransaction(sig.signature))
    // );
    // return transactions;
    return [];
  }

  /**
   * Get SOL balance for a wallet
   */
  async getSolBalance(address: string): Promise<number> {
    // TODO: Implement
    // const pubkey = new PublicKey(address);
    // const balance = await this.connection.getBalance(pubkey);
    // return balance / 1e9; // lamports to SOL
    return 0;
  }

  /**
   * Get token accounts (holdings) for a wallet
   */
  async getTokenAccounts(address: string) {
    // TODO: Implement using @solana/web3.js
    // const pubkey = new PublicKey(address);
    // const accounts = await this.connection.getParsedTokenAccountsByOwner(pubkey, {
    //   programId: TOKEN_PROGRAM_ID,
    // });
    // return accounts.value.map(a => ({
    //   mint: a.account.data.parsed.info.mint,
    //   balance: a.account.data.parsed.info.tokenAmount.uiAmount,
    //   decimals: a.account.data.parsed.info.tokenAmount.decimals,
    // }));
    return [];
  }
}

export default SolanaService;

