import { Link } from "react-router-dom";
import SEO from "../../../components/SEO";
import PageNavigation from "../../../components/PageNavigation";

function TutorialsIndex() {
  return (
    <div className="doc-page">
      <SEO
        title="Tutorials"
        description="Step-by-step tutorials for implementing Locanara on iOS, Android, and Web platforms."
        path="/docs/tutorials"
        keywords="Locanara tutorial, iOS tutorial, Android tutorial, Web tutorial, on-device AI"
      />
      <h1>Tutorials</h1>
      <p>
        Step-by-step guides to help you implement on-device AI features using
        Locanara. Each tutorial provides complete working code that you can
        follow along with.
      </p>

      <section>
        <h2 id="choose-platform">Choose Your Platform</h2>
        <div className="api-cards-grid">
          <Link to="/docs/tutorials/ios" className="api-card">
            <div className="api-card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                <path d="M16.5 12.5c0 2.5-2 4.5-4.5 4.5s-4.5-2-4.5-4.5" />
                <circle cx="8.5" cy="9" r="1" fill="currentColor" />
                <circle cx="15.5" cy="9" r="1" fill="currentColor" />
              </svg>
            </div>
            <h3>iOS Tutorial</h3>
            <p>
              Build an iOS app with Apple Intelligence features using Swift and
              SwiftUI.
            </p>
          </Link>

          <Link to="/docs/tutorials/android" className="api-card">
            <div className="api-card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
            </div>
            <h3>Android Tutorial</h3>
            <p>
              Build an Android app with Gemini Nano features using Kotlin and
              Jetpack Compose.
            </p>
          </Link>
        </div>
      </section>

      <section>
        <h2 id="what-youll-build">What You'll Build</h2>
        <p>
          Each tutorial walks you through building a complete application that
          demonstrates:
        </p>
        <ul>
          <li>
            <strong>Device capability detection</strong> - Check if on-device AI
            is available
          </li>
          <li>
            <strong>Text summarization</strong> - Condense long text into key
            points
          </li>
          <li>
            <strong>Text classification</strong> - Categorize content into
            labels
          </li>
          <li>
            <strong>Chat interaction</strong> - Build conversational AI
            experiences
          </li>
          <li>
            <strong>Text rewriting</strong> - Change tone and style of text
          </li>
          <li>
            <strong>Proofreading</strong> - Grammar and spelling correction
          </li>
        </ul>
      </section>

      <section>
        <h2 id="prerequisites">Prerequisites</h2>
        <h4>iOS</h4>
        <ul>
          <li>Xcode 16+</li>
          <li>iOS 26+ device with Apple Intelligence enabled</li>
          <li>iPhone 15 Pro or later, or M-series Mac</li>
        </ul>

        <h4>Android</h4>
        <ul>
          <li>Android Studio Ladybug or later</li>
          <li>Android 14+ (API 34+) device</li>
          <li>Pixel 8/Pro or Samsung Galaxy S24+ with Gemini Nano</li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/resources", label: "Resources" }}
        next={{ to: "/docs/tutorials/ios", label: "iOS Tutorial" }}
      />
    </div>
  );
}

export default TutorialsIndex;
