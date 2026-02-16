import { ExternalLink } from "lucide-react";
import AnchorLink from "../../components/docs/AnchorLink";
import { SEO } from "../../components/SEO";
import { useScrollToHash } from "../../hooks/useScrollToHash";

interface ResourceLinkProps {
  href: string;
  title: string;
  description: string;
}

function ResourceLink({ href, title, description }: ResourceLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="resource-link"
    >
      <div className="resource-link-content">
        <span className="resource-link-title">{title}</span>
        <span className="resource-link-desc">{description}</span>
      </div>
      <ExternalLink size={14} className="resource-link-icon" />
    </a>
  );
}

function Resources() {
  useScrollToHash();

  return (
    <div className="doc-page">
      <SEO
        title="Resources"
        description="Resources for on-device AI development with Apple Intelligence and Gemini Nano."
        path="/docs/resources"
        keywords="Apple Intelligence, Gemini Nano, Foundation Models, ML Kit GenAI, on-device AI"
      />
      <h1>Resources</h1>
      <p className="doc-description">
        Official documentation and resources for on-device AI development.
      </p>

      <section className="doc-section">
        <AnchorLink id="apple-intelligence" level="h2">
          Apple Intelligence
        </AnchorLink>
        <p className="section-description">
          Apple's on-device AI framework for iOS 26+ and macOS 26+. Locanara
          also supports llama.cpp with GGUF models on iOS 17+.
        </p>
        <div className="resource-links">
          <ResourceLink
            href="https://developer.apple.com/apple-intelligence/"
            title="Apple Intelligence Overview"
            description="Official developer documentation"
          />
          <ResourceLink
            href="https://developer.apple.com/documentation/foundationmodels"
            title="Foundation Models Framework"
            description="API reference for on-device language models"
          />
          <ResourceLink
            href="https://developer.apple.com/videos/play/wwdc2024/10223/"
            title="WWDC 2024: Apple Intelligence"
            description="Introduction to Apple Intelligence at WWDC"
          />
        </div>
      </section>

      <section className="doc-section">
        <AnchorLink id="gemini-nano" level="h2">
          Gemini Nano & ML Kit
        </AnchorLink>
        <p className="section-description">
          Google's on-device AI for Android 14+ devices.
        </p>
        <div className="resource-links">
          <ResourceLink
            href="https://developer.android.com/ai/aicore"
            title="Android AICore"
            description="Gemini Nano integration on Android"
          />
          <ResourceLink
            href="https://developers.google.com/ml-kit/genai"
            title="ML Kit GenAI"
            description="On-device generative AI APIs for Android"
          />
          <ResourceLink
            href="https://ai.google.dev/gemini-api/docs/models/gemini#gemini-nano"
            title="Gemini Nano Documentation"
            description="Model specifications and capabilities"
          />
        </div>
      </section>

      <section className="doc-section">
        <AnchorLink id="ml-kit-apis" level="h2">
          ML Kit GenAI APIs
        </AnchorLink>
        <p className="section-description">
          Specific ML Kit GenAI API documentation for each feature.
        </p>
        <div className="resource-links">
          <ResourceLink
            href="https://developers.google.com/ml-kit/genai/summarization"
            title="Summarization API"
            description="On-device text summarization"
          />
          <ResourceLink
            href="https://developers.google.com/ml-kit/genai/proofreading"
            title="Proofreading API"
            description="Grammar and spelling correction"
          />
          <ResourceLink
            href="https://developers.google.com/ml-kit/genai/rewriting"
            title="Rewriting API"
            description="Text rewriting with different styles"
          />
          <ResourceLink
            href="https://developers.google.com/ml-kit/genai/image-description"
            title="Image Description API"
            description="Generate descriptions from images"
          />
        </div>
      </section>

      <section className="doc-section">
        <AnchorLink id="news" level="h2">
          Latest Updates
        </AnchorLink>
        <div className="news-list">
          <div className="news-item">
            <span className="news-badge ios">iOS 26.0+</span>
            <a
              href="https://developer.apple.com/documentation/foundationmodels"
              target="_blank"
              rel="noopener noreferrer"
            >
              Foundation Models Framework Released
              <ExternalLink size={12} className="news-item-link-icon" />
            </a>
          </div>
          <div className="news-item">
            <span className="news-badge android">Android 14+</span>
            <a
              href="https://developers.google.com/ml-kit/genai"
              target="_blank"
              rel="noopener noreferrer"
            >
              ML Kit GenAI Beta Available
              <ExternalLink size={12} className="news-item-link-icon" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Resources;
