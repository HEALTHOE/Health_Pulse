import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-700">
            HealthPulse
          </h1>

          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-slate-900">
          Dashboard
        </h2>

        <div className="mt-6 rounded-xl bg-white border border-slate-200 p-6">
          <p className="text-slate-600">
            Welcome,{" "}
            <span className="font-semibold text-slate-900">
              {user?.full_name || user?.email}
            </span>
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Role: {user?.role}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;