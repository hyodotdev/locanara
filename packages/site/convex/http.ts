import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { webhook as lemonSqueezyWebhook } from "./lemon_squeezy/webhook";

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

// Lemon Squeezy webhook
http.route({
  path: "/lemon-squeezy/webhook",
  method: "POST",
  handler: lemonSqueezyWebhook,
});

export default http;
