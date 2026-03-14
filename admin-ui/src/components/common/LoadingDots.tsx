import React from "react";

type LoadingDotsSize = "sm" | "md" | "lg";

type LoadingDotsProps = {
  className?: string;
  fullscreen?: boolean;
  label?: string;
  size?: LoadingDotsSize;
};

const sizeMap: Record<LoadingDotsSize, number> = {
  sm: 6,
  md: 8,
  lg: 10,
};

export default function LoadingDots({
  className,
  fullscreen = true,
  label = "Loading",
  size = "md",
}: LoadingDotsProps) {
  const dotSize = sizeMap[size];
  const wrapperClassName = [
    fullscreen ? "loading-dots-fullscreen" : "loading-dots-center",
    "text-brand-500 dark:text-brand-400",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClassName} role="status" aria-live="polite" aria-label={label}>
      <span
        className="loading-dots"
        style={{ "--loading-dot-size": `${dotSize}px` } as React.CSSProperties}
      >
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </span>
    </div>
  );
}
