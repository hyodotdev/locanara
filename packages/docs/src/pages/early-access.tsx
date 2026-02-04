import { Link } from "react-router-dom";
import {
  MessageSquare,
  Shield,
  RefreshCw,
  Github,
  Users,
  Building2,
  Clock,
  Check,
  Star,
  Sparkles,
} from "lucide-react";
import SEO from "../components/SEO";
import Accordion from "../components/Accordion";

function EarlyAccess() {
  return (
    <div className="page-container">
      <SEO
        title="Founding Member Program"
        description="Join the exclusive Locanara Founding Member program. Limited to 50 developers worldwide. Lifetime access to next-gen on-device AI SDKs."
        path="/early-access"
        keywords="founding member, on-device AI, exclusive access, lifetime license, React Native, Expo, Flutter, SDK"
      />
      <div className="content-wrapper">
        <h1>Founding Member Program</h1>
        <p className="page-subtitle">
          An exclusive invitation to build the future of on-device AI
        </p>

        <section className="intro-section">
          <div
            className="alert-card alert-card--warning"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            <Star size={18} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
            <div>
              <strong>Private Access Only</strong>
              <p style={{ margin: "0.25rem 0 0 0", opacity: 0.9 }}>
                Locanara SDK is not publicly available. Only{" "}
                <strong>50 individual</strong> and{" "}
                <strong>10 enterprise</strong> founding members will receive
                access. This is your opportunity to join before public release.
              </p>
            </div>
          </div>
        </section>

        <section className="intro-section">
          <h2>The Velvet Rope</h2>
          <p>
            Locanara is currently in <strong>Closed Early Access</strong>. While
            our documentation is public so you can see what's possible, the SDK
            itself is exclusively available to Founding Members.
          </p>
          <p>
            This isn't just early access—it's an{" "}
            <strong>exclusive partnership</strong>. We're hand-selecting 50
            developers who want to be at the forefront of on-device AI. In
            return for your trust, you get lifetime access to everything we
            build—current features and all future Pro plugins including Vision
            and Voice capabilities.
          </p>
          <p style={{ fontStyle: "italic", opacity: 0.9 }}>
            "We're not building a product. We're building a community of
            pioneers who shape the future together."
          </p>
        </section>

        <section className="intro-section">
          <h2>Why Join Now?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <Sparkles size={24} />
              <h3>Be First</h3>
              <p>
                Build with next-gen on-device AI before anyone else. Ship
                features your competitors can't access yet.
              </p>
            </div>
            <div className="benefit-card">
              <Shield size={24} />
              <h3>Lifetime Lock-In</h3>
              <p>
                One payment, forever access. When we switch to subscription
                pricing, you're grandfathered in at $0/month.
              </p>
            </div>
            <div className="benefit-card">
              <MessageSquare size={24} />
              <h3>Direct Line</h3>
              <p>
                Skip support queues. Get direct access to the lead developer for
                implementation guidance and feature requests.
              </p>
            </div>
            <div className="benefit-card">
              <RefreshCw size={24} />
              <h3>Future-Proof</h3>
              <p>
                All future features included. Vision, Voice, and everything we
                build—automatically yours.
              </p>
            </div>
          </div>
        </section>

        <section className="intro-section">
          <h2>Founding Member Pricing</h2>
          <p className="page-subtitle" style={{ marginBottom: "2rem" }}>
            One-time investment. Lifetime returns.
          </p>

          <div className="pricing-section">
            <div className="pricing-column">
              <div className="pricing-header">
                <Users size={24} />
                <h3>Individual</h3>
                <p>Founding Member</p>
              </div>
              <p className="pricing-target">
                For solo developers and indie makers
              </p>
              <p className="pricing-limit">
                <Clock size={14} /> 50 spots total
              </p>

              <div className="pricing-hero">
                <span className="pricing-amount">$399</span>
                <span className="pricing-period">lifetime</span>
              </div>

              <div className="pricing-includes">
                <h4>Your Membership Includes:</h4>
                <ul>
                  <li>
                    <Check size={14} /> Private GitHub repository access
                  </li>
                  <li>
                    <Check size={14} /> All current SDK features
                  </li>
                  <li>
                    <Check size={14} /> All future features & Pro plugins
                  </li>
                  <li>
                    <Check size={14} /> Direct developer support
                  </li>
                  <li>
                    <Check size={14} /> Commercial license (personal publisher)
                  </li>
                </ul>
              </div>

              <div
                className="tooltip-wrapper"
                data-tooltip="Opening Soon"
                style={{ marginTop: "1rem" }}
              >
                <button
                  className="btn btn-primary"
                  disabled
                  style={{
                    width: "100%",
                    textAlign: "center",
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }}
                >
                  Apply for Membership
                </button>
              </div>
            </div>

            <div className="pricing-column">
              <div className="pricing-header">
                <Building2 size={24} />
                <h3>Enterprise</h3>
                <p>Founding Partner</p>
              </div>
              <p className="pricing-target">For teams and organizations</p>
              <p className="pricing-limit">
                <Clock size={14} /> 10 spots total
              </p>

              <div className="pricing-hero">
                <span className="pricing-amount">$1,999</span>
                <span className="pricing-period">lifetime</span>
              </div>

              <div className="pricing-includes">
                <h4>Everything in Individual, plus:</h4>
                <ul>
                  <li>
                    <Check size={14} /> Corporate publisher license
                  </li>
                  <li>
                    <Check size={14} /> Unlimited team seats
                  </li>
                  <li>
                    <Check size={14} /> Priority support channel
                  </li>
                  <li>
                    <Check size={14} /> NDA & custom agreements
                  </li>
                  <li>
                    <Check size={14} /> Tax invoice for accounting
                  </li>
                </ul>
              </div>

              <div
                className="tooltip-wrapper"
                data-tooltip="Opening Soon"
                style={{ marginTop: "1rem" }}
              >
                <button
                  className="btn btn-primary"
                  disabled
                  style={{
                    width: "100%",
                    textAlign: "center",
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }}
                >
                  Apply for Partnership
                </button>
              </div>
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: "1.5rem",
              opacity: 0.8,
              fontSize: "0.9rem",
            }}
          >
            After founding member spots are filled, Locanara will transition to
            subscription pricing.
          </p>
        </section>

        <section className="intro-section">
          <h2>How It Works</h2>
          <div className="operation-flow">
            <div className="flow-step">
              <div className="flow-content">
                <h3>
                  <span className="flow-number">1</span>
                  Apply
                </h3>
                <p>
                  Tell us about yourself and what you're building. We review
                  every application.
                </p>
              </div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-content">
                <h3>
                  <span className="flow-number">2</span>
                  Get Accepted
                </h3>
                <p>
                  Receive payment instructions within 48 hours if your
                  application is approved.
                </p>
              </div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-content">
                <h3>
                  <span className="flow-number">3</span>
                  Access Granted
                </h3>
                <p>
                  GitHub invitation sent within 24 hours of payment. You're
                  officially in.
                </p>
              </div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-content">
                <h3>
                  <span className="flow-number">4</span>
                  Start Building
                </h3>
                <p>
                  Install via GitHub Packages (npm, Maven, SPM) and ship
                  on-device AI.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="intro-section">
          <h2>What You're Getting</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <Github size={24} />
              <h3>Private Repository</h3>
              <p>
                Full source code access via GitHub. Install packages through
                GitHub Packages with your authenticated access token.
              </p>
            </div>
            <div className="benefit-card">
              <RefreshCw size={24} />
              <h3>Continuous Updates</h3>
              <p>
                Same-week patches for iOS/Android AI updates. Monthly feature
                releases. All included, forever.
              </p>
            </div>
            <div className="benefit-card">
              <MessageSquare size={24} />
              <h3>Direct Support</h3>
              <p>
                No ticket queues. GitHub Issues with direct developer response.
                Your voice shapes the roadmap.
              </p>
            </div>
            <div className="benefit-card">
              <Shield size={24} />
              <h3>Commercial License</h3>
              <p>
                Ship to App Store and Google Play. Official license certificate
                for your records.
              </p>
            </div>
          </div>
        </section>

        <section className="intro-section">
          <h2>Available SDKs</h2>
          <div className="sdk-list">
            <div className="sdk-item">
              <span className="sdk-status available">Available Now</span>
              <div className="sdk-info">
                <h3>locanara-react-native</h3>
                <p>
                  React Native SDK using Nitro Modules for high-performance
                  native bridging
                </p>
              </div>
            </div>
            <div className="sdk-item">
              <span className="sdk-status available">Available Now</span>
              <div className="sdk-info">
                <h3>locanara-expo</h3>
                <p>
                  Expo SDK using Expo Modules API for seamless managed workflow
                  integration
                </p>
              </div>
            </div>
            <div className="sdk-item">
              <span className="sdk-status coming">Coming Soon</span>
              <div className="sdk-info">
                <h3>locanara_flutter</h3>
                <p>Flutter SDK for cross-platform mobile development</p>
              </div>
            </div>
            <div className="sdk-item">
              <span className="sdk-status coming">Coming Soon</span>
              <div className="sdk-info">
                <h3>locanara-kmp</h3>
                <p>Kotlin Multiplatform SDK for shared business logic</p>
              </div>
            </div>
          </div>
          <p style={{ marginTop: "1rem", fontSize: "0.9rem", opacity: 0.8 }}>
            All SDKs—current and future—are included in your Founding Member
            license.
          </p>
        </section>

        <section className="intro-section">
          <h2>Trust-Based Access</h2>
          <p>
            We intentionally avoid device binding, hardware tokens, or runtime
            license checks. No DRM. No activation servers.{" "}
            <strong>
              The moment you're in, you can build without barriers.
            </strong>
          </p>
          <p>
            This reflects our belief that developer experience should never be
            compromised. We trust our founding members, and we focus our energy
            on building great SDKs instead of policing usage.
          </p>

          <h3 style={{ marginTop: "2rem" }}>License Terms</h3>
          <div className="alert-card alert-card--warning">
            <p style={{ margin: 0 }}>
              <strong>Publisher Distinction:</strong> Individual licenses are
              for apps published under a <strong>personal name</strong>. If your
              App Store/Play Store publisher is a <strong>company name</strong>,
              you must apply for Enterprise.
            </p>
          </div>
        </section>

        <section className="intro-section">
          <h2>FAQ</h2>
          <Accordion title="Why is access limited?" variant="neutral">
            <p>
              We're building something special with a small group of dedicated
              developers. Limited spots ensure everyone gets direct attention
              and influence over the product direction. This is a partnership,
              not just a transaction.
            </p>
          </Accordion>
          <Accordion
            title="What happens after spots are filled?"
            variant="neutral"
          >
            <p>
              Locanara will transition to a subscription model for public
              access. Founding members keep their lifetime access—no
              subscription fees, ever. You're locked in at the best price we'll
              ever offer.
            </p>
          </Accordion>
          <Accordion
            title="What's included in 'all future features'?"
            variant="neutral"
          >
            <p>
              Everything. New API capabilities, Pro plugins (Vision, Voice),
              additional platform support, performance improvements—if we build
              it, you get it. No upsells, no premium tiers to unlock.
            </p>
          </Accordion>
          <Accordion title="Why no free trial?" variant="neutral">
            <p>
              Our documentation shows exactly what Locanara can do. The SDK is
              the implementation—and that's what you're investing in. We'd
              rather have 50 committed partners than 5,000 tire-kickers.
            </p>
          </Accordion>
          <Accordion
            title="Can I upgrade from Individual to Enterprise?"
            variant="neutral"
          >
            <p>
              Yes. If you start as Individual and later incorporate, contact us
              to upgrade. You'll pay the difference between tiers.
            </p>
          </Accordion>
          <Accordion title="What platforms are supported?" variant="neutral">
            <p>
              iOS 26+ (Apple Intelligence), Android 14+ (Gemini Nano via ML
              Kit), and Web (Chrome Built-in AI). Platform availability varies
              by device based on Apple and Google rollout schedules.
            </p>
          </Accordion>
        </section>

        <section className="intro-section">
          <div className="cta-section">
            <h2>Ready to Join?</h2>
            <p>
              This is your invitation to be among the first 50 developers
              building with next-gen on-device AI. Lock in lifetime access
              before we open to the public.
            </p>
            <div
              className="tooltip-wrapper"
              data-tooltip="Opening Soon"
              style={{ display: "inline-block" }}
            >
              <button
                className="btn btn-primary"
                disabled
                style={{ opacity: 0.5, cursor: "not-allowed" }}
              >
                Apply for Founding Membership
              </button>
            </div>
            <p className="cta-note">Limited spots available.</p>
          </div>
        </section>

        <div className="back-link">
          <Link to="/languages">&larr; Back to SDKs & Implementations</Link>
        </div>
      </div>
    </div>
  );
}

export default EarlyAccess;
