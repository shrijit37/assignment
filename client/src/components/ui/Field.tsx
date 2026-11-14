import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface FieldProps {
  label: string;
  /** Id of the control; omit for grouped inputs such as radio buttons. */
  htmlFor?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

const labelClasses = "flex items-center gap-1.5 text-xs font-semibold text-muted";

/** Label, control and validation message for a single form field. */
export function Field({ label, htmlFor, error, optional, className, children }: FieldProps) {
  const caption = (
    <>
      {label}
      {optional && <span className="font-normal text-muted/70">(optional)</span>}
    </>
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClasses}>
          {caption}
        </label>
      ) : (
        <p className={labelClasses}>{caption}</p>
      )}
      {children}
      {error && htmlFor && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Shared look for text inputs, date/time pickers and textareas. */
export const inputClasses =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-muted/70 focus:border-primary focus:bg-white disabled:opacity-60";

/** Adds a red border to an input that failed validation. */
export function invalidClasses(invalid: boolean): string {
  return invalid ? "border-danger/60 focus:border-danger" : "";
}
