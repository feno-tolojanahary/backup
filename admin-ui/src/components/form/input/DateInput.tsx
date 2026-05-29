import React, { forwardRef } from "react";
import Input from "./InputField";

type DateInputProps = {
  id?: string;
  name?: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
  placeholder?: string;
  labelClassName?: string;
};

const DEFAULT_LABEL_CLASSES =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      id,
      name,
      label,
      value,
      defaultValue,
      onChange,
      min,
      max,
      disabled,
      error,
      hint,
      className,
      placeholder,
      labelClassName,
    },
    ref
  ) => {
    const input = (
      <Input
        ref={ref}
        id={id}
        name={name}
        type="date"
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        disabled={disabled}
        error={error}
        hint={hint}
        className={className}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
    );

    if (!label) return input;

    return (
      <div>
        <label
          htmlFor={id}
          className={labelClassName ?? DEFAULT_LABEL_CLASSES}
        >
          {label}
        </label>
        {input}
      </div>
    );
  }
);

DateInput.displayName = "DateInput";

export default DateInput;
