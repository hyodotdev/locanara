import { type ReactNode } from "react";
import { Info, AlertTriangle, Lightbulb, AlertCircle } from "lucide-react";

type CalloutType = "info" | "warning" | "tip" | "danger";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

const icons = {
  info: Info,
  warning: AlertTriangle,
  tip: Lightbulb,
  danger: AlertCircle,
};

const defaultTitles = {
  info: "Note",
  warning: "Warning",
  tip: "Tip",
  danger: "Caution",
};

export function Callout({ type = "info", title, children }: CalloutProps) {
  const Icon = icons[type];
  const displayTitle = title || defaultTitles[type];

  return (
    <div className={`callout callout-${type}`}>
      <div className="callout-header">
        <Icon size={18} className="callout-icon" />
        <span className="callout-title">{displayTitle}</span>
      </div>
      <div className="callout-content">{children}</div>
    </div>
  );
}

export default Callout;
