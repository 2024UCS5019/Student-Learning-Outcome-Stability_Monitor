const StatCard = ({ title, value, subtitle }) => (
  <div className="card-panel p-5">
    <p className="muted text-sm">{title}</p>
    <h3 className="font-display text-2xl text-ink mt-2">{value}</h3>
    {subtitle ? <p className="muted text-xs mt-2">{subtitle}</p> : null}
  </div>
);

export default StatCard;
