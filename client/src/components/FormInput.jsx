const FormInput = ({ label, ...props }) => (
  <label className="flex flex-col gap-2 text-sm">
    <span className="text-slate-700">{label}</span>
    <input
      {...props}
      className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
    />
  </label>
);

export default FormInput;
