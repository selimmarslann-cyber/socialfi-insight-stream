export type WalletTxStatus = 'pending' | 'completed' | 'failed';

export type WalletTxType = 'deposit' | 'withdraw' | 'buy' | 'sell' | 'send' | 'reward';

export interface WalletTx {
  id: string;
  hash: string;
  type: WalletTxType;
  asset: 'USDT' | 'NOP';
  amount: number;
  direction: 'in' | 'out';
  timestamp: string;
  status: WalletTxStatus;
  counterparty?: string;
  note?: string;
}
