import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Activity,
  Bell,
  Upload,
  Database,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Districts",
    path: "/districts",
    icon: Map,
  },
  {
    name: "Indicators",
    path: "/indicators",
    icon: Activity,
  },
  {
    name: "Alerts",
    path: "/alerts",
    icon: Bell,
  },
  {
    name: "Data Upload",
    path: "/data-upload",
    icon: Upload,
  },
  {
    name: "Data Quality",
    path: "/data-quality",
    icon: Database,
  },
];

const DashboardLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-blue-400">
            HealthPulse
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon size={19} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-700 p-4">
          <div className="mb-3">
            <p className="text-sm font-medium text-white">
              {user?.full_name || "User"}
            </p>
            <p className="text-xs text-slate-400">
              {user?.role || ""}
            </p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              District Health Monitoring
            </h2>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-slate-700">
              {user?.full_name}
            </p>
            <p className="text-xs text-slate-500">
              {user?.role}
            </p>
          </div>
        </header>

        {/* Page content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;