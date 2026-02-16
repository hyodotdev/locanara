import CodeBlock from "../../../components/docs/CodeBlock";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";

function IOSRewriteTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="iOS Rewrite Tutorial"
        description="Learn how to rewrite text with different tones using Apple Intelligence and Locanara SDK."
        path="/docs/tutorials/ios-rewrite"
        keywords="iOS rewrite, Apple Intelligence, SwiftUI, text rewriting, Locanara"
      />
      <h1>iOS: Rewrite Tutorial</h1>
      <p>
        Rewrite text with different tones like professional, friendly,
        elaborate, or shortened using Apple Intelligence.
      </p>

      <section>
        <h2>Prerequisites</h2>
        <ul>
          <li>Xcode 16+ with iOS 17+ SDK (iOS 26+ for Apple Intelligence)</li>
          <li>Device with Apple Intelligence or downloadable GGUF model</li>
          <li>
            Locanara SDK installed (see{" "}
            <a href="/docs/ios-setup">Setup Guide</a>)
          </li>
        </ul>
      </section>

      <section>
        <h2>1. Basic Rewrite</h2>
        <p>Rewrite text with a specific style using RewriteChain.</p>

        <CodeBlock language="swift">{`import Locanara

let result = try await RewriteChain(style: .professional).run(
    "Hey! Can we meet tomorrow?"
)
print(result.rewrittenText)
// "I would appreciate the opportunity to meet with you tomorrow."`}</CodeBlock>
      </section>

      <section>
        <h2>2. Style Comparison</h2>
        <p>See how different styles transform the same text.</p>

        <CodeBlock language="swift">{`let original = "Hey! Can we meet up tomorrow to talk about the project?"

// Professional - formal business tone
let pro = try await RewriteChain(style: .professional).run(original)
// "I would like to schedule a meeting for tomorrow to discuss the project."

// Friendly - casual, warm tone
let friendly = try await RewriteChain(style: .friendly).run(original)
// "Would love to catch up tomorrow and chat about the project!"

// Elaborate - more detailed
let elaborate = try await RewriteChain(style: .elaborate).run(original)
// "I was wondering if you might be available tomorrow so that we could
//  have a discussion about the current state of our project."

// Shorten - concise
let short = try await RewriteChain(style: .shorten).run(original)
// "Meeting tomorrow to discuss project?"`}</CodeBlock>
      </section>

      <section>
        <h2>3. Pipeline Composition</h2>
        <p>Combine RewriteChain with other chains.</p>

        <CodeBlock language="swift">{`// Proofread first, then rewrite in professional tone
let result = try await model.pipeline {
    Proofread()
    Rewrite(style: .professional)
}.run("Hey thier! Cna we mee tomorrow?")

print(result.rewrittenText)
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
                <code>.professional</code>
              </td>
              <td>Formal, business-appropriate tone</td>
            </tr>
            <tr>
              <td>
                <code>.friendly</code>
              </td>
              <td>Casual, warm, and approachable</td>
            </tr>
            <tr>
              <td>
                <code>.elaborate</code>
              </td>
              <td>More detailed and descriptive</td>
            </tr>
            <tr>
              <td>
                <code>.shorten</code>
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
            ( <code>.professional</code>, <code>.friendly</code>,{" "}
            <code>.elaborate</code>, <code>.shorten</code>)
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
        prev={{ to: "/docs/tutorials/ios-chat", label: "iOS Chat Tutorial" }}
        next={{ to: "/docs/tutorials/android", label: "Android Tutorial" }}
      />
    </div>
  );
}

export default IOSRewriteTutorial;
