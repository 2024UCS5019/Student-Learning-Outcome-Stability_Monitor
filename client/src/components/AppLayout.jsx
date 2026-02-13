import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AppLayout = ({ children, title }) => (
  <div className="app-bg min-h-screen">
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen px-6 py-8">
        <Topbar title={title} />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  </div>
);

export default AppLayout;
