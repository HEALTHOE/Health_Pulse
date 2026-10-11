import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BellRing,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  LineChart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BrandMark from "../components/BrandMark";

const capabilities = [
  {
    icon: LineChart,
    title: "Indicator performance against targets",
    text: "Immunization, ANC, TB and institutional delivery tracked month by month.",
  },
  {
    icon: BellRing,
    title: "Alerts when coverage slips",
    text: "Warning and critical thresholds surface the blocks that need attention.",
  },
  {
    icon: Layers,
    title: "District to facility in one view",
    text: "Move from a district health score down to individual facilities.",
  },
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Unable to login. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-navy-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Single decorative ECG trace – the one expressive element on this page */}
        <svg
          aria-hidden="true"
          viewBox="0 0 800 220"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-16 h-44 w-full opacity-[0.16]"
        >
          <path
            d="M0 120 H170 L205 120 L235 40 L285 190 L322 80 L345 120 H520 L552 120 L580 60 L620 160 L648 120 H800"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="relative flex items-center gap-3">
          <BrandMark size={40} />
          <span className="text-xl font-semibold tracking-tight">HealthPulse</span>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-[42px]">
            District health monitoring and analytics
          </h1>

          <p className="mt-4 text-base leading-relaxed text-navy-200">
            One place for health officers and analysts to review performance,
            spot declining indicators early and keep reporting data clean.
          </p>

          <ul className="mt-10 space-y-6">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10"
                >
                  <Icon size={18} />
                </span>

                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-0.5 text-sm text-navy-300">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-navy-300">
          Authorised personnel only. Do not enter patient-identifiable information.
        </p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[26rem]">
          {/* Compact brand for screens without the brand panel */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark size={38} />
            <div className="leading-tight">
              <p className="text-xl font-semibold tracking-tight text-ink">HealthPulse</p>
              <p className="text-sm text-ink-3">District Health Monitoring & Analytics</p>
            </div>
          </div>

          <h2 className="text-[28px] font-semibold leading-tight text-ink">Welcome back</h2>

          <p className="mt-1.5 text-[15px] text-ink-3">
            Sign in to access your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-ink-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-line-strong bg-surface px-4 py-3 text-[15px] text-ink shadow-card transition-colors placeholder:text-ink-4 hover:border-ink-4 focus:border-brand-600"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-ink-2"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-line-strong bg-surface py-3 pl-4 pr-12 text-[15px] text-ink shadow-card transition-colors placeholder:text-ink-4 hover:border-ink-4 focus:border-brand-600"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-crit-100 bg-crit-50 px-4 py-3 text-sm text-crit-700"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-[15px] font-medium text-white shadow-card transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              )}
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
