import bazaar from "./bazaar.json";
import meta from "./meta.json";

const PATH = "/api/agent/entrypoints/rank-inference-chips/invoke";

function paymentRequired(resourceUrl) {
  return {
    x402Version: 2,
    error: "PAYMENT-SIGNATURE header is required",
    resource: {
      url: resourceUrl,
      description: meta.description,
      mimeType: "application/json",
    },
    accepts: [
      {
        scheme: "exact",
        network: meta.network,
        amount: meta.amount,
        payTo: meta.payTo,
        asset: meta.asset,
        extra: { name: "USD Coin", version: "2" },
        maxTimeoutSeconds: 60,
      },
    ],
    extensions: bazaar,
  };
}

function encodeHeader(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "inference-chip-index", paid: PATH });
    }
    if (url.pathname !== PATH) {
      return new Response("Not found", { status: 404 });
    }
    const resourceUrl = `${url.origin}${PATH}`;
    const body = paymentRequired(resourceUrl);
    return Response.json(body, {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "PAYMENT-REQUIRED": encodeHeader(body),
        Allow: "GET, POST",
      },
    });
  },
};
