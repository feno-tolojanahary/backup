import React, { useEffect, useState, forwardRef } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  name?: string;
  disabled?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      placeholder = "Select an option",
      onChange,
      onBlur,
      className = "",
      defaultValue = "",
      value,
      name,
      disabled = false,
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [selectedValue, setSelectedValue] = useState<string>(defaultValue);

    useEffect(() => {
      if (!isControlled) {
        setSelectedValue(defaultValue);
      }
    }, [defaultValue, isControlled]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const nextValue = e.target.value;
      if (!isControlled) {
        setSelectedValue(nextValue);
      }
      onChange?.(nextValue); // Trigger parent handler
    };

    const resolvedValue = isControlled ? value : selectedValue;

  return (
    <select
      className={`h-11 w-full appearance-none rounded-lg border border-gray-300  px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
        resolvedValue
          ? "text-gray-800 dark:text-white/90"
          : "text-gray-400 dark:text-gray-400"
      } ${className}`}
      value={resolvedValue}
      onChange={handleChange}
      onBlur={onBlur}
      name={name}
      disabled={disabled}
      ref={ref}
    >
      {/* Placeholder option */}
      <option
        value=""
        disabled
        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {placeholder}
      </option>
      {/* Map over options */}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
  }
);

Select.displayName = "Select";

export default Select;
