/**
 * Input: text field with label + status message. See
 * docs/design-system.md#input for the state contract (default,
 * hover, focus, filled, error, success, disabled).
 */

import { useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type InputProps = ComponentPropsWithoutRef<"input"> & {
  label?: ReactNode;
  status?: "error" | "success";
  message?: ReactNode;
};

export default function Input({
  label,
  id,
  status,
  message,
  disabled = false,
  className = "",
  ...rest
}: InputProps) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const messageId = message ? `${fieldId}-message` : undefined;

  const classes = [
    "field",
    status === "error" ? "field--error" : "",
    status === "success" ? "field--success" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {label && (
        <label className="field__label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <input
        id={fieldId}
        className="field__control"
        disabled={disabled}
        aria-invalid={status === "error" || undefined}
        aria-describedby={messageId}
        {...rest}
      />
      {message && (
        <span id={messageId} className="field__message">
          {message}
        </span>
      )}
    </div>
  );
}
