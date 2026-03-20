export const emitToast = (detail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("som:toast", { detail }));
};

