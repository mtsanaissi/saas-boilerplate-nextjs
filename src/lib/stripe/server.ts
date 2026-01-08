import Stripe from "stripe";
import { getServerEnv } from "@/lib/env/server";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const env = getServerEnv();
  const secretKey = env.stripeSecretKey;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  const stripeConfig: Stripe.StripeConfig = {};

  if (env.stripeApiHost) {
    stripeConfig.host = env.stripeApiHost;
  }

  if (env.stripeApiPort) {
    stripeConfig.port = env.stripeApiPort;
  }

  if (env.stripeApiProtocol) {
    if (env.stripeApiProtocol !== "http" && env.stripeApiProtocol !== "https") {
      throw new Error("STRIPE_API_PROTOCOL must be http or https");
    }
    stripeConfig.protocol = env.stripeApiProtocol;
  }

  stripeClient = new Stripe(secretKey, stripeConfig);

  return stripeClient;
}
