import { SEO } from "../components/SEO";
import { useScrollToHash } from "../hooks/useScrollToHash";

function Versions() {
  useScrollToHash();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEO
        title="Versions & Release Channels"
        description="Locanara SDK versions and release channels."
        path="/versions"
      />
      <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary mb-2">
        Versions & Release Channels
      </h1>
      <p className="text-text-secondary dark:text-text-dark-secondary mb-12 leading-relaxed">
        Quickly scan the latest Locanara ecosystem versions using the badges and
        release links below. This page updates in lockstep with each library
        release train.
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-text-primary dark:text-text-dark-primary mb-3">
          Locanara Android Library
        </h2>
        <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
          The Gemini Nano implementation ships through Maven Central. Use the
          badge below to monitor the currently published artifact.
        </p>
        <div className="flex gap-3 flex-wrap mb-4">
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
          <code className="px-2 py-1 bg-primary/5 dark:bg-white/5 rounded text-sm">
            com.locanara:locanara
          </code>
        </div>
        <ul className="text-text-secondary dark:text-text-dark-secondary pl-5 list-disc space-y-1">
          <li>
            Latest stable release badge reflects Maven Central publication.
          </li>
          <li>
            Releases follow the core Locanara spec cadence; check the tag notes
            on GitHub for API surface changes.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-text-primary dark:text-text-dark-primary mb-3">
          Locanara Apple Library
        </h2>
        <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
          Apple Intelligence support is distributed via Swift Package Manager
          and CocoaPods. Both channels are updated in lockstep.
        </p>
        <div className="flex gap-3 flex-wrap mb-4">
          <a
            href="https://github.com/hyodotdev/locanara/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://img.shields.io/github/v/tag/hyodotdev/locanara?style=flat-square&logo=swift&label=Swift%20Package"
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
        <ul className="text-text-secondary dark:text-text-dark-secondary pl-5 list-disc space-y-1">
          <li>
            SPM packages are tagged with the same semantic versions as docs.
          </li>
          <li>CocoaPods specs are pushed immediately after SPM releases.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-text-primary dark:text-text-dark-primary mb-3">
          Locanara Web Library
        </h2>
        <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
          The Chrome Built-in AI implementation is distributed via npm.
        </p>
        <div className="mb-4">
          <code className="px-2 py-1 bg-primary/5 dark:bg-white/5 rounded text-sm">
            @locanara/web
          </code>
        </div>
        <ul className="text-text-secondary dark:text-text-dark-secondary pl-5 list-disc space-y-1">
          <li>Requires Chrome 128+ with Built-in AI features enabled.</li>
        </ul>
      </section>
    </div>
  );
}

export default Versions;
