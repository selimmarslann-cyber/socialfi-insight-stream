/**
 * Transaction Guard - Prevents duplicate transactions and rate limiting
 * 
 * Features:
 * - Prevents duplicate transactions (same postId + amount + user)
 * - Rate limiting (max 1 transaction per 3 seconds)
 * - Transaction hash tracking
 * - Automatic cleanup
 */

type PendingTransaction = {
  postId: number;
  amount: number;
  user: string;
  txHash: string;
  timestamp: number;
  type: "buy" | "sell";
};

class TransactionGuard {
  private pendingTransactions: Map<string, PendingTransaction> = new Map();
  private readonly RATE_LIMIT_MS = 3000; // 3 seconds between transactions
  private readonly CLEANUP_INTERVAL_MS = 60000; // Cleanup every minute
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup timer
    this.startCleanup();
  }

  /**
   * Generate a unique key for a transaction
   */
  private getTransactionKey(
    postId: number,
    amount: number,
    user: string,
    type: "buy" | "sell"
  ): string {
    return `${user}:${postId}:${amount}:${type}`;
  }

  /**
   * Check if a transaction is already pending
   */
  isTransactionPending(
    postId: number,
    amount: number,
    user: string,
    type: "buy" | "sell"
  ): boolean {
    const key = this.getTransactionKey(postId, amount, user, type);
    const pending = this.pendingTransactions.get(key);
    
    if (!pending) return false;

    // Check if transaction is still within rate limit window
    const now = Date.now();
    if (now - pending.timestamp < this.RATE_LIMIT_MS) {
      return true;
    }

    // Transaction is old, remove it
    this.pendingTransactions.delete(key);
    return false;
  }

  /**
   * Check rate limiting (prevent too many transactions in short time)
   */
  checkRateLimit(user: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const userTransactions = Array.from(this.pendingTransactions.values())
      .filter((tx) => tx.user.toLowerCase() === user.toLowerCase())
      .sort((a, b) => b.timestamp - a.timestamp);

    if (userTransactions.length === 0) {
      return { allowed: true };
    }

    // Check if last transaction was too recent
    const lastTx = userTransactions[0];
    const timeSinceLastTx = now - lastTx.timestamp;

    if (timeSinceLastTx < this.RATE_LIMIT_MS) {
      const waitTime = Math.ceil((this.RATE_LIMIT_MS - timeSinceLastTx) / 1000);
      return {
        allowed: false,
        reason: `Please wait ${waitTime} second${waitTime > 1 ? "s" : ""} before another transaction`,
      };
    }

    return { allowed: true };
  }

  /**
   * Register a new pending transaction
   */
  registerTransaction(
    postId: number,
    amount: number,
    user: string,
    txHash: string,
    type: "buy" | "sell"
  ): void {
    const key = this.getTransactionKey(postId, amount, user, type);
    
    this.pendingTransactions.set(key, {
      postId,
      amount,
      user,
      txHash,
      timestamp: Date.now(),
      type,
    });

    console.log(`[TransactionGuard] Registered ${type} transaction:`, {
      key,
      txHash,
      postId,
      amount,
    });
  }

  /**
   * Mark a transaction as completed (remove from pending)
   */
  completeTransaction(
    postId: number,
    amount: number,
    user: string,
    type: "buy" | "sell"
  ): void {
    const key = this.getTransactionKey(postId, amount, user, type);
    const removed = this.pendingTransactions.delete(key);
    
    if (removed) {
      console.log(`[TransactionGuard] Completed ${type} transaction:`, key);
    }
  }

  /**
   * Get pending transaction hash
   */
  getPendingTransactionHash(
    postId: number,
    amount: number,
    user: string,
    type: "buy" | "sell"
  ): string | null {
    const key = this.getTransactionKey(postId, amount, user, type);
    const pending = this.pendingTransactions.get(key);
    return pending?.txHash || null;
  }

  /**
   * Cleanup old transactions (older than 5 minutes)
   */
  private cleanup(): void {
    const now = Date.now();
    const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

    let cleaned = 0;
    for (const [key, tx] of this.pendingTransactions.entries()) {
      if (now - tx.timestamp > MAX_AGE_MS) {
        this.pendingTransactions.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[TransactionGuard] Cleaned up ${cleaned} old transactions`);
    }
  }

  /**
   * Start automatic cleanup
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Stop cleanup timer (for testing or cleanup)
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.pendingTransactions.clear();
  }
}

// Singleton instance
export const transactionGuard = new TransactionGuard();

