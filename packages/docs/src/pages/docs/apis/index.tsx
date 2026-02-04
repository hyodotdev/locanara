import { Link } from "react-router-dom";
import APICard from "../../../components/APICard";
import ProOnly from "../../../components/ProOnly";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function APIsIndex() {
  return (
    <div className="doc-page">
      <SEO
        title="APIs"
        description="Locanara API reference - comprehensive documentation for on-device AI APIs across iOS, Android, and Web platforms."
        path="/docs/apis"
        keywords="Locanara API, summarize, classify, translate, chat, on-device AI"
      />
      <h1>APIs</h1>
      <p>
        Complete API reference for Locanara. APIs are organized by functionality
        to help you find what you need quickly.
      </p>

      <TLDRBox title="API Categories">
        <ul>
          <li>
            <strong>Core APIs</strong>: Device capability, SDK initialization
          </li>
          <li>
            <strong>Feature APIs</strong>: Summarize, Classify, Translate, Chat,
            etc.
          </li>
          <li>
            <strong>Platform-Specific</strong>: iOS and Android only APIs
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2>Core APIs</h2>
        <p>Essential APIs for checking device capability and SDK status.</p>
        <div className="api-cards-grid">
          <APICard
            title="iOS APIs"
            description="Apple Intelligence APIs for Foundation Models, text processing, and image description."
            href="/docs/apis/ios"
            count={10}
          />
          <APICard
            title="Android APIs"
            description="Gemini Nano APIs for ML Kit GenAI, summarization, rewriting, and proofreading."
            href="/docs/apis/android"
            count={8}
          />
          <ProOnly>
            <APICard
              title="Web APIs"
              description="Chrome Built-in AI APIs for Gemini Nano, summarization, translation, chat, and more."
              href="/docs/apis/web"
              count={12}
            />
          </ProOnly>
        </div>
      </section>

      <section>
        <h2>Unified Feature APIs</h2>
        <p>Cross-platform APIs available on iOS, Android, and Web.</p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                API
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                Description
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                iOS
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                Android
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                Web
              </th>
            </tr>
          </thead>
          <tbody>
            <tr id="get-device-capability">
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <Link to="/docs/apis/get-device-capability">
                  <code>getDeviceCapability()</code>
                </Link>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Get device AI capabilities
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
            </tr>
            <tr id="summarize">
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <Link to="/docs/apis/summarize">
                  <code>summarize()</code>
                </Link>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Summarize text into key points
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
            </tr>
            <tr id="classify">
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <Link to="/docs/apis/classify">
                  <code>classify()</code>
                </Link>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Classify text into categories
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Planned
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
            </tr>
            <tr id="extract">
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <Link to="/docs/apis/extract">
                  <code>extract()</code>
                </Link>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Extract entities from text
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Planned
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
            </tr>
            <tr id="chat">
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <Link to="/docs/apis/chat">
                  <code>chat()</code>
                </Link>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Conversational AI
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Experimental
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
            </tr>
            <tr id="translate">
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <Link to="/docs/apis/translate">
                  <code>translate()</code>
                </Link>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Language translation
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Planned
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
            </tr>
            <tr id="rewrite">
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <Link to="/docs/apis/rewrite">
                  <code>rewrite()</code>
                </Link>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Rephrase with different styles
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
            </tr>
            <tr id="proofread">
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <Link to="/docs/apis/proofread">
                  <code>proofread()</code>
                </Link>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Grammar and spelling check
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
            </tr>
            <tr id="describe-image">
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <Link to="/docs/apis/describe-image">
                  <code>describeImage()</code>
                </Link>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Generate image descriptions
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Yes
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>API Naming Convention</h2>
        <p>Locanara follows a consistent naming pattern:</p>
        <ul>
          <li>
            <strong>Cross-platform APIs</strong>: No suffix (e.g.,{" "}
            <code>summarize</code>, <code>translate</code>)
          </li>
          <li>
            <strong>iOS-only APIs</strong>: End with <code>IOS</code> (e.g.,{" "}
            <code>getFoundationModelStatus</code>)
          </li>
          <li>
            <strong>Android-only APIs</strong>: End with <code>Android</code>{" "}
            (e.g., <code>downloadGeminiNano</code>)
          </li>
        </ul>
        <p className="type-link">
          See: <Link to="/docs/types">Type Definitions</Link> for complete type
          information.
        </p>
      </section>
    </div>
  );
}

export default APIsIndex;
