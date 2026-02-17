import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import type { Components } from "react-markdown";

interface ContentRendererProps {
  content: string;
  className?: string;
}

// Transform @mentions in text content to clickable links
function processTextWithMentions(text: string): React.ReactNode[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the mention link
    const username = match[1];
    parts.push(
      <Link
        key={`${match.index}-${username}`}
        to={`/profile/${username}`}
        className="text-accent hover:underline font-medium"
      >
        @{username}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// Custom text renderer that handles mentions
function TextWithMentions({ children }: { children: React.ReactNode }) {
  if (typeof children === "string") {
    return <>{processTextWithMentions(children)}</>;
  }

  if (Array.isArray(children)) {
    return (
      <>
        {children.map((child, index) =>
          typeof child === "string" ? (
            <span key={index}>{processTextWithMentions(child)}</span>
          ) : (
            child
          )
        )}
      </>
    );
  }

  return <>{children}</>;
}

// Custom markdown components with mention support
const markdownComponents: Partial<Components> = {
  p: ({ children }) => (
    <p>
      <TextWithMentions>{children}</TextWithMentions>
    </p>
  ),
  li: ({ children }) => (
    <li>
      <TextWithMentions>{children}</TextWithMentions>
    </li>
  ),
  td: ({ children }) => (
    <td>
      <TextWithMentions>{children}</TextWithMentions>
    </td>
  ),
  th: ({ children }) => (
    <th>
      <TextWithMentions>{children}</TextWithMentions>
    </th>
  ),
};

export function ContentRenderer({
  content,
  className = "",
}: ContentRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Simple text renderer for non-markdown content (like comments)
export function TextRenderer({
  content,
  className = "",
}: ContentRendererProps) {
  const lines = content.split("\n");

  return (
    <div className={className}>
      {lines.map((line, index) => (
        <span key={index}>
          {processTextWithMentions(line)}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}
