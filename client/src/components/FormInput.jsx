const FormInput = ({ label, className = "", ...props }) => (
  <label className="flex flex-col gap-2 text-sm">
    <span className="text-slate-700">{label}</span>
    <input
      {...props}
      className={`w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 backdrop-blur focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 ${className}`}
    />
  </label>
);

export default FormInput;
