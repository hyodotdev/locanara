import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string;
}

const BASE_URL = "https://locanara.dev";
const DEFAULT_TITLE = "Locanara - Unified On-Device AI SDK";
const DEFAULT_DESCRIPTION =
  "Locanara is a unified SDK for on-device AI capabilities across iOS (Apple Intelligence) and Android (Gemini Nano). Privacy-first AI processing with GraphQL-based API.";

function SEO({ title, description, path = "", keywords }: SEOProps) {
  const pageTitle = title ? `${title} | Locanara` : DEFAULT_TITLE;
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />

      {/* Twitter */}
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={pageDescription} />
    </Helmet>
  );
}

export default SEO;
