import { useEffect } from "react";
import { createPortal } from "react-dom";

const Modal = ({ open, title, onClose, children, size = "md" }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const maxWidthClass =
    size === "sm" ? "max-w-lg" : size === "lg" ? "max-w-3xl" : "max-w-2xl";

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-3 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        className={`relative w-full ${maxWidthClass} rounded-3xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur`}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-semibold text-ink">{title}</h2> : null}
            <p className="mt-0.5 text-xs text-slate-500">Press Esc to close</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-press inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            aria-label="Close"
            title="Close"
          >
            <span aria-hidden="true">{"\u00D7"}</span>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

