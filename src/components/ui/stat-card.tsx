import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  label: string;
  valueColor?: string;
  className?: string;
}

export function StatCard({ value, label, valueColor, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-[14px] p-[18px]",
        className,
      )}
    >
      <div
        className="font-heading font-black text-[28px]"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      <div className="text-xs text-dim mt-[3px]">{label}</div>
    </div>
  );
}

interface StatInlineProps {
  value: string | number;
  label: string;
  valueColor?: string;
}

export function StatInline({ value, label, valueColor }: StatInlineProps) {
  return (
    <div className="text-center">
      <div
        className="font-heading font-extrabold text-[26px]"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      <div className="text-[11px] text-dim uppercase tracking-[0.6px] font-semibold">
        {label}
      </div>
    </div>
  );
}
