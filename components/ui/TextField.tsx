import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id"
> & {
  id?: string;
  label: string;
  description?: ReactNode;
  inputClassName?: string;
  inputRef?: Ref<HTMLInputElement>;
};

/** Keep the label, input and optional help text connected for accessibility. */
export function TextField({
  id,
  label,
  description,
  inputClassName,
  inputRef,
  className,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const describedBy = [inputProps["aria-describedby"], descriptionId]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={["ui-field", className].filter(Boolean).join(" ")}>
      <label className="ui-field-label" htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={inputRef}
        {...inputProps}
        id={inputId}
        className={["ui-input", inputClassName].filter(Boolean).join(" ")}
        aria-describedby={describedBy || undefined}
      />
      {description && (
        <p className="ui-field-description" id={descriptionId}>
          {description}
        </p>
      )}
    </div>
  );
}
