"use client";

/**
 * Shadcn-style primitives on a black + purple theme.
 * Exported names are kept stable so pages don't need import changes.
 */
import { ReactNode, InputHTMLAttributes, ButtonHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("panel rounded-2xl", className)}>{children}</div>;
}

export function GlassInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={cn(
        "field w-full rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-400",
        className
      )}
    />
  );
}

export function GlassTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={cn(
        "field w-full rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-400",
        className
      )}
    />
  );
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={cn(
        "btn-solid inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white",
        className
      )}
    />
  );
}

export function GhostButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={cn(
        "btn-ghost inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-200 hover:text-white",
        className
      )}
    />
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-violet-400/40 bg-violet-500/20 px-2 py-0.5 text-[11px] font-medium text-violet-200">
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
    </div>
  );
}

/** Small uppercase section label, shadcn "muted" style. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-400/80">
      {children}
    </p>
  );
}
