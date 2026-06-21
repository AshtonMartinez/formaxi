import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "yellow" | "orange" | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-accent/[0.14] text-accent",
  red: "bg-loss/[0.16] text-loss",
  yellow: "bg-draw/[0.16] text-draw",
  orange: "bg-[rgba(255,106,61,0.16)] text-orange",
  neutral: "bg-white/[0.07] text-muted",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

export function Badge({
  variant = "green",
  size = "sm",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-bold rounded-full",
        variantStyles[variant],
        size === "sm" && "text-[11px] px-2.5 py-1",
        size === "md" && "text-xs px-3 py-1",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
