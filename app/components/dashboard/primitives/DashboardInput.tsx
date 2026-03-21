"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type DashboardInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function DashboardInput({
  label,
  error,
  className = "",
  id,
  ...rest
}: DashboardInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="dash-label block">
          {label}
        </label>
      )}
      <input id={inputId} className={`dash-input ${className}`} {...rest} />
      {error && (
        <p className="mt-1 text-[11px] text-[var(--status-error)]">{error}</p>
      )}
    </div>
  );
}

type DashboardSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export function DashboardSelect({
  label,
  error,
  className = "",
  id,
  children,
  ...rest
}: DashboardSelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="dash-label block">
          {label}
        </label>
      )}
      <select id={selectId} className={`dash-input ${className}`} {...rest}>
        {children}
      </select>
      {error && (
        <p className="mt-1 text-[11px] text-[var(--status-error)]">{error}</p>
      )}
    </div>
  );
}

type DashboardTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function DashboardTextarea({
  label,
  error,
  className = "",
  id,
  ...rest
}: DashboardTextareaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div>
      {label && (
        <label htmlFor={textareaId} className="dash-label block">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`dash-input resize-y min-h-[80px] ${className}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-[11px] text-[var(--status-error)]">{error}</p>
      )}
    </div>
  );
}
