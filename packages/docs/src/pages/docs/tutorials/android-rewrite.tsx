import CodeBlock from "../../../components/CodeBlock";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";

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
        elaborate, or shortened using Gemini Nano and ML Kit GenAI.
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
        </ul>
      </section>

      <section>
        <h2>1. Basic Rewrite</h2>
        <p>Rewrite text with a specific style.</p>

        <CodeBlock language="kotlin">{`import com.locanara.*

suspend fun rewrite(text: String, style: RewriteOutputType): String {
    val locanara = Locanara.getInstance()

    val input = ExecuteFeatureInput(
        feature = FeatureType.REWRITE,
        input = text,
        parameters = FeatureParametersInput(
            rewrite = RewriteParametersInput(
                outputType = style
            )
        )
    )

    val result = locanara.executeFeature(input)
    return result.result?.rewrite?.rewrittenText
        ?: throw LocanaraException("Rewrite failed")
}

// Usage
val professional = rewrite(
    text = "Hey! Can we meet tomorrow?",
    style = RewriteOutputType.PROFESSIONAL
)
println(professional)
// "I would appreciate the opportunity to meet with you tomorrow."`}</CodeBlock>
      </section>

      <section>
        <h2>2. Style Comparison</h2>
        <p>See how different styles transform the same text.</p>

        <CodeBlock language="kotlin">{`val original = "Hey! Can we meet up tomorrow to talk about the project?"

// Professional - formal business tone
val pro = rewrite(original, RewriteOutputType.PROFESSIONAL)
// "I would like to schedule a meeting for tomorrow to discuss the project."

// Friendly - casual, warm tone
val friendly = rewrite(original, RewriteOutputType.FRIENDLY)
// "Would love to catch up tomorrow and chat about the project!"

// Elaborate - more detailed
val elaborate = rewrite(original, RewriteOutputType.ELABORATE)
// "I was wondering if you might be available tomorrow so that we could
//  have a discussion about the current state of our project."

// Shorten - concise
val short = rewrite(original, RewriteOutputType.SHORTEN)
// "Meeting tomorrow to discuss project?"`}</CodeBlock>
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
            <strong>RewriteOutputType</strong>: Choose between{" "}
            <code>PROFESSIONAL</code>, <code>FRIENDLY</code>,{" "}
            <code>ELABORATE</code>, or <code>SHORTEN</code>
          </li>
          <li>The original meaning is preserved while adapting the tone</li>
          <li>
            Useful for email drafting, social media posts, and content
            adaptation
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{
          to: "/docs/tutorials/android-chat",
          label: "Android Chat Tutorial",
        }}
        next={
          import.meta.env.VITE_DOCS_TIER === "pro"
            ? { to: "/docs/tutorials/web", label: "Web Tutorial" }
            : undefined
        }
      />
    </div>
  );
}

export default AndroidRewriteTutorial;
