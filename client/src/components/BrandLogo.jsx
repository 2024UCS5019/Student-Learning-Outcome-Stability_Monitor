const BrandLogo = ({ size = 36, className = "", label = "Outcome Monitor" }) => {
  const dimension = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}
      style={{ width: dimension, height: dimension }}
      aria-label={label}
      role="img"
    >
      <svg viewBox="0 0 64 64" className="h-[72%] w-[72%]">
        <defs>
          <linearGradient id="somArc" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0ea5e9" />
            <stop offset="0.55" stopColor="#2563eb" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
        </defs>

        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke="url(#somArc)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="134 42"
          strokeDashoffset="16"
        />

        <text
          x="16"
          y="40"
          fill="#0f172a"
          fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
          fontSize="22"
          fontWeight="800"
          letterSpacing="1.2"
        >
          OM
        </text>
      </svg>
    </div>
  );
};

export default BrandLogo;
