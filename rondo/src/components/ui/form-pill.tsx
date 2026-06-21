import { cn } from "@/lib/utils";
import type { FormResult } from "@/lib/types";

const resultStyles: Record<FormResult, string> = {
  W: "bg-accent",
  D: "bg-draw",
  L: "bg-loss",
};

interface FormPillProps {
  result: FormResult;
}

export function FormPill({ result }: FormPillProps) {
  return (
    <span
      className={cn(
        "w-[18px] h-[18px] rounded-[5px] flex items-center justify-center",
        "text-[10px] font-heading font-extrabold text-[#07140c]",
        resultStyles[result],
      )}
    >
      {result}
    </span>
  );
}

interface FormSequenceProps {
  results: FormResult[];
}

export function FormSequence({ results }: FormSequenceProps) {
  return (
    <div className="flex gap-1">
      {results.map((r, i) => (
        <FormPill key={i} result={r} />
      ))}
    </div>
  );
}
