import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      type="button"
      className={cn("button", `button-${variant}`, className)}
      {...props}
    />
  );
}
