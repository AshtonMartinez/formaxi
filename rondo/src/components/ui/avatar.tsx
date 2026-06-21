import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  initials: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "rounded";
}

const sizeMap = {
  xs: "w-[18px] h-[18px] rounded-[5px] text-[9px]",
  sm: "w-7 h-7 rounded-lg text-[11px]",
  md: "w-10 h-10 rounded-xl text-sm",
  lg: "w-[52px] h-[52px] rounded-[14px] text-base",
  xl: "w-[68px] h-[68px] rounded-2xl text-[22px]",
};

export function Avatar({
  initials,
  color,
  size = "sm",
  shape = "rounded",
  className,
  ...props
}: AvatarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center font-heading font-extrabold text-white shrink-0",
        shape === "circle" && "!rounded-full",
        sizeMap[size],
        className,
      )}
      style={{ backgroundColor: color }}
      {...props}
    >
      {initials}
    </div>
  );
}
