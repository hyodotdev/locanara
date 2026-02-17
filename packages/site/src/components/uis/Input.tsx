import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={twMerge(
            clsx(
              "w-full px-3 py-2 text-sm rounded-md transition-colors duration-150",
              "bg-background-secondary dark:bg-background-dark-secondary",
              "border border-primary/10 dark:border-white/10",
              "text-text-primary dark:text-text-dark-primary",
              "placeholder:text-text-secondary/50 dark:placeholder:text-text-dark-secondary/50",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              error && "border-red-500 focus:ring-red-500",
              className
            )
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
