import { ChevronDown, Lock } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function IconButton({
  label,
  active,
  onClick,
  disabled,
  children,
  className,
  size = 28,
}: {
  label: string;
  active?: boolean;
  onClick?: (() => void) | undefined;
  disabled?: boolean | undefined;
  children: ReactNode;
  className?: string;
  size?: number;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[4px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-accent/20 text-accent-2"
          : "text-txt-dim hover:bg-surface-2 hover:text-txt-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PanelSectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[11px] font-semibold tracking-[0.06em] text-txt">{children}</h2>;
}

export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-[11px] text-txt-muted", className)}>{children}</span>;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accent = true,
  className,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      className={cn("grid gap-1 rounded-[5px] border border-line bg-surface p-[3px]", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt)}
            className={cn(
              "h-[26px] rounded-[4px] text-[11.5px] transition-colors",
              selected && accent
                ? "border border-accent/70 bg-accent/15 font-medium text-accent-2"
                : selected
                  ? "bg-surface-2 text-txt"
                  : "text-txt-muted hover:bg-surface-2/70 hover:text-txt",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function SliderControl({
  label,
  value,
  onChange,
  inline,
  min = 0,
  max = 100,
  format,
  labelWidth = 86,
  valueWidth = 38,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  inline?: boolean;
  min?: number;
  max?: number;
  format?: (v: number) => string;
  labelWidth?: number;
  valueWidth?: number;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  const display = format ? format(value) : `${value}%`;
  const track = (
    <div className="relative flex h-4 flex-1 items-center">
      <div className="h-[3px] w-full rounded-full bg-line-strong" />
      <div
        className="absolute left-0 h-[3px] rounded-full bg-accent"
        style={{ width: `${pct}%` }}
      />
      <div
        className="pointer-events-none absolute size-[11px] -translate-x-1/2 rounded-full bg-accent-2 ring-2 ring-app/60"
        style={{ left: `${pct}%` }}
      />
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        aria-valuetext={display}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
      />
    </div>
  );

  if (inline) {
    return (
      <div className="flex items-center gap-3">
        <label
          htmlFor={id}
          style={{ width: labelWidth }}
          className="shrink-0 text-[11px] text-txt-muted"
        >
          {label}
        </label>
        {track}
        <span style={{ width: valueWidth }} className="shrink-0 text-right text-[11px] text-txt">
          {display}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-[6px]">
      <label htmlFor={id} className="block text-[11px] text-txt-muted">
        {label}
      </label>
      <div className="flex items-center gap-3">
        {track}
        <span style={{ width: valueWidth }} className="shrink-0 text-right text-[11px] text-txt">
          {display}
        </span>
      </div>
    </div>
  );
}

export function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[18px] w-[34px] shrink-0 rounded-full transition-colors",
        checked ? "bg-accent" : "bg-line-strong",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] size-[14px] rounded-full bg-white transition-all",
          checked ? "left-[18px]" : "left-[2px]",
        )}
      />
    </button>
  );
}

export function Select({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-[30px] items-center rounded-[4px] border border-line bg-surface px-[10px]",
        className,
      )}
    >
      <span className="text-[11.5px] text-txt">{value}</span>
      <ChevronDown className="ml-auto size-[13px] text-txt-dim" />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export function NumberField({
  label,
  prefix,
  value,
  onChange,
}: {
  label: string;
  prefix?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex h-[26px] items-center gap-[6px] rounded-[4px] border border-line bg-surface px-[8px]">
      {prefix ? <span className="text-[10.5px] text-txt-dim">{prefix}</span> : null}
      <input
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-[11.5px] text-txt outline-none"
      />
    </div>
  );
}

export function LockToggle() {
  const [locked, setLocked] = useState(true);
  return (
    <IconButton
      label="Lock scale ratio"
      active={locked}
      onClick={() => setLocked(!locked)}
      size={22}
    >
      <Lock className="size-[13px]" />
    </IconButton>
  );
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-line px-[14px] py-[11px]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-[6px] text-left"
      >
        <ChevronDown
          className={cn("size-[13px] text-txt-dim transition-transform", !open && "-rotate-90")}
        />
        <span className="text-[12px] font-semibold text-txt">{title}</span>
      </button>
      {open ? <div className="mt-[10px]">{children}</div> : null}
    </section>
  );
}
