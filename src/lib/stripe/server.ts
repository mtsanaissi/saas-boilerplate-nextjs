import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  const apiHost = process.env.STRIPE_API_HOST;
  const apiPort = process.env.STRIPE_API_PORT;
  const apiProtocol = process.env.STRIPE_API_PROTOCOL;

  const stripeConfig: Stripe.StripeConfig = {};

  if (apiHost) {
    stripeConfig.host = apiHost;
  }

  if (apiPort) {
    const parsedPort = Number(apiPort);
    if (!Number.isFinite(parsedPort)) {
      throw new Error("STRIPE_API_PORT must be a valid number");
    }
    stripeConfig.port = parsedPort;
  }

  if (apiProtocol) {
    if (apiProtocol !== "http" && apiProtocol !== "https") {
      throw new Error("STRIPE_API_PROTOCOL must be http or https");
    }
    stripeConfig.protocol = apiProtocol;
  }

  stripeClient = new Stripe(secretKey, stripeConfig);

  return stripeClient;
}
