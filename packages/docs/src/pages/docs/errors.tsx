import { Link } from "react-router-dom";
import CodeBlock from "../../components/CodeBlock";
import SEO from "../../components/SEO";

function Errors() {
  return (
    <div className="doc-page">
      <SEO
        title="Error Codes"
        description="Locanara error codes and handling - LocanaraError structure, error types, and troubleshooting guide."
        path="/docs/errors"
        keywords="Locanara errors, LocanaraError, error handling, on-device AI"
      />
      <h1>Error Codes</h1>

      <section>
        <h2>Error Structure</h2>
        <p>
          All Locanara errors follow a consistent structure for easy handling.
        </p>
        <CodeBlock
          language="graphql"
          code={`type LocanaraError {
  code: ErrorCode!
  message: String!
  featureType: FeatureType
}`}
        />
      </section>

      <section>
        <h2>Error Codes</h2>

        <h3>Feature Availability Errors</h3>
        <table className="error-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>FEATURE_NOT_AVAILABLE</code>
              </td>
              <td>The requested AI feature is not available on this device</td>
              <td>Check device capability before using features</td>
            </tr>
            <tr>
              <td>
                <code>MODEL_NOT_READY</code>
              </td>
              <td>The AI model is not ready (still loading or downloading)</td>
              <td>Wait for model to be ready, show loading indicator</td>
            </tr>
            <tr>
              <td>
                <code>PLATFORM_NOT_SUPPORTED</code>
              </td>
              <td>Current platform doesn't support on-device AI</td>
              <td>Use cloud-based fallback or show unsupported message</td>
            </tr>
          </tbody>
        </table>

        <h3>Input Errors</h3>
        <table className="error-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>INPUT_TOO_LONG</code>
              </td>
              <td>Input text exceeds the maximum allowed length</td>
              <td>Truncate or split input text</td>
            </tr>
            <tr>
              <td>
                <code>INPUT_TOO_SHORT</code>
              </td>
              <td>Input text is too short for meaningful processing</td>
              <td>Provide more context or text</td>
            </tr>
            <tr>
              <td>
                <code>INVALID_INPUT</code>
              </td>
              <td>Input format is invalid</td>
              <td>Check input format and parameters</td>
            </tr>
            <tr>
              <td>
                <code>UNSUPPORTED_LANGUAGE</code>
              </td>
              <td>The specified language is not supported</td>
              <td>Use a supported language</td>
            </tr>
          </tbody>
        </table>

        <h3>Execution Errors</h3>
        <table className="error-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>EXECUTION_FAILED</code>
              </td>
              <td>AI feature execution failed</td>
              <td>Retry the operation</td>
            </tr>
            <tr>
              <td>
                <code>TIMEOUT</code>
              </td>
              <td>Operation timed out</td>
              <td>Retry with shorter input or later</td>
            </tr>
            <tr>
              <td>
                <code>CANCELLED</code>
              </td>
              <td>Operation was cancelled</td>
              <td>No action needed</td>
            </tr>
            <tr>
              <td>
                <code>UNKNOWN</code>
              </td>
              <td>Unknown error occurred</td>
              <td>Log error and retry</td>
            </tr>
          </tbody>
        </table>

        <h3>Platform-Specific Errors</h3>
        <table className="error-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Platform</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>FOUNDATION_MODEL_UNAVAILABLE</code>
              </td>
              <td>iOS</td>
              <td>Apple Intelligence Foundation Models not available</td>
            </tr>
            <tr>
              <td>
                <code>GEMINI_NANO_UNAVAILABLE</code>
              </td>
              <td>Android</td>
              <td>Gemini Nano model not available</td>
            </tr>
            <tr>
              <td>
                <code>MODEL_DOWNLOAD_REQUIRED</code>
              </td>
              <td>Android</td>
              <td>Gemini Nano model needs to be downloaded</td>
            </tr>
            <tr>
              <td>
                <code>MODEL_DOWNLOAD_FAILED</code>
              </td>
              <td>Android</td>
              <td>Failed to download Gemini Nano model</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Error Handling Examples</h2>

        <h3>Swift (iOS)</h3>
        <CodeBlock
          language="swift"
          code={`let result = await Locanara.summarize(text: text)

switch result {
case .success(let summary):
    print(summary.text)

case .failure(let error):
    switch error.code {
    case .featureNotAvailable:
        showUnavailableMessage()
    case .modelNotReady:
        showLoadingIndicator()
    case .inputTooLong:
        showInputTooLongError()
    default:
        showGenericError(error.message)
    }
}`}
        />

        <h3>Kotlin (Android)</h3>
        <CodeBlock
          language="kotlin"
          code={`val result = Locanara.summarize(text = text)

result.fold(
    onSuccess = { summary ->
        println(summary.text)
    },
    onFailure = { error ->
        when (error.code) {
            ErrorCode.FEATURE_NOT_AVAILABLE -> showUnavailableMessage()
            ErrorCode.MODEL_NOT_READY -> showLoadingIndicator()
            ErrorCode.INPUT_TOO_LONG -> showInputTooLongError()
            else -> showGenericError(error.message)
        }
    }
)`}
        />
      </section>

      <section>
        <h2>Best Practices</h2>
        <ul>
          <li>Always check device capability before using features</li>
          <li>Handle all error cases gracefully with user-friendly messages</li>
          <li>Implement retry logic for transient errors</li>
          <li>Log errors for debugging and analytics</li>
          <li>Provide fallback options when features are unavailable</li>
        </ul>
        <p className="type-link">
          See: <Link to="/docs/types">Type Definitions</Link> for complete error
          type information.
        </p>
      </section>
    </div>
  );
}

export default Errors;
