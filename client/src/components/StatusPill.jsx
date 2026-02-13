const tone = {
  Stable: "bg-emerald-100 text-emerald-700",
  Improving: "bg-sky-100 text-sky-700",
  Declining: "bg-rose-100 text-rose-700"
};

const StatusPill = ({ status = "Stable" }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tone[status] || tone.Stable}`}>
    {status}
  </span>
);

export default StatusPill;
