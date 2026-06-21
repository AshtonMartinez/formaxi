import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gradient" | "accent";
  padding?: "default" | "compact" | "none";
}

export function Card({
  variant = "default",
  padding = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border overflow-hidden",
        variant === "default" && "bg-surface",
        variant === "gradient" && "bg-gradient-to-r from-surface-alt to-surface",
        variant === "accent" && "bg-gradient-to-br from-[#13261a] to-surface border-accent/[0.18]",
        padding === "default" && "p-5",
        padding === "compact" && "p-4",
        padding === "none" && "",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mb-3.5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-heading font-extrabold text-[15px]",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}
