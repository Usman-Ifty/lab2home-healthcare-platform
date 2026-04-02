import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any, // Use latest stable
});

// For Pakistani sites, Stripe usually expects USD or other supported currencies.
// We'll use a fixed conversion rate from PKR to USD for the demo.
const PKR_TO_USD_RATE = 0.0036; // 1 PKR ≈ 0.0036 USD (approximate rate)

interface CheckoutItem {
  name: string;
  amount: number; // in PKR
  quantity: number;
  description?: string;
}

/**
 * Creates a Stripe Checkout Session for an order.
 * @param params Details of the order and customer
 * @returns The session URL for redirecting the customer
 */
export const createCheckoutSession = async (params: {
  orderId: string;
  items: CheckoutItem[];
  customerEmail: string;
  customerName: string;
  successUrl: string;
  cancelUrl: string;
}) => {
  try {
    const lineItems = params.items.map((item) => {
      // Stripe expects amount in cents/smallest unit
      // Convert PKR to USD first
      const priceInUSD = item.amount * PKR_TO_USD_RATE;
      const unitAmountInCents = Math.round(priceInUSD * 100);

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description || `Order #${params.orderId}`,
          },
          unit_amount: unitAmountInCents < 50 ? 50 : unitAmountInCents, // Stripe minimum is $0.50
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${params.orderId}`,
      cancel_url: `${params.cancelUrl}?order_id=${params.orderId}`,
      customer_email: params.customerEmail,
      client_reference_id: params.orderId,
      metadata: {
        orderId: params.orderId,
        customerName: params.customerName,
      },
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  } catch (error: any) {
    console.error('Stripe Checkout error:', error);
    throw new Error(`Failed to create Stripe session: ${error.message}`);
  }
};

/**
 * Verifies a Stripe session (for webhook or success redirect check).
 */
export const verifySession = async (sessionId: string) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error: any) {
    console.error('Stripe retrieve session error:', error);
    throw new Error(`Failed to retrieve Stripe session: ${error.message}`);
  }
};
