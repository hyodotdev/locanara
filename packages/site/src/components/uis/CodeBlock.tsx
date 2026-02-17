import { Highlight, themes, Language } from "prism-react-renderer";

interface CodeBlockProps {
  code: string;
  language: Language;
  title?: string;
}

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-primary/10 dark:border-white/10">
      {title && (
        <div className="px-4 py-2 bg-primary/5 dark:bg-white/5 border-b border-primary/5 dark:border-white/5">
          <span className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary">
            {title}
          </span>
        </div>
      )}
      <Highlight theme={themes.nightOwl} code={code} language={language}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="p-4 text-sm overflow-x-auto !bg-[#011627]">
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
