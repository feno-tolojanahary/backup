"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Alert from "@/components/ui/alert/Alert";

export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastInput = {
  variant: ToastVariant;
  title: string;
  message: string;
  durationMs?: number;
};

type ToastItem = ToastInput & { id: string };

type ToastContextType = {
  addToast: (toast: ToastInput) => void;
  removeToast: (id: string) => void;
  toastError: () => void;
  toastWarning: (message: string) => void;
  toastSuccess: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION_MS = 5000;

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((toast: ToastInput) => {
    const id = createToastId();
    const durationMs = toast.durationMs ?? DEFAULT_DURATION_MS;
    const item: ToastItem = { ...toast, id, durationMs };
    setToasts((prev) => [...prev, item]);

    if (durationMs > 0) {
      const timer = setTimeout(() => removeToast(id), durationMs);
      timersRef.current.set(id, timer);
    }
  }, [removeToast]);

  const toastError = () => {
    addToast({
      variant: "error",
      title: "Error",
      message: "Something went wrong. Please try again"
    })
  }

  const toastSuccess = (message: string) => {
    addToast({
      variant: "success",
      title: "Success",
      message
    })
  }

  const toastWarning = (message: string) => {
    addToast({
      variant: "warning",
      title: "Warning",
      message
    })
  }

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const contextValue = useMemo(() => ({ addToast, removeToast, toastError, toastSuccess, toastWarning }), [addToast, removeToast, toastError, toastSuccess, toastWarning]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed right-4 top-4 z-999999 w-[360px] max-w-[calc(100vw-2rem)] space-y-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="relative">
            <Alert variant={toast.variant} title={toast.title} message={toast.message} />
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="absolute right-3 top-3 rounded-md px-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
