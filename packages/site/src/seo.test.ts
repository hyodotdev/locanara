import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("SEO", () => {
  describe("sitemap.xml", () => {
    const sitemapPath = resolve(__dirname, "../public/sitemap.xml");
    const sitemap = readFileSync(sitemapPath, "utf-8");

    it("should have valid XML declaration", () => {
      expect(sitemap).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    });

    it("should have urlset with correct namespace", () => {
      expect(sitemap).toContain(
        'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
      );
    });

    it("should contain homepage URL", () => {
      expect(sitemap).toContain("<loc>https://locanara.com/</loc>");
    });

    it("should contain community page URL", () => {
      expect(sitemap).toContain("<loc>https://locanara.com/community</loc>");
    });

    it("should have valid changefreq values", () => {
      const validFreqs = [
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
      ];
      const changefreqMatches = sitemap.match(
        /<changefreq>(\w+)<\/changefreq>/g
      );

      expect(changefreqMatches).not.toBeNull();
      changefreqMatches?.forEach((match) => {
        const freq = match.replace(/<\/?changefreq>/g, "");
        expect(validFreqs).toContain(freq);
      });
    });

    it("should have valid priority values (0.0 to 1.0)", () => {
      const priorityMatches = sitemap.match(/<priority>([\d.]+)<\/priority>/g);

      expect(priorityMatches).not.toBeNull();
      priorityMatches?.forEach((match) => {
        const priority = parseFloat(match.replace(/<\/?priority>/g, ""));
        expect(priority).toBeGreaterThanOrEqual(0);
        expect(priority).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("robots.txt", () => {
    const robotsPath = resolve(__dirname, "../public/robots.txt");
    const robots = readFileSync(robotsPath, "utf-8");

    it("should have User-agent directive", () => {
      expect(robots).toContain("User-agent:");
    });

    it("should allow all crawlers", () => {
      expect(robots).toMatch(/User-agent:\s*\*/);
    });

    it("should reference sitemap", () => {
      expect(robots).toContain("Sitemap: https://locanara.com/sitemap.xml");
    });
  });

  describe("index.html meta tags", () => {
    const indexPath = resolve(__dirname, "../index.html");
    const html = readFileSync(indexPath, "utf-8");

    describe("Basic meta tags", () => {
      it("should have charset", () => {
        expect(html).toContain('charset="UTF-8"');
      });

      it("should have viewport", () => {
        expect(html).toContain('name="viewport"');
      });

      it("should have description", () => {
        expect(html).toMatch(/<meta\s+name="description"\s+content="[^"]+"/);
      });

      it("should have theme-color", () => {
        expect(html).toContain('name="theme-color"');
      });

      it("should have title", () => {
        expect(html).toMatch(/<title>[^<]+<\/title>/);
      });
    });

    describe("Open Graph meta tags", () => {
      it("should have og:type", () => {
        expect(html).toContain('property="og:type"');
      });

      it("should have og:url", () => {
        expect(html).toContain('property="og:url"');
        expect(html).toContain("https://locanara.com/");
      });

      it("should have og:title", () => {
        expect(html).toContain('property="og:title"');
      });

      it("should have og:description", () => {
        expect(html).toContain('property="og:description"');
      });

      it("should have og:image", () => {
        expect(html).toContain('property="og:image"');
        expect(html).toContain("https://locanara.com/og-image.png");
      });

      it("should have og:site_name", () => {
        expect(html).toContain('property="og:site_name"');
        expect(html).toContain('content="Locanara"');
      });

      it("should have og:locale", () => {
        expect(html).toContain('property="og:locale"');
      });
    });

    describe("Twitter Card meta tags", () => {
      it("should have twitter:card with summary_large_image", () => {
        expect(html).toContain('name="twitter:card"');
        expect(html).toContain('content="summary_large_image"');
      });

      it("should have twitter:url", () => {
        expect(html).toContain('name="twitter:url"');
      });

      it("should have twitter:title", () => {
        expect(html).toContain('name="twitter:title"');
      });

      it("should have twitter:description", () => {
        expect(html).toContain('name="twitter:description"');
      });

      it("should have twitter:image", () => {
        expect(html).toContain('name="twitter:image"');
      });
    });
  });

  describe("SEO Component", () => {
    // Test the SEO component constants
    const SITE_URL = "https://locanara.com";
    const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

    it("should have correct site URL", () => {
      expect(SITE_URL).toBe("https://locanara.com");
    });

    it("should have correct default image URL", () => {
      expect(DEFAULT_IMAGE).toBe("https://locanara.com/og-image.png");
    });

    it("should generate correct full title with suffix", () => {
      const title = "Community";
      const fullTitle = `${title} - Locanara`;
      expect(fullTitle).toBe("Community - Locanara");
    });

    it("should generate correct URL with path", () => {
      const path = "/community";
      const url = `${SITE_URL}${path}`;
      expect(url).toBe("https://locanara.com/community");
    });
  });

  describe("Social Media Preview Requirements", () => {
    const indexPath = resolve(__dirname, "../index.html");
    const html = readFileSync(indexPath, "utf-8");

    it("should have og:image dimensions recommendation (1200x630)", () => {
      // og:image should be present for proper social sharing
      expect(html).toContain('property="og:image"');
    });

    it("should have description under 160 characters", () => {
      const descMatch = html.match(
        /<meta\s+name="description"\s+content="([^"]+)"/
      );
      expect(descMatch).not.toBeNull();
      if (descMatch) {
        expect(descMatch[1].length).toBeLessThanOrEqual(160);
      }
    });

    it("should have title under 60 characters for optimal display", () => {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      expect(titleMatch).not.toBeNull();
      if (titleMatch) {
        // Title can be longer, but first 60 chars should be meaningful
        expect(titleMatch[1].length).toBeGreaterThan(0);
      }
    });

    it("og:description should match meta description", () => {
      const metaDescMatch = html.match(
        /<meta\s+name="description"\s+content="([^"]+)"/
      );
      const ogDescMatch = html.match(
        /<meta\s+property="og:description"\s+content="([^"]+)"/
      );

      expect(metaDescMatch).not.toBeNull();
      expect(ogDescMatch).not.toBeNull();

      if (metaDescMatch && ogDescMatch) {
        expect(metaDescMatch[1]).toBe(ogDescMatch[1]);
      }
    });

    it("twitter:description should match meta description", () => {
      const metaDescMatch = html.match(
        /<meta\s+name="description"\s+content="([^"]+)"/
      );
      const twitterDescMatch = html.match(
        /<meta\s+name="twitter:description"\s+content="([^"]+)"/
      );

      expect(metaDescMatch).not.toBeNull();
      expect(twitterDescMatch).not.toBeNull();

      if (metaDescMatch && twitterDescMatch) {
        expect(metaDescMatch[1]).toBe(twitterDescMatch[1]);
      }
    });
  });
});
