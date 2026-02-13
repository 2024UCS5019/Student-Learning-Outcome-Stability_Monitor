const ChartCard = ({ title, children }) => (
  <div className="card-panel p-5">
    <h3 className="section-title mb-4">{title}</h3>
    <div className="h-72">{children}</div>
  </div>
);

export default ChartCard;
