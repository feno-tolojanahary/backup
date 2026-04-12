"use client";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [menuStyles, setMenuStyles] = useState<React.CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    visibility: "hidden",
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".dropdown-toggle")
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const updatePosition = () => {
    const anchorParent = anchorRef.current?.parentElement ?? null;
    const toggle = anchorParent?.querySelector<HTMLElement>(".dropdown-toggle");
    const rect = (toggle ?? anchorRef.current)?.getBoundingClientRect();

    if (!rect) return;

    setMenuStyles({
      position: "fixed",
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
      left: "auto",
      visibility: "visible",
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div
      ref={dropdownRef}
      style={menuStyles}
      className={`z-40 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${className}`}
    >
      {children}
    </div>
  );

  if (typeof document === "undefined") {
    return (
      <>
        <span ref={anchorRef} className="absolute h-0 w-0" aria-hidden="true" />
        {content}
      </>
    );
  }

  return (
    <>
      <span ref={anchorRef} className="absolute h-0 w-0" aria-hidden="true" />
      {createPortal(content, document.body)}
    </>
  );
};
