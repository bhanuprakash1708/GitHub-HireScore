"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<string, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-slate-900 shadow-sm shadow-slate-900/10",
  outline:
    "border border-border bg-background hover:bg-slate-100 text-foreground",
  ghost: "hover:bg-slate-100 text-foreground"
};

const sizes: Record<string, string> = {
  sm: "h-8 px-3",
  md: "h-10 px-4",
  lg: "h-11 px-6"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          isLoading && "cursor-wait opacity-75",
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <span className="mr-2 h-3 w-3 animate-spin rounded-full border-[2px] border-slate-200 border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

