// Payment provider abstraction — mock today, Razorpay/UPI sandbox later.

export type PaymentIntent = {
  amount: number;
  applicationNumber: string;
  method: "upi" | "card" | "netbanking";
};

export type PaymentResult = {
  txnId: string;
  gatewayRef: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  receiptUrl?: string;
};

export type PaymentProvider = {
  createPayment(intent: PaymentIntent): Promise<PaymentResult>;
  verifyWebhook(payload: unknown, signature: string): boolean;
};

function randomTxnId() {
  return `TXN-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 900 + 100)}`;
}

export const mockPaymentProvider: PaymentProvider = {
  async createPayment(intent) {
    await new Promise((r) => setTimeout(r, 700));
    // 4% simulated failure to force retry UI in production
    if (Math.random() < 0.04) {
      return { txnId: randomTxnId(), gatewayRef: `GW-${Date.now()}`, status: "FAILED" };
    }
    return {
      txnId: randomTxnId(),
      gatewayRef: `GW-${Date.now()}-${intent.method}`,
      status: "SUCCESS",
      receiptUrl: `/receipt/${intent.applicationNumber}`,
    };
  },
  verifyWebhook() {
    return true;
  },
};
