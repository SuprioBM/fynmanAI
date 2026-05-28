import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const baseStyles =
  "w-full inline-flex items-center justify-center gap-2 rounded-lg text-label-md transition-all active:scale-[0.98]";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-container text-on-primary-container hover:brightness-110",
  outline:
    "border border-outline-variant text-on-surface-variant hover:border-primary hover:text-on-surface",
};

const spacing = "py-4 px-6";

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(baseStyles, spacing, variants[variant], className)}
      {...props}
    />
  );
}
