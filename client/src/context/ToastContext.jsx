import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";

export const ToastContext = createContext(null);

const defaultDurationMs = 3500;
const maxToasts = 4;

const now = () => Date.now();

const ToastViewport = ({ toasts, dismiss }) => {
  return (
    <div className="som-toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`som-toast som-toast--${t.type || "info"}`} role="status">
          <div className="som-toast__body">
            {t.title ? <div className="som-toast__title">{t.title}</div> : null}
            <div className="som-toast__msg">{t.message}</div>
          </div>
          <button
            type="button"
            className="som-toast__close"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const recentKeysRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = toast?.id || `${now()}_${Math.random().toString(16).slice(2)}`;
    const durationMs = Number.isFinite(toast?.durationMs) ? toast.durationMs : defaultDurationMs;
    const key = toast?.key;

    if (key) {
      const previousAt = recentKeysRef.current.get(key);
      if (previousAt && now() - previousAt < 2500) return;
      recentKeysRef.current.set(key, now());
    }

    setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, maxToasts));

    if (durationMs > 0) {
      window.setTimeout(() => dismiss(id), durationMs);
    }
  }, [dismiss]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e) => {
      const detail = e?.detail;
      if (!detail || typeof detail !== "object") return;
      push(detail);
    };

    window.addEventListener("som:toast", handler);
    return () => window.removeEventListener("som:toast", handler);
  }, [push]);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
};
