import SEO from "../components/SEO";
import { useScrollToHash } from "../hooks/useScrollToHash";

function Versions() {
  useScrollToHash();

  return (
    <div className="page-container">
      <SEO
        title="Versions & Release Channels"
        description="Locanara SDK versions and release channels."
        path="/versions"
      />
      <div className="content-wrapper">
        <h1>Versions & Release Channels</h1>
        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: "3rem",
            lineHeight: "1.6",
          }}
        >
          Quickly scan the latest Locanara ecosystem versions using the badges
          and release links below. This page updates in lockstep with each
          library release train.
        </p>

        <section style={{ marginBottom: "2.5rem" }}>
          <h2>Locanara Android Library</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            The Gemini Nano implementation ships through Maven Central. Use the
            badge below to monitor the currently published artifact.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <a
              href="https://central.sonatype.com/artifact/com.locanara/locanara"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://img.shields.io/maven-central/v/com.locanara/locanara?style=flat-square&label=maven-central"
                alt="Maven Central"
              />
            </a>
            <code
              style={{
                padding: "0.25rem 0.5rem",
                background: "var(--bg-secondary)",
                borderRadius: "4px",
                fontSize: "0.85rem",
              }}
            >
              com.locanara:locanara
            </code>
          </div>
          <ul
            style={{ color: "var(--text-secondary)", paddingLeft: "1.25rem" }}
          >
            <li>
              Latest stable release badge reflects Maven Central publication.
            </li>
            <li>
              Releases follow the core Locanara spec cadence; check the tag
              notes on GitHub for API surface changes.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: "2.5rem" }}>
          <h2>Locanara Apple Library</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            Apple Intelligence support is distributed via Swift Package Manager
            and CocoaPods. Both channels are updated in lockstep.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <a
              href="https://github.com/locanara/locanara-swift/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://img.shields.io/github/v/tag/locanara/locanara-swift?style=flat-square&logo=swift&label=Swift%20Package"
                alt="Swift Package"
              />
            </a>
            <a
              href="https://cocoapods.org/pods/Locanara"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://img.shields.io/cocoapods/v/Locanara?style=flat-square&logo=cocoapods&label=CocoaPods"
                alt="CocoaPods"
              />
            </a>
          </div>
          <ul
            style={{ color: "var(--text-secondary)", paddingLeft: "1.25rem" }}
          >
            <li>
              SPM packages are tagged with the same semantic versions as docs.
            </li>
            <li>CocoaPods specs are pushed immediately after SPM releases.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "2.5rem" }}>
          <h2>Locanara Web Library (Pro-only)</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            The Chrome Built-in AI implementation is distributed via npm. Web
            SDK is available exclusively to Pro users because it requires model
            management for Wasm fallback on unsupported browsers.
          </p>
          <div style={{ marginBottom: "1rem" }}>
            <code
              style={{
                padding: "0.25rem 0.5rem",
                background: "var(--bg-secondary)",
                borderRadius: "4px",
                fontSize: "0.85rem",
              }}
            >
              @locanara/web
            </code>
          </div>
          <ul
            style={{ color: "var(--text-secondary)", paddingLeft: "1.25rem" }}
          >
            <li>Requires Chrome 128+ with Built-in AI features enabled.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Versions;
