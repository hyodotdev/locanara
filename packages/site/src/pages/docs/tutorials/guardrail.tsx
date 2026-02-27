import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function GuardrailTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Guardrail Tutorial"
        description="Learn how to validate input and filter output with InputLengthGuardrail, ContentFilterGuardrail, and GuardedChain."
        path="/docs/tutorials/guardrail"
        keywords="Guardrail, InputLengthGuardrail, ContentFilterGuardrail, GuardedChain, safety, validation, Locanara"
      />
      <h1>Guardrail</h1>
      <p>
        Guardrails validate input before it reaches the model and check output
        before it returns to the user. Wrap any chain with guardrails to enforce
        length limits, block sensitive content, or apply custom validation
        rules.
      </p>

      <section>
        <h2>1. InputLengthGuardrail</h2>
        <p>
          Enforces a maximum character limit on input. Choose between blocking
          (reject) or truncating (silently trim) inputs that exceed the limit.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

// Block if input exceeds 500 characters
let guardrail = InputLengthGuardrail(maxCharacters: 500, truncate: false)
let result = try await guardrail.checkInput(ChainInput(text: longText))

switch result {
case .passed:
    print("Input is within limits")
case .blocked(let reason):
    print("Blocked: \\(reason)")
    // "Input exceeds maximum length of 500 characters"
case .modified(let newText, let reason):
    print("Modified: \\(reason), new text: \\(newText)")
}

// Or truncate silently instead of blocking
let truncating = InputLengthGuardrail(maxCharacters: 500, truncate: true)
// Returns .modified(truncatedText, "Input truncated from 800 to 500 characters")`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.InputLengthGuardrail
import com.locanara.core.ChainInput

// Block if input exceeds 500 characters
val guardrail = InputLengthGuardrail(maxCharacters = 500, truncate = false)
val result = guardrail.checkInput(ChainInput(text = longText))

when (result) {
    is GuardrailResult.Passed -> println("Input is within limits")
    is GuardrailResult.Blocked -> println("Blocked: \${result.reason}")
    is GuardrailResult.Modified -> println("Modified: \${result.reason}")
}

// Or truncate silently instead of blocking
val truncating = InputLengthGuardrail(maxCharacters = 500, truncate = true)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `// Guardrails are native-only (Swift/Kotlin).
// Equivalent: validate input before calling API.

function validateLength(text: string, maxChars: number): string | null {
  if (text.length > maxChars) {
    return \`Input exceeds maximum length of \${maxChars} characters\`
  }
  return null  // passed
}

const error = validateLength(inputText, 500)
if (error) {
  console.log('Blocked:', error)
} else {
  const result = await summarize(inputText)
  console.log(result.summary)
}`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `// Guardrails are native-only (Swift/Kotlin).
// Equivalent: validate input before calling API.

String? validateLength(String text, int maxChars) {
  if (text.length > maxChars) {
    return 'Input exceeds maximum length of $maxChars characters';
  }
  return null;  // passed
}

final error = validateLength(inputText, 500);
if (error != null) {
  print('Blocked: $error');
} else {
  final ai = FlutterOndeviceAi.instance;
  final result = await ai.summarize(inputText);
  print(result.summary);
}`,
            },
          ]}
        />
      </section>

      <section>
        <h2>2. ContentFilterGuardrail</h2>
        <p>
          Blocks input that contains any of the specified patterns. Use this to
          prevent sensitive data (passwords, SSNs, credit card numbers) from
          being sent to the model.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let guardrail = ContentFilterGuardrail(
    blockedPatterns: ["password", "SSN", "credit card"]
)

// This will be blocked
let result = try await guardrail.checkInput(
    ChainInput(text: "My password is abc123")
)
// result is .blocked("Input contains blocked content")

// This will pass
let safeResult = try await guardrail.checkInput(
    ChainInput(text: "Tell me about on-device AI")
)
// safeResult is .passed`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.ContentFilterGuardrail

val guardrail = ContentFilterGuardrail(
    blockedPatterns = listOf("password", "SSN", "credit card")
)

// This will be blocked
val result = guardrail.checkInput(
    ChainInput(text = "My password is abc123")
)
// result is Blocked("Input contains blocked content")

// This will pass
val safeResult = guardrail.checkInput(
    ChainInput(text = "Tell me about on-device AI")
)
// safeResult is Passed`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `// Equivalent: check for blocked patterns before calling API.
const blockedPatterns = ['password', 'SSN', 'credit card']

