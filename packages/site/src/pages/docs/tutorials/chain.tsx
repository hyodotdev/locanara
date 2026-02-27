import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function ChainTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Chain Tutorial"
        description="Learn how to compose AI logic using ModelChain, SequentialChain, ParallelChain, ConditionalChain, and custom chains."
        path="/docs/tutorials/chain"
        keywords="Chain, ModelChain, SequentialChain, ParallelChain, ConditionalChain, composable AI, Locanara"
      />
      <h1>Chain</h1>
      <p>
        Chain is the core composable building block. Every AI operation in
        Locanara is a Chain — from built-in features like SummarizeChain to your
        own custom logic. Compose chains sequentially, in parallel, or
        conditionally to build complex workflows from simple pieces.
      </p>

      <section>
        <h2>1. ModelChain</h2>
        <p>
          The simplest chain: wraps a model with a <code>PromptTemplate</code>.
          Templates use <code>{"{variable}"}</code> placeholders that get filled
          at runtime.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let template = PromptTemplate.from(
    "Explain the following concept briefly:\\n{text}"
)
let chain = ModelChain(
    model: FoundationLanguageModel(),
    promptTemplate: template,
    config: .conversational
)
let output = try await chain.invoke(ChainInput(text: "on-device AI"))
print(output.text)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.ModelChain
import com.locanara.core.PromptTemplate
import com.locanara.core.ChainInput
import com.locanara.core.GenerationConfig

val template = PromptTemplate.from(
    "Explain the following concept briefly:\n{text}"
)
val chain = ModelChain(
    promptTemplate = template,
    config = GenerationConfig.CONVERSATIONAL
)
val output = chain.invoke(ChainInput(text = "on-device AI"))
println(output.text)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat } from 'expo-ondevice-ai'

// ModelChain is native-only (Swift/Kotlin).
// Equivalent: pass your prompt directly to chat().
const result = await chat('Explain the following concept briefly: on-device AI')
console.log(result.message)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

final ai = FlutterOndeviceAi.instance;

// ModelChain is native-only (Swift/Kotlin).
// Equivalent: pass your prompt directly to chat().
final result = await ai.chat('Explain the following concept briefly: on-device AI');
print(result.message);`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/framework_chain_model.mp4"
          caption="ModelChain — prompt template formatted with user input, model generates response"
        />
      </section>

      <section>
        <h2>2. SequentialChain</h2>
        <p>
          Runs chains in order. The output of each chain becomes the input of
          the next — like a pipeline. Here, we proofread text first, then
          translate the corrected result.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let sequential = SequentialChain(chains: [
    ProofreadChain(),
    TranslateChain(targetLanguage: "ko")
])
let output = try await sequential.invoke(
    ChainInput(text: "Ths is a tset sentece about AI.")
)
print(output.text)  // Corrected and translated to Korean`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.SequentialChain
import com.locanara.builtin.ProofreadChain
import com.locanara.builtin.TranslateChain

val sequential = SequentialChain(chains = listOf(
    ProofreadChain(),
    TranslateChain(targetLanguage = "ko")
))
val output = sequential.invoke(
    ChainInput(text = "Ths is a tset sentece about AI.")
)
println(output.text)  // Corrected and translated to Korean`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { proofread, translate } from 'expo-ondevice-ai'

// SequentialChain is native-only.
// Equivalent: call functions sequentially.
const corrected = await proofread('Ths is a tset sentece about AI.')
const translated = await translate(corrected.correctedText, {
  targetLanguage: 'ko'
})
console.log(translated.translatedText)  // Corrected and translated`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `final ai = FlutterOndeviceAi.instance;

