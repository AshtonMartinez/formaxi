"use client";

import { useEffect } from "react";
import { Card } from "./card";
import { CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className={cn("relative z-10 w-full max-w-[480px]", className)}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-extrabold text-[17px] tracking-[-0.3px]">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary transition-colors hover:bg-white/[0.06] cursor-pointer"
          >
            <CloseIcon size={15} />
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}
