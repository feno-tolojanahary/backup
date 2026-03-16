import ReactSelect, { type SelectInstance } from "react-select";
import React, { useEffect, useMemo, useState, forwardRef } from "react";

export interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange?: (value: string | string[] | null) => void;
  onChangeOption?: (valueOption: Option | Option[] | null) => void;
  onBlur?: (e: React.FocusEvent<HTMLElement>) => void;
  className?: string;
  defaultValue?: string | string[];
  value?: string | string[];
  name?: string;
  disabled?: boolean;
  isMulti?: boolean;
}

const Select = forwardRef<SelectInstance<Option, boolean>, SelectProps>(
  (
    {
      options,
      placeholder = "Select an option",
      onChange,
      onChangeOption,
      onBlur,
      className = "",
      defaultValue = "",
      value,
      name,
      disabled = false,
      isMulti = false,
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [selectedValue, setSelectedValue] = useState<string | string[]>(defaultValue);

    useEffect(() => {
      if (!isControlled) {
        setSelectedValue(defaultValue);
      }
    }, [defaultValue, isControlled]);

    const resolvedValue = isControlled ? value : selectedValue;
    const selectedOption = useMemo(() => {
      if (isMulti) {
        const values = Array.isArray(resolvedValue) ? resolvedValue : [];
        return options.filter((option) => values.includes(option.value));
      }

      const singleValue = Array.isArray(resolvedValue) ? "" : resolvedValue;
      return options.find((option) => option.value === singleValue) ?? null;
    }, [isMulti, options, resolvedValue]);

    const handleChange = (next: Option | Option[] | null) => {
      if (typeof onChangeOption === "function")
        onChangeOption(next);
      if (isMulti) {
        const nextValues = Array.isArray(next) ? next.map((option) => option.value) : [];
        if (!isControlled) {
          setSelectedValue(nextValues);
        }
        onChange?.(nextValues);
        
        return;
      }

      const nextValue = next ? next.value : null;
      if (!isControlled) {
        setSelectedValue(nextValue ?? "");
      }
      onChange?.(nextValue);
    };

  return (
    <ReactSelect
      ref={ref}
      isMulti={isMulti}
      options={options}
      placeholder={placeholder}
      onChange={handleChange}
      onBlur={onBlur}
      isDisabled={disabled}
      name={name}
      value={selectedOption}
      className={`w-full ${className}`}
      classNames={{
        control: (state) =>
          [
            "min-h-11 rounded-lg border px-2 text-sm shadow-theme-xs",
            "bg-white text-gray-800 placeholder:text-gray-400",
            "dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30",
            state.isFocused
              ? "border-brand-300 ring-3 ring-brand-500/10 dark:border-brand-800"
              : "border-gray-300",
            disabled ? "opacity-60" : "",
          ].join(" "),
        valueContainer: () => "px-2 py-1",
        placeholder: () => "text-gray-400 dark:text-gray-400",
        singleValue: () => "text-gray-800 dark:text-white/90",
        multiValue: () =>
          "rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-white/90",
        multiValueLabel: () => "px-2 py-1",
        multiValueRemove: () =>
          "rounded-r-md px-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700",
        indicatorsContainer: () => "pr-1",
        indicatorSeparator: () => "bg-gray-200 dark:bg-gray-700",
        dropdownIndicator: (state) =>
          [
            "text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-white/90",
            state.isFocused ? "text-gray-600 dark:text-white/90" : "",
          ].join(" "),
        clearIndicator: () =>
          "text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-white/90",
        menu: () =>
          "mt-2 rounded-lg border border-gray-200 bg-white shadow-theme-xs dark:border-gray-700 dark:bg-gray-900",
        option: (state) =>
          [
            "cursor-pointer px-4 py-2 text-sm",
            state.isSelected
              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-white/90"
              : state.isFocused
              ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white/90"
              : "text-gray-700 dark:text-gray-300",
          ].join(" "),
        noOptionsMessage: () => "px-4 py-2 text-sm text-gray-500 dark:text-gray-400",
        input: () => "text-gray-800 dark:text-white/90",
      }}
    />
  );
  }
);

Select.displayName = "Select";

export default Select;