// SequentialChain is native-only.
// Equivalent: call methods sequentially.
final corrected = await ai.proofread('Ths is a tset sentece about AI.');
final translated = await ai.translate(
  corrected.correctedText,
  options: TranslateOptions(targetLanguage: 'ko'),
);
print(translated.translatedText);  // Corrected and translated`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/framework_chain_sequential.mp4"
          caption="SequentialChain — proofread then translate, output flows between chains"
        />
      </section>

      <section>
        <h2>3. ParallelChain</h2>
        <p>
          Runs multiple chains concurrently and collects all results. Each
          chain&apos;s output is stored in the metadata dictionary keyed by
          chain name.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let parallel = ParallelChain(chains: [
    SummarizeChain(),
    ClassifyChain(categories: ["tech", "science", "business"])
])
let output = try await parallel.invoke(
    ChainInput(text: longArticle)
)

// Primary output from first chain
print(output.text)

// Access individual results via metadata
let classifyResult = output.metadata["ClassifyChain"]
print(classifyResult ?? "")`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.ParallelChain
import com.locanara.builtin.SummarizeChain
import com.locanara.builtin.ClassifyChain

val parallel = ParallelChain(chains = listOf(
    SummarizeChain(),
    ClassifyChain(categories = listOf("tech", "science", "business"))
))
val output = parallel.invoke(ChainInput(text = longArticle))

// Primary output from first chain
println(output.text)

// Access individual results via metadata
val classifyResult = output.metadata["ClassifyChain"]
println(classifyResult)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { summarize, classify } from 'expo-ondevice-ai'

// ParallelChain is native-only.
// Equivalent: use Promise.all() for concurrent execution.
const [summary, classification] = await Promise.all([
  summarize(longArticle),
  classify(longArticle, { categories: ['tech', 'science', 'business'] })
])
console.log(summary.summary)
console.log(classification.topClassification.label)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `final ai = FlutterOndeviceAi.instance;

// ParallelChain is native-only.
// Equivalent: use Future.wait() for concurrent execution.
final results = await Future.wait([
  ai.summarize(longArticle),
  ai.classify(longArticle, options: ClassifyOptions(
    categories: ['tech', 'science', 'business'],
  )),
]);
final summary = results[0] as SummarizeResult;
final classification = results[1] as ClassifyResult;
print(summary.summary);
print(classification.topClassification.label);`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/framework_chain_parallel.mp4"
          caption="ParallelChain — running Summarize and Classify concurrently, collecting both results"
        />
      </section>

      <section>
        <h2>4. ConditionalChain</h2>
        <p>
          Routes input to different chains based on a condition function. The
          condition returns a key that maps to one of the configured branches.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let conditional = ConditionalChain(
    condition: { $0.text.count > 200 ? "long" : "short" },
    branches: [
        "long": SummarizeChain(),
        "short": RewriteChain(style: .elaborate)
    ]
)

let output = try await conditional.invoke(ChainInput(text: inputText))
// Long text → summarized, short text → elaborated
print(output.text)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.ConditionalChain
import com.locanara.builtin.SummarizeChain
import com.locanara.builtin.RewriteChain
import com.locanara.RewriteOutputType

val conditional = ConditionalChain(
    condition = { if (it.text.length > 200) "long" else "short" },
    branches = mapOf(
        "long" to SummarizeChain(),
        "short" to RewriteChain(style = RewriteOutputType.ELABORATE)
    )
)

val output = conditional.invoke(ChainInput(text = inputText))
// Long text → summarized, short text → elaborated
println(output.text)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { summarize, rewrite } from 'expo-ondevice-ai'

// ConditionalChain is native-only.
// Equivalent: use if/else branching.
let result: string
if (inputText.length > 200) {
  const summary = await summarize(inputText)
  result = summary.summary
} else {
  const rewritten = await rewrite(inputText, { outputType: 'ELABORATE' })
  result = rewritten.rewrittenText
}
console.log(result)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `final ai = FlutterOndeviceAi.instance;

