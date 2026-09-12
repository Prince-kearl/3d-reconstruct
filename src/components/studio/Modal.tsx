import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  labelledBy,
  width = 700,
  children,
  className,
  showClose = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  labelledBy?: string;
  width?: number;
  children: ReactNode;
  className?: string;
  showClose?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    node
      ?.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      )
      ?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(
        node.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/55"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        style={{ width, maxWidth: "94vw", maxHeight: "92vh" }}
        className={cn(
          "scroll-thin relative flex max-h-[92vh] flex-col overflow-hidden overflow-y-auto rounded-[8px] border border-line-strong bg-panel shadow-[0_28px_70px_-20px_rgba(0,0,0,0.8)]",
          className,
        )}
      >
        {showClose ? (
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute right-[12px] top-[12px] z-10 text-txt-dim hover:text-txt"
          >
            <X className="size-[17px]" />
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
