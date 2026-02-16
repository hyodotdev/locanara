import type { ReactNode } from "react";

interface HighlightTextProps {
  children: ReactNode;
}

function HighlightText({ children }: HighlightTextProps) {
  return (
    <p className="inline-block px-3 py-2 text-sm rounded-md bg-yellow-400/15 border border-yellow-400/30 text-text-primary dark:text-text-dark-primary">
      {children}
    </p>
  );
}

export default HighlightText;
