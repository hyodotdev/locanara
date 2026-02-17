import { Link } from "react-router-dom";
import APICard from "../../../components/docs/APICard";

import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function UtilsIndex() {
  return (
    <div className="doc-page">
      <SEO
        title="Built-in Utils"
        description="Locanara built-in utility functions - summarize, classify, translate, rewrite, proofread, extract, chat, and more."
        path="/docs/utils"
        keywords="Locanara utils, SummarizeChain, ClassifyChain, built-in chains, on-device AI"
      />
      <h1>Built-in Utils</h1>
      <p>
        Ready-to-use AI utility functions that ship with Locanara. Each utility
        is available as a <strong>Chain</strong> (composable with Pipeline,
        Guardrails, Memory), as a <strong>model convenience method</strong>{" "}
        (e.g., <code>model.summarize()</code>), and via the{" "}
        <strong>low-level</strong> <code>executeFeature()</code> API.
      </p>
      <p className="type-link">
        For framework core APIs (Chain, Pipeline, Memory, Guardrail, Session,
        Agent, Model), see <Link to="/docs/apis">APIs</Link>.
      </p>

      <TLDRBox title="Usage Layers">
        <ul>
          <li>
            <strong>Built-in Chains</strong>: SummarizeChain, ClassifyChain,
            TranslateChain, etc. — composable with Pipeline & Guardrails
          </li>
          <li>
            <strong>Model Extensions</strong>: <code>model.summarize()</code>,{" "}
            <code>model.translate()</code> — convenience methods
          </li>
          <li>
            <strong>Low-Level API</strong>: <code>executeFeature()</code> —
            direct feature execution
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2>Platform-Specific Utils</h2>
        <p>Platform-specific utilities and native API access.</p>
        <div className="api-cards-grid">
          <APICard
            title="iOS Utils"
            description="Apple Intelligence utilities for Foundation Models, text processing, and image description."
            href="/docs/utils/ios"
            count={10}
          />
          <APICard
            title="Android Utils"
            description="Gemini Nano utilities for ML Kit GenAI, summarization, rewriting, and proofreading."
            href="/docs/utils/android"
            count={8}
          />
        </div>
      </section>

      <section>
        <h2>Built-in Chains</h2>
        <p>
          7 built-in chains ship as both ready-to-use utilities and reference
          implementations. Build your own by implementing the <code>Chain</code>{" "}
          protocol.
        </p>
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
                Built-in Chain
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
            <tr id="summarize">
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <Link to="/docs/utils/summarize">
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
                <Link to="/docs/utils/classify">
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
                <Link to="/docs/utils/extract">
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
                <Link to="/docs/utils/chat">
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
                <Link to="/docs/utils/translate">
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
                <Link to="/docs/utils/rewrite">
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
                <Link to="/docs/utils/proofread">
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
          </tbody>
        </table>
      </section>

      <section>
        <h2>Naming Convention</h2>
        <p>Locanara follows a consistent naming pattern:</p>
        <ul>
          <li>
            <strong>Built-in Chains</strong>: <code>SummarizeChain</code>,{" "}
            <code>TranslateChain</code>, etc.
          </li>
          <li>
            <strong>Model Extensions</strong>: <code>model.summarize()</code>,{" "}
            <code>model.translate()</code> — convenience methods
          </li>
          <li>
            <strong>Low-Level API</strong>:{" "}
            <code>executeFeature(.summarize)</code> — direct execution
          </li>
          <li>
            <strong>iOS-only</strong>: <code>getFoundationModelStatus</code>
          </li>
          <li>
            <strong>Android-only</strong>: <code>downloadGeminiNano</code>
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

export default UtilsIndex;
