export interface PaymentProvider {
  createTransaction(orderId: string, amountClp: number): Promise<{ token: string; url: string }>;
  verifyWebhook(payload: string, signature?: string): Promise<boolean>;
}

export class WebpayProvider implements PaymentProvider {

  async createTransaction(orderId: string, amountClp: number) {
    return { token: `stub-${orderId}-${amountClp}`, url: "https://webpay3g.transbank.cl" };
  }

  async verifyWebhook(payload: string, signature?: string): Promise<boolean> {
    // TODO: implementar validación real con Transbank
    // Por ahora dejamos stub para que no rompa el build
    return Boolean(payload);
  }
}


export interface ShippingProvider {
  quote(region: string): Promise<number>;
  createShipment(orderId: string, address: string): Promise<{ tracking: string }>;
}

export class FlatRateShippingProvider implements ShippingProvider {
  async quote(region: string) {
    return ["RM", "XVI"].includes(region) ? 2990 : 4990;
  }
  async createShipment(orderId: string) {
    return { tracking: `CL-${orderId.slice(0, 8)}` };
  }
}
