import { useState } from "react";
import CodeBlock from "./CodeBlock";

interface Tab {
  label: string;
  language: "swift" | "kotlin" | "typescript" | "dart" | "bash" | "text";
  code: string;
}

interface CodeTabsProps {
  tabs: Tab[];
}

function CodeTabs({ tabs }: CodeTabsProps) {
  const [active, setActive] = useState(0);

  if (tabs.length === 0) return null;
  if (tabs.length === 1) {
    return <CodeBlock language={tabs[0].language}>{tabs[0].code}</CodeBlock>;
  }

  return (
    <div className="code-tabs">
      <div className="code-tabs-bar">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            className={`code-tabs-btn ${i === active ? "active" : ""}`}
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <CodeBlock language={tabs[active].language}>
        {tabs[active].code}
      </CodeBlock>
    </div>
  );
}

export default CodeTabs;
