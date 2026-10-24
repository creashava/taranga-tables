import { PaymentAdapter } from './types';
import { MockPaymentProvider } from './mock';

export * from './types';
export * from './mock';

let paymentAdapterInstance: PaymentAdapter | null = null;

export function getPaymentAdapter(): PaymentAdapter {
  if (!paymentAdapterInstance) {
    const provider = process.env.PAYMENT_PROVIDER || 'mock';
    if (provider === 'mock') {
      paymentAdapterInstance = new MockPaymentProvider();
    } else {
      console.warn(`[PAYMENT] Provider "${provider}" not implemented; defaulting to MockPaymentProvider.`);
      paymentAdapterInstance = new MockPaymentProvider();
    }
  }
  return paymentAdapterInstance;
}
