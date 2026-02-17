import { Link } from "react-router-dom";
import CodeBlock from "../../../components/docs/CodeBlock";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function TypesAndroid() {
  return (
    <div className="doc-page">
      <SEO
        title="Android Types"
        description="Locanara Android-specific type definitions - GeminiNanoInfoAndroid, DeviceInfoAndroid, ExecuteFeatureOptionsAndroid for Kotlin."
        path="/docs/types/android"
        keywords="Locanara types, Android, Gemini Nano, ML Kit GenAI, Kotlin"
      />
      <h1>Android Types</h1>
      <p>
        Type definitions specific to Android/Gemini Nano. All Android-specific
        types have the <code>Android</code> suffix to distinguish from other
        platforms.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>Core:</strong>{" "}
            <a href="#gemini-nano-info-android">GeminiNanoInfoAndroid</a>,{" "}
            <a href="#device-info-android">DeviceInfoAndroid</a>
          </li>
          <li>
            <strong>Options:</strong>{" "}
            <a href="#execute-feature-options-android">
              ExecuteFeatureOptionsAndroid
            </a>
          </li>
          <li>
            <strong>All types have Android suffix</strong> to distinguish from
            other platforms
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2 id="gemini-nano-info-android">GeminiNanoInfoAndroid</h2>
        <p>Detailed information about Gemini Nano model.</p>
        <CodeBlock
          language="kotlin"
          code={`data class GeminiNanoInfoAndroid(
    val version: String,
    val variant: String?,
    val supportedLanguages: List<String>,
    val capabilities: List<String>,
    val isDownloaded: Boolean,
    val downloadSizeMB: Int?,
    val isReady: Boolean
)`}
        />
      </section>

      <section>
        <h2 id="device-info-android">DeviceInfoAndroid</h2>
        <p>Android-specific device information.</p>
        <CodeBlock
          language="kotlin"
          code={`data class DeviceInfoAndroid(
    val manufacturer: String,
    val model: String,
    val apiLevel: Int,
    val androidVersion: String,
    val supportsGeminiNano: Boolean,
    val systemLanguages: List<String>,
    val gpuInfo: String?,
    val totalRAMMB: Int
)`}
        />
      </section>

      <section>
        <h2 id="execute-feature-options-android">
          ExecuteFeatureOptionsAndroid
        </h2>
        <p>Android-specific execution options for AI features.</p>
        <CodeBlock
          language="kotlin"
          code={`data class ExecuteFeatureOptionsAndroid(
    val useGeminiNano: Boolean? = null,
    val modelVariant: String? = null,
    val enableGPU: Boolean? = null,
    val numThreads: Int? = null
)`}
        />
      </section>

      <section>
        <h2>See Also</h2>
        <ul>
          <li>
            <Link to="/docs/types">All Types</Link>
          </li>
          <li>
            <Link to="/docs/types/ios">iOS Types</Link>
          </li>
          <li>
            <Link to="/docs/types/web">Web Types</Link>
          </li>
          <li>
            <Link to="/docs/utils/android">Android APIs</Link>
          </li>
          <li>
            <Link to="/docs/android-setup">Android Setup Guide</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default TypesAndroid;
