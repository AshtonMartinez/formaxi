import Link from "next/link";
import { Card } from "./card";

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: string;
}

/** Centered placeholder shown when a page has no data to display yet. */
export function EmptyState({ title, message, actionLabel, actionHref, icon = "○" }: EmptyStateProps) {
  return (
    <Card className="mx-auto max-w-md text-center" padding="default">
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-elevated text-2xl text-dim">
          {icon}
        </div>
        <h2 className="font-heading text-lg font-extrabold tracking-[-0.3px]">{title}</h2>
        <p className="max-w-xs text-[13.5px] leading-[1.55] text-muted">{message}</p>
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-[11px] bg-accent px-5 py-2.5 text-[13px] font-extrabold text-accent-darker shadow-[0_6px_18px_rgba(52,224,127,0.28)] transition-all hover:bg-[#46ec8d]"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </Card>
  );
}
