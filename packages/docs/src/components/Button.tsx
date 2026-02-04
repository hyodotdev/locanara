import { Link } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

interface ButtonAsButton extends ButtonBaseProps {
  as?: "button";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

interface ButtonAsLink extends ButtonBaseProps {
  as: "link";
  to: string;
}

interface ButtonAsAnchor extends ButtonBaseProps {
  as: "a";
  href: string;
  target?: "_blank" | "_self";
  rel?: string;
}

type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

const sizeClasses: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

/**
 * Unified Button component with proper dark mode support
 *
 * Usage:
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>Click me</Button>
 * <Button as="link" to="/docs" variant="secondary">Go to Docs</Button>
 * <Button as="a" href="https://github.com" target="_blank">GitHub</Button>
 * ```
 */
export default function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", children, className = "" } = props;

  const baseClasses =
    `btn btn-${variant} ${sizeClasses[size]} ${className}`.trim();

  if (props.as === "link") {
    return (
      <Link to={props.to} className={baseClasses}>
        {children}
      </Link>
    );
  }

  if (props.as === "a") {
    return (
      <a
        href={props.href}
        target={props.target}
        rel={props.target === "_blank" ? "noopener noreferrer" : props.rel}
        className={baseClasses}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={props.type || "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={baseClasses}
    >
      {children}
    </button>
  );
}
