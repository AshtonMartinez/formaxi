import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent-soft";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-darker font-extrabold shadow-[0_6px_18px_rgba(52,224,127,0.28)] hover:bg-[#46ec8d] hover:shadow-[0_6px_22px_rgba(52,224,127,0.45)]",
  secondary:
    "bg-white/[0.06] text-heading font-bold hover:bg-white/[0.10]",
  ghost:
    "bg-transparent text-muted font-semibold hover:bg-white/[0.04]",
  "accent-soft":
    "bg-accent/[0.12] text-accent font-bold hover:bg-accent hover:text-accent-darker",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[11px] transition-all cursor-pointer",
        variantStyles[variant],
        size === "sm" && "text-[13px] px-3.5 py-2",
        size === "md" && "text-sm px-5 py-3",
        size === "lg" && "text-sm px-6 py-3 w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
