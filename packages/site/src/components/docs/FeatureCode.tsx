import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface FeatureCodeProps {
  code: string;
}

function FeatureCode({ code }: FeatureCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Simple syntax highlighting for JavaScript/TypeScript
  const highlightCode = (text: string) => {
    return (
      text
        // Comments
        .replace(/(\/\/[^\n]*)/g, '<span class="token comment">$1</span>')
        // Strings
        .replace(/('[^']*')/g, '<span class="token string">$1</span>')
        // Keywords
        .replace(
          /\b(import|from|await|async|const|let|var|function)\b/g,
          '<span class="token keyword">$1</span>'
        )
        // Function names
        .replace(
          /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
          '<span class="token function">$1</span>'
        )
        // Properties
        .replace(
          /\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
          '.<span class="token property">$1</span>'
        )
    );
  };

  return (
    <div className="code-block-wrapper">
      <button
        className={`code-block-badge ${copied ? "copied" : ""}`}
        onClick={() => void handleCopy()}
        title={copied ? "Copied!" : "Copy to clipboard"}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre className="code-block">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
      </pre>
    </div>
  );
}

export default FeatureCode;
