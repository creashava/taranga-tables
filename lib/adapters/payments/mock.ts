import { PaymentAdapter, HoldResult, RefundResult } from './types';

export class MockPaymentProvider implements PaymentAdapter {
  private holds: Map<string, { userId: string; podId: string; amountInr: number; status: 'held' | 'refunded' | 'forfeited' }> = new Map();

  async createHold(userId: string, podId: string, amountInr: number): Promise<HoldResult> {
    const ref = `mock_hold_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.holds.set(ref, { userId, podId, amountInr, status: 'held' });
    console.log(`[MOCK PAYMENT] Created hold of ₹${amountInr} for user ${userId} in pod ${podId}. Ref: ${ref}`);
    return {
      success: true,
      ref,
      amountInr,
      status: 'held',
    };
  }

  async refund(paymentRef: string): Promise<RefundResult> {
    const record = this.holds.get(paymentRef);
    if (!record) {
      console.warn(`[MOCK PAYMENT] Refund failed: reference ${paymentRef} not found.`);
      return { success: false, ref: paymentRef, status: 'none' };
    }
    record.status = 'refunded';
    console.log(`[MOCK PAYMENT] Refunded ₹${record.amountInr} for ref ${paymentRef} back to user ${record.userId}.`);
    return {
      success: true,
      ref: paymentRef,
      status: 'refunded',
    };
  }

  async forfeit(paymentRef: string): Promise<RefundResult> {
    const record = this.holds.get(paymentRef);
    if (!record) {
      return { success: false, ref: paymentRef, status: 'none' };
    }
    record.status = 'forfeited';
    console.log(`[MOCK PAYMENT] Forfeited deposit ₹${record.amountInr} for ref ${paymentRef} (no-show policy applied).`);
    return {
      success: true,
      ref: paymentRef,
      status: 'forfeited',
    };
  }
}
