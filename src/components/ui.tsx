"use client";

import { ReactNode, InputHTMLAttributes, ButtonHTMLAttributes, TextareaHTMLAttributes } from "react";

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass rounded-2xl ${className}`}>{children}</div>;
}

export function GlassInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`glass-input w-full rounded-xl px-4 py-2.5 text-sm text-purple-50 placeholder-purple-300/40 ${className}`}
    />
  );
}

export function GlassTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`glass-input w-full rounded-xl px-4 py-2.5 text-sm text-purple-50 placeholder-purple-300/40 ${className}`}
    />
  );
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 ${className}`}
    />
  );
}

export function GhostButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`glass rounded-xl px-4 py-2 text-sm font-medium text-purple-100 hover:bg-white/10 transition ${className}`}
    />
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-purple-500/20 border border-purple-400/30 px-2.5 py-0.5 text-xs text-purple-200">
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
    </div>
  );
}
