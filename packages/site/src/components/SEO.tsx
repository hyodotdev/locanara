import { Helmet } from "react-helmet-async";

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string;
  faq?: FAQItem[];
}

const DEFAULT_TITLE =
  "Locanara - Free Open-Source On-Device AI SDK for iOS and Android";
const DEFAULT_DESCRIPTION =
  "Privacy-first, unified on-device AI SDK for mobile developers. Build AI-powered apps without compromising user privacy.";
const SITE_URL = "https://locanara.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Locanara",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.webp`,
  description: DEFAULT_DESCRIPTION,
  sameAs: ["https://github.com/hyodotdev/locanara"],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Locanara SDK",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "iOS, Android",
  description:
    "Free and open-source on-device AI SDK for mobile developers. Supports summarization, classification, extraction, chat, translation, rewriting, proofreading, image description, private RAG, and personalization.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free and open-source under AGPL-3.0",
  },
  featureList: [
    "On-device AI processing",
    "Privacy-first design",
    "Unified API for iOS and Android",
    "Apple Intelligence support",
    "Gemini Nano support",
    "Text summarization",
    "Text classification",
    "Entity extraction",
    "Conversational AI",
    "Multi-language translation",
    "Text rewriting",
    "Grammar proofreading",
    "Image description",
    "Private RAG",
    "Personalization",
  ],
};

function generateFAQSchema(faq: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image = DEFAULT_IMAGE,
  type = "website",
  keywords,
  faq,
}: SEOProps) {
  const fullTitle = title ? `${title} - Locanara` : DEFAULT_TITLE;
  const url = new URL(path, SITE_URL).href;
  const isHomePage = path === "/" || path === "";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Locanara" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data for AEO */}
      {isHomePage && (
        <>
          <script type="application/ld+json">
            {JSON.stringify(organizationSchema)}
          </script>
          <script type="application/ld+json">
            {JSON.stringify(softwareSchema)}
          </script>
        </>
      )}
      {faq && faq.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(generateFAQSchema(faq))}
        </script>
      )}
    </Helmet>
  );
}
