import { Link } from "react-router-dom";
import AnchorLink from "../../components/docs/AnchorLink";
import Callout from "../../components/docs/Callout";
import PageNavigation from "../../components/docs/PageNavigation";
import { SEO } from "../../components/SEO";
import { LOCANARA_VERSIONS } from "../../lib/versioning";

const releaseMap = [
  {
    surface: "Shared GraphQL types",
    coordinate: "@hyodotdev/locanara-gql",
    version: LOCANARA_VERSIONS.types,
  },
  {
    surface: "Apple SDK",
    coordinate: "Locanara (SPM / CocoaPods)",
    version: LOCANARA_VERSIONS.apple,
  },
  {
    surface: "Android SDK",
    coordinate: "com.locanara:locanara",
    version: LOCANARA_VERSIONS.android,
  },
  {
    surface: "Web SDK",
    coordinate: "locanara",
    version: LOCANARA_VERSIONS.version,
  },
  {
    surface: "Expo library",
    coordinate: "expo-ondevice-ai",
    version: LOCANARA_VERSIONS.expo,
  },
  {
    surface: "React Native library",
    coordinate: "react-native-ondevice-ai",
    version: LOCANARA_VERSIONS["react-native"],
  },
  {
    surface: "Flutter library",
    coordinate: "flutter_ondevice_ai",
    version: LOCANARA_VERSIONS.flutter,
  },
] as const;

function ReleaseNotes() {
  return (
    <div className="doc-page">
      <SEO
        title="Release Notes"
        description="Locanara release notes, compatibility details, verification coverage, and current repository version map."
        path="/docs/release-notes"
        keywords="Locanara release notes, on-device AI SDK, ExecuTorch, Gemini Nano, dependency updates"
      />
      <h1>Release Notes</h1>
      <p className="doc-description">
        Repository maintenance updates, compatibility notes, and the release map
        shared by Locanara packages.
      </p>

      <Callout type="info" title="Publication status">
        <p>
          A repository release note does not prove that every package has been
          published. Registry publication and production documentation
          deployment remain separate maintainer-controlled steps. See the{" "}
          <Link to="/versions">version channels</Link> for distribution links.
        </p>
      </Callout>

      <section>
        <AnchorLink id="2026-08-maintenance" level="h2">
          August 2026 maintenance update
        </AnchorLink>
        <p>
          <time dateTime="2026-08-08">August 8, 2026</time>
        </p>
        <p>
          This update refreshes compatible dependencies, strengthens release and
          deployment checks, and improves deterministic generation without
          changing the public package versions listed below. The implementation
          and verification history is available in{" "}
          <a
            href="https://github.com/hyodotdev/locanara/pull/23"
            target="_blank"
            rel="noopener noreferrer"
          >
            pull request #23
          </a>
          .
        </p>

        <h3 id="highlights">Highlights</h3>
        <ul>
          <li>
            GraphQL generation now uses deterministic schema ordering, and
            version synchronization fails closed when tracked consumers drift.
          </li>
          <li>
            Android ExecuTorch integration is updated to 1.3.1, including the
            current reset and native error callback APIs with privacy-preserving
            failure coverage.
          </li>
          <li>
            Compatible Kotlin, AndroidX, coroutine, serialization, Web, site,
            Expo, React Native, Flutter, and build-tool dependencies are
            refreshed.
          </li>
          <li>
            CI now builds Expo plugin and React Native package artifacts before
            isolated example builds, so clean runners verify the same package
            entry points consumers receive.
          </li>
          <li>
            Release workflows validate committed versions, reject existing
            artifacts, require protected environments, and avoid rewriting
            existing tags or releases.
          </li>
        </ul>

        <h3 id="compatibility">Compatibility</h3>
        <ul>
          <li>
            No Locanara public API or package version changes are included.
          </li>
          <li>
            Android keeps Kotlin 2.1 compatibility and uses the matching ML Kit
            Prompt API beta rather than forcing a Kotlin 2.3 migration.
          </li>
          <li>
            Expo, React Native, Nitro, Jest, TypeScript, Android Gradle Plugin,
            and Kotlin major migrations remain separate upgrade projects.
          </li>
          <li>
            All inference remains on device; this update does not add a cloud
            fallback or prompt telemetry.
          </li>
        </ul>

        <h3 id="verification">Verification</h3>
        <p>
          The change set passed generated-type drift checks, Apple and Android
          SDK tests and example builds, Web and site verification, all three
          wrapper test matrices, agent-context checks, and isolated Expo and
          React Native native builds in CI. Runtime model availability and
          hardware-specific inference still require supported real devices.
        </p>
      </section>

      <section>
        <AnchorLink id="current-release-map" level="h2">
          Current repository release map
        </AnchorLink>
        <p>
          These values are read from the synchronized site copy of the root
          <code> locanara-versions.json</code> source of truth.
        </p>
        <table>
          <thead>
            <tr>
              <th>Surface</th>
              <th>Package or coordinate</th>
              <th>Version</th>
            </tr>
          </thead>
          <tbody>
            {releaseMap.map(({ surface, coordinate, version }) => (
              <tr key={surface}>
                <td>{surface}</td>
                <td>
                  <code>{coordinate}</code>
                </td>
                <td>
                  <code>{version}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <PageNavigation prev={{ to: "/docs/resources", label: "Resources" }} />
    </div>
  );
}

export default ReleaseNotes;
