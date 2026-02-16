import CodeBlock from "../../../components/docs/CodeBlock";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";

function WebSummarizeTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Web Summarize Tutorial"
        description="Learn how to implement text summarization with Chrome Built-in AI using Locanara SDK."
        path="/docs/tutorials/web-summarize"
        keywords="Web summarize, Chrome Built-in AI, TypeScript, text summarization, Locanara"
      />
      <h1>Web: Summarize Tutorial</h1>
      <p>
        Learn how to implement text summarization that condenses long text using
        Chrome Built-in AI and the Locanara Web SDK.
      </p>

      <section>
        <h2>Prerequisites</h2>
        <ul>
          <li>Chrome Canary or Dev channel with Built-in AI flags enabled</li>
          <li>
            Locanara Web SDK installed (see{" "}
            <a href="/docs/web-setup">Setup Guide</a>)
          </li>
        </ul>
      </section>

      <section>
        <h2>Basic Implementation</h2>
        <p>Simple summarization with the Locanara Web SDK.</p>

        <CodeBlock language="typescript">{`import { Locanara, SummarizeType, SummarizeLength } from '@locanara/web';

const locanara = Locanara.getInstance();

async function summarizeText(text: string): Promise<string> {
  try {
    const result = await locanara.summarize(text, {
      type: SummarizeType.KEY_POINTS,
      length: SummarizeLength.MEDIUM,
    });
    return result.summary;
  } catch (error) {
    console.error('Summarization failed:', error);
    throw error;
  }
}

// Usage
const summary = await summarizeText('Your long text here...');
console.log(summary);`}</CodeBlock>
      </section>

      <section>
        <h2>Streaming Implementation</h2>
        <p>Get real-time results with streaming for better user experience.</p>

        <CodeBlock language="typescript">{`async function summarizeWithStreaming(
  text: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  let fullResult = '';

  for await (const chunk of locanara.summarizeStreaming(text, {
    type: SummarizeType.KEY_POINTS,
    length: SummarizeLength.MEDIUM,
  })) {
    fullResult += chunk;
    onChunk(chunk);
  }

  return fullResult;
}

// Usage in UI
const resultElement = document.getElementById('result')!;
resultElement.textContent = '';

await summarizeWithStreaming(inputText, (chunk) => {
  resultElement.textContent += chunk;
});`}</CodeBlock>
      </section>

      <section>
        <h2>React/Framework Usage</h2>
        <p>Example with state management in a component.</p>

        <CodeBlock language="typescript">{`const [summary, setSummary] = useState('');
const [isLoading, setIsLoading] = useState(false);

async function handleSummarize(text: string) {
  setIsLoading(true);
  setSummary('');

  try {
    // Use streaming for real-time updates
    for await (const chunk of locanara.summarizeStreaming(text, {
      type: SummarizeType.KEY_POINTS,
      length: SummarizeLength.MEDIUM,
    })) {
      setSummary(prev => prev + chunk);
    }
  } catch (error) {
    console.error('Summarization failed:', error);
  } finally {
    setIsLoading(false);
  }
}`}</CodeBlock>
      </section>

      <section>
        <h2>Summarization Options</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>KEY_POINTS</code>
              </td>
              <td>Extract main points as bullet list</td>
            </tr>
            <tr>
              <td>
                <code>TL_DR</code>
              </td>
              <td>Brief summary paragraph</td>
            </tr>
            <tr>
              <td>
                <code>TEASER</code>
              </td>
              <td>Engaging preview text</td>
            </tr>
            <tr>
              <td>
                <code>HEADLINE</code>
              </td>
              <td>Single-line headline</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ marginTop: "1.5rem" }}>Length Options</h3>
        <ul>
          <li>
            <code>SHORT</code> - Concise output
          </li>
          <li>
            <code>MEDIUM</code> - Balanced length
          </li>
          <li>
            <code>LONG</code> - Detailed output
          </li>
        </ul>
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>SummarizeType</strong>: Choose the format of the summary
          </li>
          <li>
            <strong>SummarizeLength</strong>: Control the output length
          </li>
          <li>Use streaming for better UX with real-time output</li>
          <li>
            Check feature availability before use with{" "}
            <code>getDeviceCapability()</code>
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/web", label: "Web Tutorial" }}
        next={{ to: "/docs/tutorials/web-chat", label: "Web Chat Tutorial" }}
      />
    </div>
  );
}

export default WebSummarizeTutorial;