function checkContent(text: string): string | null {
  const lower = text.toLowerCase()
  for (const pattern of blockedPatterns) {
    if (lower.includes(pattern.toLowerCase())) {
      return 'Input contains blocked content'
    }
  }
  return null  // passed
}

const blocked = checkContent('My password is abc123')
if (blocked) {
  console.log('Blocked:', blocked)
}`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `// Equivalent: check for blocked patterns before calling API.
const blockedPatterns = ['password', 'SSN', 'credit card'];

String? checkContent(String text) {
  final lower = text.toLowerCase();
  for (final pattern in blockedPatterns) {
    if (lower.contains(pattern.toLowerCase())) {
      return 'Input contains blocked content';
    }
  }
  return null;  // passed
}

final blocked = checkContent('My password is abc123');
if (blocked != null) {
  print('Blocked: $blocked');
}`,
            },
          ]}
        />
      </section>

      <section>
        <h2>3. GuardedChain</h2>
        <p>
          Wraps any chain with a list of guardrails. Input guardrails run before
          the chain. If any guardrail blocks, the chain is skipped and an error
          is thrown.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let guardrails: [any Guardrail] = [
    InputLengthGuardrail(maxCharacters: 500, truncate: false),
    ContentFilterGuardrail(blockedPatterns: ["password", "SSN"])
]
let guarded = GuardedChain(
    chain: SummarizeChain(),
    guardrails: guardrails
)

do {
    let result = try await guarded.invoke(ChainInput(text: inputText))
    print(result.text)  // Summarized safely
} catch let error as LocanaraError {
    if case .invalidInput(let reason) = error {
        print("Blocked: \\(reason)")
    }
}`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.GuardedChain
import com.locanara.composable.InputLengthGuardrail
import com.locanara.composable.ContentFilterGuardrail
import com.locanara.builtin.SummarizeChain

val guardrails = listOf(
    InputLengthGuardrail(maxCharacters = 500, truncate = false),
    ContentFilterGuardrail(blockedPatterns = listOf("password", "SSN"))
)
val guarded = GuardedChain(
    chain = SummarizeChain(),
    guardrails = guardrails
)

try {
    val result = guarded.invoke(ChainInput(text = inputText))
    println(result.text)  // Summarized safely
} catch (e: IllegalArgumentException) {
    println("Blocked: \${e.message}")
}`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { summarize } from 'expo-ondevice-ai'

// GuardedChain is native-only.
// Equivalent: validate before calling the API.
function guard(text: string): string | null {
  if (text.length > 500) return 'Input too long'
  if (/password|SSN/i.test(text)) return 'Contains blocked content'
  return null
}

const blocked = guard(inputText)
if (blocked) {
  console.log('Blocked:', blocked)
} else {
  const result = await summarize(inputText)
  console.log(result.summary)
}`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

// GuardedChain is native-only.
// Equivalent: validate before calling the API.
String? guard(String text) {
  if (text.length > 500) return 'Input too long';
  if (RegExp(r'password|SSN', caseSensitive: false).hasMatch(text)) {
    return 'Contains blocked content';
  }
  return null;
}

final blocked = guard(inputText);
if (blocked != null) {
  print('Blocked: $blocked');
} else {
  final ai = FlutterOndeviceAi.instance;
  final result = await ai.summarize(inputText);
  print(result.summary);
}`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/framework_guardrail.mp4"
          caption="GuardedChain — text exceeding length limit blocked, content filter catching sensitive patterns"
        />
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>GuardrailResult</strong> has three cases:{" "}
            <code>.passed</code>, <code>.blocked(reason)</code>,{" "}
            <code>.modified(newText, reason)</code>
          </li>
          <li>
            <strong>InputLengthGuardrail</strong>: enforce character limits with
            block or truncate mode
          </li>
          <li>
            <strong>ContentFilterGuardrail</strong>: block input matching
            sensitive patterns
          </li>
          <li>
            <strong>GuardedChain</strong>: wraps any chain with a list of
            guardrails — input checked before, output checked after
          </li>
          <li>
            Blocked inputs throw <code>LocanaraError.invalidInput</code> (Swift)
            / <code>IllegalArgumentException</code> (Kotlin)
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/memory", label: "Memory" }}
        next={{ to: "/docs/tutorials/session", label: "Session" }}
      />
    </div>
  );
}

export default GuardrailTutorial;
