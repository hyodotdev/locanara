import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            "rounded-lg bg-background-secondary dark:bg-background-dark-secondary",
            "border border-primary/5 dark:border-white/5",
            "shadow-subtle",
            hoverable &&
              "transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-card cursor-pointer",
            className
          )
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
