"use client";
import React, { useEffect, useMemo, useState } from "react";

type SwitchChangeEvent = {
  target: {
    name?: string;
    value: boolean;
    checked: boolean;
    type: "checkbox";
  };
};

interface SwitchProps {
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (value: boolean | SwitchChangeEvent) => void;
  name?: string;
  value?: boolean;
  color?: "blue" | "gray"; // Added prop to toggle color theme
}

const Switch: React.FC<SwitchProps> = ({
  label,
  defaultChecked = false,
  checked,
  disabled = false,
  onChange,
  name,
  value,
  color = "blue", // Default to blue color
}) => {
  const resolvedChecked = useMemo(() => {
    if (checked !== undefined) return checked;
    if (value !== undefined) return value;
    return undefined;
  }, [checked, value]);
  const isControlled = resolvedChecked !== undefined;
  const [isChecked, setIsChecked] = useState(defaultChecked);

  useEffect(() => {
    if (isControlled) {
      setIsChecked(Boolean(resolvedChecked));
    }
  }, [resolvedChecked, isControlled]);

  const handleToggle = () => {
    if (disabled) return;
    const newCheckedState = !isChecked;
    if (!isControlled) {
      setIsChecked(newCheckedState);
    }
    if (onChange) {
      if (name) {
        onChange({
          target: {
            name,
            value: newCheckedState,
            checked: newCheckedState,
            type: "checkbox",
          },
        });
      } else {
        onChange(newCheckedState);
      }
    }
  };

  const switchColors =
    color === "blue"
      ? {
          background: isChecked
            ? "bg-brand-500 "
            : "bg-gray-200 dark:bg-white/10", // Blue version
          knob: isChecked
            ? "translate-x-full bg-white"
            : "translate-x-0 bg-white",
        }
      : {
          background: isChecked
            ? "bg-gray-800 dark:bg-white/10"
            : "bg-gray-200 dark:bg-white/10", // Gray version
          knob: isChecked
            ? "translate-x-full bg-white"
            : "translate-x-0 bg-white",
        };

  return (
    <label
      className={`flex cursor-pointer select-none items-center gap-3 text-sm font-medium ${
        disabled ? "text-gray-400" : "text-gray-700 dark:text-gray-400"
      }`}
      onClick={handleToggle} // Toggle when the label itself is clicked
    >
      <div className="relative">
        <div
          className={`block transition duration-150 ease-linear h-6 w-11 rounded-full ${
            disabled
              ? "bg-gray-100 pointer-events-none dark:bg-gray-800"
              : switchColors.background
          }`}
        ></div>
        <div
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-theme-sm duration-150 ease-linear transform ${switchColors.knob}`}
        ></div>
      </div>
      {label}
    </label>
  );
};

export default Switch;
