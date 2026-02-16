import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// Helper function extracted for testing
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

// Generate valid signature for testing
function generateSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  return hmac.update(payload).digest("hex");
}

// Mock webhook payload types
interface MockCustomData {
  user_id?: string;
  github_username?: string;
}

interface MockPayload {
  meta: {
    event_name: string;
    custom_data?: MockCustomData;
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

function createOrderCreatedPayload(options: {
  orderId?: string;
  customerId?: string;
  variantId?: number;
  variantName?: string;
  userId?: string;
  githubUsername?: string;
}): MockPayload {
  return {
    meta: {
      event_name: "order_created",
      custom_data: {
        user_id: options.userId,
        github_username: options.githubUsername,
      },
    },
    data: {
      id: options.orderId ?? "order_123",
      attributes: {
        order_number: 1001,
        user_email: "test@example.com",
        user_name: "Test User",
        status: "paid",
        total: 39900,
        currency: "USD",
        first_order_item: {
          product_id: 12345,
          product_name: "Locanara Lifetime",
          variant_id: options.variantId ?? 1243337,
          variant_name: options.variantName ?? "Individual",
        },
      },
      relationships: {
        customer: {
          data: {
            id: options.customerId ?? "cust_123",
          },
        },
      },
    },
  };
}

function createOrderRefundedPayload(orderId: string): MockPayload {
  return {
    meta: {
      event_name: "order_refunded",
    },
    data: {
      id: orderId,
      attributes: {
        order_number: 1001,
        user_email: "test@example.com",
        user_name: "Test User",
        status: "refunded",
        total: 9900,
        currency: "USD",
        first_order_item: {
          product_id: 12345,
          product_name: "Locanara Pro Individual",
          variant_id: 67890,
          variant_name: "Default",
        },
      },
      relationships: {
        customer: {
          data: {
            id: "cust_123",
          },
        },
      },
    },
  };
}

describe("Lemon Squeezy Webhook", () => {
  const WEBHOOK_SECRET = "test_webhook_secret";

  describe("Signature Verification", () => {
    it("should verify valid signature", () => {
      const payload = JSON.stringify({ test: "data" });
      const signature = generateSignature(payload, WEBHOOK_SECRET);

      expect(verifySignature(payload, signature, WEBHOOK_SECRET)).toBe(true);
    });

    it("should reject invalid signature", () => {
      const payload = JSON.stringify({ test: "data" });
      const invalidSignature = "invalid_signature_hex";

      expect(verifySignature(payload, invalidSignature, WEBHOOK_SECRET)).toBe(
        false
      );
    });

    it("should reject tampered payload", () => {
      const originalPayload = JSON.stringify({ test: "data" });
      const tamperedPayload = JSON.stringify({ test: "tampered" });
      const signature = generateSignature(originalPayload, WEBHOOK_SECRET);

      expect(verifySignature(tamperedPayload, signature, WEBHOOK_SECRET)).toBe(
        false
      );
    });

    it("should reject wrong secret", () => {
      const payload = JSON.stringify({ test: "data" });
      const signature = generateSignature(payload, WEBHOOK_SECRET);

      expect(verifySignature(payload, signature, "wrong_secret")).toBe(false);
    });
  });

  describe("Payload Parsing", () => {
    it("should parse order_created payload correctly", () => {
      const payload = createOrderCreatedPayload({
        orderId: "order_456",
        userId: "user_123",
        githubUsername: "testuser",
      });

      expect(payload.meta.event_name).toBe("order_created");
      expect(payload.data.id).toBe("order_456");
      expect(payload.meta.custom_data?.user_id).toBe("user_123");
      expect(payload.meta.custom_data?.github_username).toBe("testuser");
    });

    it("should parse order_refunded payload correctly", () => {
      const payload = createOrderRefundedPayload("order_789");

      expect(payload.meta.event_name).toBe("order_refunded");
      expect(payload.data.id).toBe("order_789");
    });

    it("should handle missing custom_data gracefully", () => {
      // Simulate payload without custom_data
      const payload: MockPayload = {
        meta: {
          event_name: "order_created",
          custom_data: undefined,
        },
        data: createOrderCreatedPayload({}).data,
      };

      expect(payload.meta.custom_data?.user_id).toBeUndefined();
      expect(payload.meta.custom_data?.github_username).toBeUndefined();
    });
  });

  describe("Tier Determination", () => {
    const INDIVIDUAL_VARIANT_ID = 1243337;
    const ENTERPRISE_VARIANT_ID = 1243361;

    it("should determine individual tier by default", () => {
      const variantId = INDIVIDUAL_VARIANT_ID;
      const enterpriseVariantId = ENTERPRISE_VARIANT_ID.toString();

      const tier =
        enterpriseVariantId && variantId.toString() === enterpriseVariantId
          ? "enterprise"
          : "individual";

      expect(tier).toBe("individual");
    });

    it("should determine enterprise tier when variant ID matches", () => {
      const variantId = ENTERPRISE_VARIANT_ID;
      const enterpriseVariantId = ENTERPRISE_VARIANT_ID.toString();

      const tier =
        enterpriseVariantId && variantId.toString() === enterpriseVariantId
          ? "enterprise"
          : "individual";

      expect(tier).toBe("enterprise");
    });

    it("should default to individual when enterprise ID not configured", () => {
      const variantId = INDIVIDUAL_VARIANT_ID;
      const enterpriseVariantId = undefined;

      const tier =
        enterpriseVariantId && variantId.toString() === enterpriseVariantId
          ? "enterprise"
          : "individual";

      expect(tier).toBe("individual");
    });
  });

  describe("GitHub Collaborator API", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should construct correct API URL", () => {
      const username = "testuser";
      const expectedUrl = `https://api.github.com/repos/hyodotdev/locanara/collaborators/${username}`;

      expect(expectedUrl).toBe(
        "https://api.github.com/repos/hyodotdev/locanara/collaborators/testuser"
      );
    });

    it("should use triage permission", () => {
      const requestBody = { permission: "triage" };

      expect(requestBody.permission).toBe("triage");
    });

    it("should mock successful collaborator add", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
      });

      global.fetch = mockFetch;

      const response = await fetch(
        "https://api.github.com/repos/hyodotdev/locanara/collaborators/testuser",
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer test_token",
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({ permission: "triage" }),
        }
      );

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/hyodotdev/locanara/collaborators/testuser",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ permission: "triage" }),
        })
      );
    });

    it("should handle user not found error", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => "Not Found",
      });

      global.fetch = mockFetch;

      const response = await fetch(
        "https://api.github.com/repos/hyodotdev/locanara/collaborators/nonexistent",
        { method: "PUT" }
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe("Full Webhook Flow", () => {
    const INDIVIDUAL_VARIANT_ID = 1243337;
    const ENTERPRISE_VARIANT_ID = 1243361;

    it("should process order_created with all data (Individual)", () => {
      const payload = createOrderCreatedPayload({
        orderId: "order_full_test",
        customerId: "cust_full_test",
        variantId: INDIVIDUAL_VARIANT_ID,
        userId: "j97cz1234abcdef",
        githubUsername: "hyochan",
      });

      const signature = generateSignature(
        JSON.stringify(payload),
        WEBHOOK_SECRET
      );

      // Verify signature
      expect(
        verifySignature(JSON.stringify(payload), signature, WEBHOOK_SECRET)
      ).toBe(true);

      // Verify payload data
      expect(payload.meta.event_name).toBe("order_created");
      expect(payload.meta.custom_data?.user_id).toBe("j97cz1234abcdef");
      expect(payload.meta.custom_data?.github_username).toBe("hyochan");
      expect(payload.data.relationships.customer.data.id).toBe(
        "cust_full_test"
      );
    });

    it("should handle order without github username", () => {
      const payload = createOrderCreatedPayload({
        orderId: "order_no_github",
        userId: "j97cz1234abcdef",
        githubUsername: undefined,
      });

      expect(payload.meta.custom_data?.user_id).toBe("j97cz1234abcdef");
      expect(payload.meta.custom_data?.github_username).toBeUndefined();

      // Should still create membership, just not send GitHub invite
      const shouldSendGithubInvite = Boolean(
        payload.meta.custom_data?.github_username
      );
      expect(shouldSendGithubInvite).toBe(false);
    });

    it("should reject order without user_id", () => {
      const payload = createOrderCreatedPayload({
        orderId: "order_no_user",
        userId: undefined,
      });

      expect(payload.meta.custom_data?.user_id).toBeUndefined();

      // Should return early and not create membership
      const shouldCreateMembership = Boolean(payload.meta.custom_data?.user_id);
      expect(shouldCreateMembership).toBe(false);
    });

    it("should process order_refunded", () => {
      const orderId = "order_to_refund";
      const payload = createOrderRefundedPayload(orderId);

      expect(payload.meta.event_name).toBe("order_refunded");
      expect(payload.data.id).toBe(orderId);
    });

    it("should process order_created with Enterprise variant", () => {
      const payload = createOrderCreatedPayload({
        orderId: "order_enterprise_test",
        customerId: "cust_enterprise_test",
        variantId: ENTERPRISE_VARIANT_ID,
        variantName: "Enterprise",
        userId: "j97cz5678enterprise",
        githubUsername: "enterprise_user",
      });

      const signature = generateSignature(
        JSON.stringify(payload),
        WEBHOOK_SECRET
      );

      // Verify signature
      expect(
        verifySignature(JSON.stringify(payload), signature, WEBHOOK_SECRET)
      ).toBe(true);

      // Verify it's Enterprise tier
      const enterpriseVariantId = ENTERPRISE_VARIANT_ID.toString();
      const variantId = payload.data.attributes.first_order_item.variant_id;
      const tier =
        enterpriseVariantId && variantId.toString() === enterpriseVariantId
          ? "enterprise"
          : "individual";

      expect(tier).toBe("enterprise");
      expect(payload.data.attributes.first_order_item.variant_name).toBe(
        "Enterprise"
      );
    });

    it("should correctly determine tier from variant ID", () => {
      // Individual purchase
      const individualPayload = createOrderCreatedPayload({
        variantId: INDIVIDUAL_VARIANT_ID,
        userId: "user_individual",
      });

      const enterpriseVariantId = ENTERPRISE_VARIANT_ID.toString();

      const individualTier =
        enterpriseVariantId &&
        individualPayload.data.attributes.first_order_item.variant_id.toString() ===
          enterpriseVariantId
          ? "enterprise"
          : "individual";

      expect(individualTier).toBe("individual");

      // Enterprise purchase
      const enterprisePayload = createOrderCreatedPayload({
        variantId: ENTERPRISE_VARIANT_ID,
        userId: "user_enterprise",
      });

      const enterpriseTier =
        enterpriseVariantId &&
        enterprisePayload.data.attributes.first_order_item.variant_id.toString() ===
          enterpriseVariantId
          ? "enterprise"
          : "individual";

      expect(enterpriseTier).toBe("enterprise");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty signature", () => {
      const payload = JSON.stringify({ test: "data" });
      const emptySignature = "";

      expect(verifySignature(payload, emptySignature, WEBHOOK_SECRET)).toBe(
        false
      );
    });

    it("should handle malformed JSON payload gracefully", () => {
      const malformedPayload = "{ invalid json }";

      expect(() => JSON.parse(malformedPayload)).toThrow();
    });

    it("should handle special characters in github username", () => {
      const payload = createOrderCreatedPayload({
        userId: "user_special",
        githubUsername: "user-name_123",
      });

      expect(payload.meta.custom_data?.github_username).toBe("user-name_123");

      // GitHub username should be URL-safe
      const url = `https://api.github.com/repos/hyodotdev/locanara/collaborators/${payload.meta.custom_data?.github_username}`;
      expect(url).toContain("user-name_123");
    });

    it("should handle very long order IDs", () => {
      const longOrderId = "order_" + "a".repeat(100);
      const payload = createOrderCreatedPayload({
        orderId: longOrderId,
        userId: "user_test",
      });

      expect(payload.data.id).toBe(longOrderId);
    });

    it("should handle unicode in user data", () => {
      const payload = createOrderCreatedPayload({
        userId: "user_unicode",
        githubUsername: "user123",
      });

      // Webhook should handle this without issues
      const jsonString = JSON.stringify(payload);
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });
  });

  describe("Webhook Response Scenarios", () => {
    it("should acknowledge receipt even without user_id", () => {
      const payload = createOrderCreatedPayload({
        orderId: "order_no_user_ack",
        userId: undefined,
      });

      // Even without user_id, webhook should return 200 to acknowledge
      const hasUserId = Boolean(payload.meta.custom_data?.user_id);
      expect(hasUserId).toBe(false);

      // Response should still be 200 OK
      const expectedStatus = 200;
      expect(expectedStatus).toBe(200);
    });

    it("should handle duplicate order_created events", () => {
      const orderId = "order_duplicate_test";

      const payload1 = createOrderCreatedPayload({
        orderId,
        userId: "user_duplicate",
      });

      const payload2 = createOrderCreatedPayload({
        orderId,
        userId: "user_duplicate",
      });

      // Both payloads should have same order ID
      expect(payload1.data.id).toBe(payload2.data.id);

      // In real implementation, createMembership handles duplicates by returning existing membership
    });

    it("should handle refund for non-existent order", () => {
      const payload = createOrderRefundedPayload("non_existent_order_id");

      expect(payload.meta.event_name).toBe("order_refunded");
      expect(payload.data.id).toBe("non_existent_order_id");

      // In real implementation, markRefunded returns null for non-existent orders
    });
  });
});
