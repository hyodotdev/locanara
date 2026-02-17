import CodeBlock from "../../../components/docs/CodeBlock";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";

function AndroidRewriteTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Android Rewrite Tutorial"
        description="Learn how to rewrite text with different tones using Gemini Nano and Locanara SDK."
        path="/docs/tutorials/android-rewrite"
        keywords="Android rewrite, Gemini Nano, Kotlin, text rewriting, Locanara"
      />
      <h1>Android: Rewrite Tutorial</h1>
      <p>
        Rewrite text with different tones like professional, friendly,
        elaborate, or shortened using Gemini Nano.
      </p>

      <section>
        <h2>Prerequisites</h2>
        <ul>
          <li>Android Studio with API 34+ SDK</li>
          <li>Device with Gemini Nano support</li>
          <li>
            Locanara SDK installed (see{" "}
            <a href="/docs/android-setup">Setup Guide</a>)
          </li>
          <li>
            Default model set at startup:{" "}
            <code>LocanaraDefaults.model = PromptApiModel(context)</code>
          </li>
        </ul>
      </section>

      <section>
        <h2>1. Basic Rewrite</h2>
        <p>Rewrite text with a specific style using RewriteChain.</p>

        <CodeBlock language="kotlin">{`import com.locanara.builtin.RewriteChain
import com.locanara.builtin.RewriteOutputType

val result = RewriteChain(style = RewriteOutputType.PROFESSIONAL).run(
    "Hey! Can we meet tomorrow?"
)
println(result.rewrittenText)
// "I would appreciate the opportunity to meet with you tomorrow."`}</CodeBlock>
      </section>

      <section>
        <h2>2. Style Comparison</h2>
        <p>See how different styles transform the same text.</p>

        <CodeBlock language="kotlin">{`val original = "Hey! Can we meet up tomorrow to talk about the project?"

// Professional - formal business tone
val pro = RewriteChain(style = RewriteOutputType.PROFESSIONAL).run(original)
// "I would like to schedule a meeting for tomorrow to discuss the project."

// Friendly - casual, warm tone
val friendly = RewriteChain(style = RewriteOutputType.FRIENDLY).run(original)
// "Would love to catch up tomorrow and chat about the project!"

// Elaborate - more detailed
val elaborate = RewriteChain(style = RewriteOutputType.ELABORATE).run(original)
// "I was wondering if you might be available tomorrow so that we could
//  have a discussion about the current state of our project."

// Shorten - concise
val short = RewriteChain(style = RewriteOutputType.SHORTEN).run(original)
// "Meeting tomorrow to discuss project?"`}</CodeBlock>
      </section>

      <section>
        <h2>3. Pipeline Composition</h2>
        <p>Combine RewriteChain with other chains.</p>

        <CodeBlock language="kotlin">{`import com.locanara.core.LocanaraDefaults

val model = LocanaraDefaults.model

// Proofread first, then rewrite in professional tone
val result = model.pipeline()
    .proofread()
    .rewrite(style = RewriteOutputType.PROFESSIONAL)
    .run("Hey thier! Cna we mee tomorrow?")

println(result.rewrittenText)
// Corrected and professionalized`}</CodeBlock>
      </section>

      <section>
        <h2>Available Styles</h2>
        <table>
          <thead>
            <tr>
              <th>Style</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>PROFESSIONAL</code>
              </td>
              <td>Formal, business-appropriate tone</td>
            </tr>
            <tr>
              <td>
                <code>FRIENDLY</code>
              </td>
              <td>Casual, warm, and approachable</td>
            </tr>
            <tr>
              <td>
                <code>ELABORATE</code>
              </td>
              <td>More detailed and descriptive</td>
            </tr>
            <tr>
              <td>
                <code>SHORTEN</code>
              </td>
              <td>Concise and to the point</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>RewriteChain</strong>: Takes a <code>style</code> parameter
            ( <code>PROFESSIONAL</code>, <code>FRIENDLY</code>,{" "}
            <code>ELABORATE</code>, <code>SHORTEN</code>)
          </li>
          <li>
            <strong>RewriteResult</strong>: Contains <code>rewrittenText</code>
          </li>
          <li>The original meaning is preserved while adapting the tone</li>
          <li>
            Combine with ProofreadChain via Pipeline for corrected + rewritten
            output
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{
          to: "/docs/tutorials/android-chat",
          label: "Android Chat Tutorial",
        }}
        next={undefined}
      />
    </div>
  );
}

export default AndroidRewriteTutorial;
