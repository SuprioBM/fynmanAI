import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-4 py-4 rounded-lg focus:outline-none focus:border-primary transition-colors text-body-md",
        className
      )}
      {...props}
    />
  );
}
