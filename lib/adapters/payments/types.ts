export type DepositStatus = 'none' | 'pending' | 'held' | 'refunded' | 'forfeited';

export interface HoldResult {
  success: boolean;
  ref: string;
  amountInr: number;
  status: DepositStatus;
}

export interface RefundResult {
  success: boolean;
  ref: string;
  status: DepositStatus;
}

export interface PaymentAdapter {
  createHold(userId: string, podId: string, amountInr: number): Promise<HoldResult>;
  refund(paymentRef: string): Promise<RefundResult>;
  forfeit(paymentRef: string): Promise<RefundResult>;
}
