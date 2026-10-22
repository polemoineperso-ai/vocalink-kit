"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Message bref en bas d'écran après une action (« Fait : … », « Reportée à
 * lundi »), avec « Annuler » quand l'action est réversible : on agit vite
 * sans craindre de se tromper.
 */

type Toast = { id: number; message: string; undo?: () => void | Promise<void> };
type ShowToast = (message: string, undo?: Toast["undo"]) => void;

const ToastContext = createContext<ShowToast>(() => {});

const TOAST_DURATION_MS = 4500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number | null>(null);

  const show = useCallback<ShowToast>((message, undo) => {
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, undo });
    timer.current = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <div key={toast.id} className="toast" role="status" aria-live="polite">
          <span className="min-w-0 truncate">{toast.message}</span>
          {toast.undo ? (
            <button
              type="button"
              className="shrink-0 font-semibold text-brand"
              onClick={async () => {
                const undo = toast.undo;
                setToast(null);
                await undo?.();
              }}
            >
              Annuler
            </button>
          ) : null}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