// ConditionalChain is native-only.
// Equivalent: use if/else branching.
String result;
if (inputText.length > 200) {
  final summary = await ai.summarize(inputText);
  result = summary.summary;
} else {
  final rewritten = await ai.rewrite(
    inputText,
    options: RewriteOptions(outputType: RewriteOutputType.elaborate),
  );
  result = rewritten.rewrittenText;
}
print(result);`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/framework_chain_conditional.mp4"
          caption="ConditionalChain — routing to Summarize or Rewrite based on text length"
        />
      </section>

      <section>
        <h2>5. Custom Chain</h2>
        <p>
          Build your own chain by implementing the <code>Chain</code> protocol.
          Define <code>name</code> and <code>invoke()</code> — that&apos;s it.
          Here&apos;s a sentiment analysis chain:
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

struct SentimentChain: Chain {
    let name = "SentimentChain"
    let model: any LocanaraModel

    func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let template = PromptTemplate.from(
            "Analyze the sentiment of the following text. " +
            "Reply with exactly one word: positive, negative, or neutral.\\n\\nText: {text}"
        )
        let chain = ModelChain(model: model, promptTemplate: template)
        return try await chain.invoke(input)
    }
}

// Use it like any built-in chain
let model = FoundationLanguageModel()
let result = try await SentimentChain(model: model)
    .invoke(ChainInput(text: "I love this framework!"))
print(result.text)  // "positive"`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.Chain
import com.locanara.composable.ModelChain
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.PromptTemplate

class SentimentChain : Chain {
    override val name = "SentimentChain"

    override suspend fun invoke(input: ChainInput): ChainOutput {
        val template = PromptTemplate.from(
            "Analyze the sentiment of the following text. " +
            "Reply with exactly one word: positive, negative, or neutral.\n\nText: {text}"
        )
        val chain = ModelChain(promptTemplate = template)
        return chain.invoke(input)
    }
}

// Use it like any built-in chain
val result = SentimentChain()
    .invoke(ChainInput(text = "I love this framework!"))
println(result.text)  // "positive"`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat } from 'expo-ondevice-ai'

// Custom chains are native-only (Swift/Kotlin).
// Equivalent: wrap logic in an async function.
async function analyzeSentiment(text: string): Promise<string> {
  const result = await chat(
    \`Analyze the sentiment of the following text. \` +
    \`Reply with exactly one word: positive, negative, or neutral.\n\nText: \${text}\`
  )
  return result.message
}

const sentiment = await analyzeSentiment('I love this framework!')
console.log(sentiment)  // "positive"`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

// Custom chains are native-only (Swift/Kotlin).
// Equivalent: wrap logic in an async function.
Future<String> analyzeSentiment(String text) async {
  final ai = FlutterOndeviceAi.instance;
  final result = await ai.chat(
    'Analyze the sentiment of the following text. '
    'Reply with exactly one word: positive, negative, or neutral.\n\nText: $text',
  );
  return result.message;
}

final sentiment = await analyzeSentiment('I love this framework!');
print(sentiment);  // "positive"`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/framework_chain_custom.mp4"
          caption="Custom Chain — SentimentChain analyzing text sentiment using the Chain protocol"
        />
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>Chain protocol</strong>: requires <code>name</code> and{" "}
            <code>invoke(ChainInput) -&gt; ChainOutput</code>
          </li>
          <li>
            <strong>ChainInput</strong>: has <code>text</code> and{" "}
            <code>metadata</code> dictionary
          </li>
          <li>
            <strong>ChainOutput</strong>: has <code>value</code>,{" "}
            <code>text</code>, <code>metadata</code>, and{" "}
            <code>processingTimeMs</code>
          </li>
          <li>
            <strong>Sequential</strong>: output flows into next chain&apos;s
            input
          </li>
          <li>
            <strong>Parallel</strong>: all chains run concurrently, results in{" "}
            <code>metadata</code>
          </li>
          <li>
            <strong>Conditional</strong>: routes to branches based on a
            condition function
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/model", label: "Model" }}
        next={{ to: "/docs/tutorials/pipeline", label: "Pipeline" }}
      />
    </div>
  );
}

export default ChainTutorial;
