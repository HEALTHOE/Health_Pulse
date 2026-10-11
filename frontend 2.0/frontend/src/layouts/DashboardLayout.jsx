import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Activity,
  Bell,
  Upload,
  Database,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BrandMark from "../components/BrandMark";

const navigationGroups = [
  {
    label: "Monitoring",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "Districts",
        path: "/districts",
        icon: Map,
        // Blocks and facilities live under the district hierarchy.
        alsoActiveFor: ["/blocks", "/facilities"],
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
    ],
  },
  {
    label: "Data",
    items: [
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
    ],
  },
];

const pageLabels = [
  ["/dashboard", "Dashboard"],
  ["/districts", "Districts"],
  ["/blocks", "Blocks"],
  ["/facilities", "Facility"],
  ["/indicators", "Indicators"],
  ["/alerts", "Alerts"],
  ["/data-upload", "Data Upload"],
  ["/data-quality", "Data Quality"],
];

const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "U";

  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  // The drawer is "open" only for the route it was opened on, so any
  // navigation (link, back button, redirect) closes it without an effect.
  const [openAtPath, setOpenAtPath] = useState(null);
  const menuOpen = openAtPath === pathname;
  const setMenuOpen = (open) => setOpenAtPath(open ? pathname : null);
  const closeButtonRef = useRef(null);
  const menuButtonRef = useRef(null);

  const currentLabel =
    pageLabels.find(([prefix]) => pathname.startsWith(prefix))?.[1] ||
    "HealthPulse";

  // Escape closes the drawer, body scroll is locked while it is open.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenAtPath(null);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isItemActive = (item, isActive) =>
    isActive ||
    Boolean(item.alsoActiveFor?.some((prefix) => pathname.startsWith(prefix)));

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-700 focus:shadow-raised"
      >
        Skip to main content
      </a>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/55 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="app-sidebar"
        aria-label="Primary"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-navy-900 text-white transition-[transform,visibility] duration-200 ease-out lg:w-64 lg:translate-x-0 lg:visible ${
          menuOpen
            ? "translate-x-0 visible shadow-pop"
            : "-translate-x-full invisible"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 pl-5 pr-3">
          <div className="flex items-center gap-3">
            <BrandMark size={34} />

            <div className="leading-tight">
              <p className="text-[17px] font-semibold tracking-tight">HealthPulse</p>
              <p className="text-[11px] text-navy-300">District health analytics</p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-navy-200 hover:bg-white/10 hover:text-white focus-visible:outline-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Main navigation" className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5">
          {navigationGroups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex > 0 ? "mt-7" : ""}>
              <p className="px-3 text-xs font-medium text-navy-300">{group.label}</p>

              <ul className="mt-2 space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => {
                          const active = isItemActive(item, isActive);

                          return `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-white ${
                            active
                              ? "bg-white/[0.11] text-white"
                              : "text-navy-200 hover:bg-white/[0.06] hover:text-white"
                          }`;
                        }}
                      >
                        {({ isActive }) => {
                          const active = isItemActive(item, isActive);

                          return (
                            <>
                              <span
                                aria-hidden="true"
                                className={`absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500 transition-opacity ${
                                  active ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <Icon
                                size={18}
                                aria-hidden="true"
                                className={active ? "text-white" : "text-navy-300 group-hover:text-white"}
                              />
                              {item.name}
                            </>
                          );
                        }}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Signed-in user */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-700 text-sm font-semibold text-white"
            >
              {getInitials(user?.full_name)}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.full_name || "User"}
              </p>
              <p className="truncate text-xs text-navy-300">{user?.role || ""}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-200 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-white"
          >
            <LogOut size={18} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="app-sidebar"
              className="-ml-1.5 rounded-lg p-2 text-ink-2 hover:bg-sunken lg:hidden"
            >
              <Menu size={22} />
            </button>

            <p className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-ink-3 sm:inline">
                District Health Monitoring
              </span>
              <span aria-hidden="true" className="hidden text-line-strong sm:inline">
                /
              </span>
              <span className="truncate font-semibold text-ink">{currentLabel}</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium text-ink">{user?.full_name}</p>
              <p className="text-xs text-ink-3">{user?.role}</p>
            </div>

            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white"
            >
              {getInitials(user?.full_name)}
            </span>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1320px] px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
