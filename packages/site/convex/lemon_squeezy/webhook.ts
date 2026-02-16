import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

// Lemon Squeezy webhook event types
interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
      github_username?: string;
    };
  };
  data: {
    id: string;
    attributes: {
      order_number: number;
      user_email: string;
      user_name: string;
      status: string;
      total: number;
      currency: string;
      first_order_item: {
        product_id: number;
        product_name: string;
        variant_id: number;
        variant_name: string;
      };
    };
    relationships: {
      customer: {
        data: {
          id: string;
        };
      };
    };
  };
}

// Verify webhook signature using Web Crypto API
async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  const digest = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Timing-safe comparison (case-insensitive)
  const lowerSignature = signature.toLowerCase();
  if (lowerSignature.length !== digest.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < lowerSignature.length; i++) {
    result |= lowerSignature.charCodeAt(i) ^ digest.charCodeAt(i);
  }
  return result === 0;
}

// Add user as repository collaborator with read-only access
async function addRepoCollaborator(
  githubUsername: string,
  githubToken: string
): Promise<boolean> {
  try {
    // Add as collaborator to hyodotdev/locanara repo with read-only (pull) permission
    const response = await fetch(
      `https://api.github.com/repos/hyodotdev/locanara/collaborators/${githubUsername}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          permission: "triage", // can use issues and discussions
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to add GitHub collaborator:", error);
      return false;
    }

    console.log("GitHub collaborator invite sent to:", githubUsername);
    return true;
  } catch (error) {
    console.error("GitHub collaborator error:", error);
    return false;
  }
}

// Lemon Squeezy webhook handler
export const webhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("X-Signature");
  if (!signature) {
    return new Response("Missing signature", { status: 401 });
  }

  const webhookSecret = process.env.LS_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("LS_WEBHOOK_SECRET not configured");
    return new Response("Server configuration error", { status: 500 });
  }

  const payload = await request.text();

  // Verify signature
  if (!(await verifySignature(payload, signature, webhookSecret))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const data: LemonSqueezyWebhookPayload = JSON.parse(payload);
  const eventName = data.meta.event_name;

  console.log("Lemon Squeezy webhook received:", eventName);

  switch (eventName) {
    case "order_created": {
      const orderId = data.data.id;
      const customerId = data.data.relationships.customer.data.id;
      const variantId = data.data.attributes.first_order_item.variant_id;

      // Determine tier based on variant ID
      const enterpriseVariantId = process.env.LS_LIFETIME_ENT_ID;
      const tier =
        enterpriseVariantId && variantId.toString() === enterpriseVariantId
          ? "enterprise"
          : "individual";

      // Get custom data (user_id and github_username passed from checkout)
      const userId = data.meta.custom_data?.user_id;
      const githubUsername = data.meta.custom_data?.github_username;

      if (!userId) {
        console.error("No user_id in custom_data for order:", orderId);
        // Still return 200 to acknowledge receipt
        return new Response("OK", { status: 200 });
      }

      // Create membership
      const membershipId = await ctx.runMutation(
        internal.pro.mutation.createMembership,
        {
          userId: userId as Id<"users">,
          tier,
          lemonSqueezyOrderId: orderId,
          lemonSqueezyCustomerId: customerId,
          githubUsername,
        }
      );

      // Decrement seat count
      await ctx.runMutation(internal.pro.mutation.decrementSeat, { tier });

      // Add user as collaborator to locanara/locanara repo
      if (githubUsername && membershipId) {
        const githubToken = process.env.GITHUB_REPO_ADMIN_TOKEN;
        if (githubToken) {
          const inviteSent = await addRepoCollaborator(githubUsername, githubToken);
          if (inviteSent) {
            await ctx.runMutation(internal.pro.mutation.markGithubInviteSent, {
              membershipId,
            });
          }
        } else {
          console.error("GITHUB_REPO_ADMIN_TOKEN not configured");
        }
      }

      console.log("Order created successfully:", { orderId, userId, tier });
      break;
    }

    case "order_refunded": {
      const orderId = data.data.id;
      const variantId = data.data.attributes.first_order_item.variant_id;

      // Determine tier for seat increment
      const enterpriseVariantId = process.env.LS_LIFETIME_ENT_ID;
      const refundTier =
        enterpriseVariantId && variantId.toString() === enterpriseVariantId
          ? "enterprise"
          : "individual";

      // Mark membership as refunded
      await ctx.runMutation(internal.pro.mutation.markRefunded, {
        lemonSqueezyOrderId: orderId,
      });

      // Increment seat count back
      await ctx.runMutation(internal.pro.mutation.incrementSeat, {
        tier: refundTier,
      });

      // TODO: Optionally remove from GitHub org
      console.log("Order refunded:", orderId);
      break;
    }

    default:
      console.log("Unhandled webhook event:", eventName);
  }

  return new Response("OK", { status: 200 });
});
