import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionProps {
  title: string | ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  variant?: "info" | "tip" | "warning" | "neutral";
}

const variantStyles = {
  info: {
    container:
      "border border-blue-200 dark:border-blue-500/20 border-l-4 border-l-blue-500 dark:border-l-blue-400 bg-blue-50/50 dark:bg-blue-500/10 rounded",
    icon: "text-blue-500 dark:text-blue-400",
  },
  tip: {
    container:
      "border border-green-200 dark:border-green-500/20 border-l-4 border-l-green-500 dark:border-l-green-400 bg-green-50/50 dark:bg-green-500/10 rounded",
    icon: "text-green-500 dark:text-green-400",
  },
  warning: {
    container:
      "border border-yellow-200 dark:border-yellow-500/20 border-l-4 border-l-yellow-500 dark:border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-500/10 rounded",
    icon: "text-yellow-500 dark:text-yellow-400",
  },
  neutral: {
    container:
      "border border-primary/10 dark:border-white/10 bg-background-secondary dark:bg-background-dark-secondary rounded-md",
    icon: "text-text-secondary dark:text-text-dark-secondary",
  },
};

function Accordion({
  title,
  children,
  defaultOpen = false,
  variant = "info",
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const styles = variantStyles[variant];

  return (
    <div className={`my-6 overflow-hidden ${styles.container}`}>
      <button
        className="w-full flex items-center justify-between p-4 bg-transparent border-none cursor-pointer text-left hover:opacity-90 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-text-primary dark:text-text-dark-primary flex items-center gap-2">
          {typeof title === "string" ? title : <>{title}</>}
        </span>
        <span
          className={`flex items-center transition-transform duration-200 ${styles.icon} ${isOpen ? "rotate-180" : ""}`}
        >
          <ChevronDown size={16} />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 text-text-secondary dark:text-text-dark-secondary text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Accordion;
