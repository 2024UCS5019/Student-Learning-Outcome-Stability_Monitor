import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const CheckIcon = ({ className = "h-5 w-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M9.2 12.6l1.9 1.9 4.9-6.2"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowRight = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 12h12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StatTile = ({ value, label }) => (
  <div className="rounded-3xl border border-white/10 bg-white/[0.06] px-6 py-6 shadow-[0_26px_90px_rgba(2,6,23,0.55)] backdrop-blur">
    <div className="text-3xl font-semibold tracking-tight text-white">{value}</div>
    <div className="mt-2 text-sm text-slate-200/80">{label}</div>
  </div>
);

const Pill = ({ children, tone = "sky" }) => {
  const toneClasses =
    tone === "mint"
      ? "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/20"
      : tone === "violet"
        ? "bg-violet-400/10 text-violet-200 ring-1 ring-violet-300/20"
        : "bg-sky-400/10 text-sky-200 ring-1 ring-sky-300/20";
  return (
    <span
      className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold tracking-[0.22em] uppercase ${toneClasses}`}
    >
      {children}
    </span>
  );
};

const Landing = () => {
  const { user } = useAuth();
  const [activeLane, setActiveLane] = useState("Admin");

  const snapshot = useMemo(
    () => [
      "Approval workflow and account governance",
      "Dashboard analytics with reviewer-friendly visuals",
      "Faculty and subject ownership mapping",
      "Student profiles with academic context"
    ],
    []
  );

  const capabilities = useMemo(
    () => [
      {
        tone: "sky",
        title: "Operations in one place",
        body:
          "Manage students, faculty, subjects, approvals, and activity history from one operational workspace."
      },
      {
        tone: "violet",
        title: "Performance intelligence",
        body:
          "Spot weak subjects, risk patterns, attendance drift, and trend movement without manual spreadsheet work."
      },
      {
        tone: "mint",
        title: "Role-aware experience",
        body:
          "Admins, faculty, students, and pending reviewers each see the right workflows, permissions, and visibility."
      }
    ],
    []
  );

  const trend2035 = useMemo(
    () => [
      {
        title: "2035 risk signals",
        body:
          "Early warnings based on attendance drift, grade volatility, and subject difficulty—explained with reviewer-safe context."
      },
      {
        title: "Consent-aware analytics",
        body:
          "Permission-first data views that keep governance, auditing, and student privacy aligned as datasets expand."
      },
      {
        title: "Live cohort intelligence",
        body:
          "Compare groups by semester, subject owner, and intervention status using KPI tiles and trend movement views."
      }
    ],
    []
  );

  const lanes = useMemo(
    () => [
      { key: "Admin", label: "Admin lane", desc: "Governance, approvals, oversight" },
      { key: "Faculty", label: "Faculty lane", desc: "Ownership, grading, class context" },
      { key: "Student", label: "Student lane", desc: "Profile, performance, attendance" },
      { key: "Reviewer", label: "Reviewer lane", desc: "Read-only story, evidence-ready" }
    ],
    []
  );

  const previewCards = useMemo(
    () => [
      {
        title: "Executive dashboard",
        desc: "KPI summary, weak segments, and intervention signals",
        accent: "from-sky-500/30 via-indigo-500/10 to-transparent"
      },
      {
        title: "Student operations",
        desc: "Searchable records with academic and demographic context",
        accent: "from-indigo-500/25 via-slate-900/10 to-transparent"
      },
      {
        title: "Performance workspace",
        desc: "Semester records, grades, attendance, and analytics",
        accent: "from-violet-500/25 via-slate-900/10 to-transparent"
      }
    ],
    []
  );

  const activeLaneMeta =
    lanes.find((lane) => lane.key === activeLane) || lanes[0];

  return (
    <div className="min-h-screen landing-bg text-slate-50">
      <div className="landing-gridlines">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-[0.34em] text-slate-200/70">
              SMART PERFORMANCE INTELLIGENCE DASHBOARD
            </div>
            <div className="mt-2 text-sm text-slate-200/80">
              Academic operations, governance, and analytics in one product.
            </div>
          </div>
          <nav className="flex items-center gap-3 sm:gap-4">
            <div className="hidden items-center gap-4 lg:flex">
              <a
                href="#capabilities"
                className="text-sm font-medium text-slate-200/80 transition hover:text-white"
              >
                Capabilities
              </a>
              <a
                href="#system"
                className="text-sm font-medium text-slate-200/80 transition hover:text-white"
              >
                Scrollytelling
              </a>
              <a
                href="#preview"
                className="text-sm font-medium text-slate-200/80 transition hover:text-white"
              >
                Preview
              </a>
            </div>
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm font-semibold text-white shadow-[0_26px_80px_rgba(2,6,23,0.45)] backdrop-blur transition hover:bg-white/15"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white shadow-[0_26px_80px_rgba(2,6,23,0.45)] backdrop-blur transition hover:bg-white/10"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 shadow-[0_26px_80px_rgba(2,6,23,0.45)] transition hover:bg-white/90"
                >
                  Request access
                </Link>
              </>
            )}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <section className="grid gap-10 pt-10 lg:grid-cols-12 lg:items-start lg:pt-16">
            <div className="lg:col-span-7">
              <Pill tone="sky">Submission-ready academic platform</Pill>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Academic performance, faculty oversight, and student operations in one polished system.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200/80">
                SPID turns scattered academic records into a clear operating layer for institutions. It combines approvals,
                subject planning, performance tracking, and risk visibility into one experience that feels cohesive in a demo.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#capabilities"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_30px_90px_rgba(2,6,23,0.55)] transition hover:bg-white/90"
                >
                  Explore the product
                  <ArrowRight />
                </a>
                <a
                  href="#preview"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white shadow-[0_30px_90px_rgba(2,6,23,0.55)] backdrop-blur transition hover:bg-white/10"
                >
                  View interface preview
                  <ArrowRight />
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <StatTile value="4" label="role types supported" />
                <StatTile value="10+" label="academic workflows covered" />
                <StatTile value="1" label="ready local demo environment" />
              </div>
            </div>

            <aside className="lg:col-span-5">
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] shadow-[0_30px_110px_rgba(2,6,23,0.65)] backdrop-blur">
                <div className="flex items-start justify-between gap-6 px-7 pb-6 pt-7">
                  <div>
                    <div className="text-xs font-semibold tracking-[0.32em] text-slate-200/70">
                      PLATFORM SNAPSHOT
                    </div>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                      Built for review, demo, and discussion
                    </h2>
                  </div>
                  <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right">
                    <div className="text-xs font-semibold text-slate-200/70">Focus</div>
                    <div className="mt-1 text-sm font-semibold text-white">Operations + analytics</div>
                  </div>
                </div>

                <div className="space-y-3 px-7 pb-6">
                  {snapshot.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/20">
                        <CheckIcon className="h-5 w-5" />
                      </span>
                      <div className="text-sm font-medium text-slate-100">{item}</div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 px-7 py-6">
                  <div className="text-xs font-semibold tracking-[0.32em] text-slate-200/70">
                    DEMO ACCOUNTS
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-200/80">
                    Seeded admin, faculty, and student flows are available for local review.
                  </p>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-100">
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      <span>
                        <span className="text-slate-200/70">Admin:</span> admin@gmail.com
                      </span>
                      <span>
                        <span className="text-slate-200/70">Faculty:</span> mathi@gmail.com
                      </span>
                      <span>
                        <span className="text-slate-200/70">Student:</span> abi@gmail.com
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                    >
                      Open sign-in
                      <ArrowRight />
                    </Link>
                    <a
                      href="#preview"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200 transition hover:text-white"
                    >
                      View interface preview
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <section className="mt-16 grid gap-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_120px_rgba(2,6,23,0.55)] backdrop-blur sm:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <div className="text-xs font-semibold tracking-[0.32em] text-slate-200/70">
                  2035 TRENDING FEATURES
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Built to feel modern now, and future-ready later
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-200/80">
                  A forward-looking layer that keeps analytics reviewer-safe while still communicating “what’s next” for academic ops.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-6 py-5">
                <div className="text-xs font-semibold tracking-[0.26em] text-slate-200/70 uppercase">
                  Governance signals
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-100">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-200/80">Latency</span>
                    <span className="font-semibold text-white">Live</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-200/80">Coordination</span>
                    <span className="font-semibold text-white">Shared</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-200/80">Motion</span>
                    <span className="font-semibold text-white">Restrained</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {trend2035.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-slate-950/45 p-7 shadow-[0_30px_90px_rgba(2,6,23,0.45)]"
                >
                  <div className="text-xs font-semibold tracking-[0.3em] text-slate-200/70 uppercase">
                    Trend
                  </div>
                  <div className="mt-4 text-2xl font-semibold tracking-tight text-white">{item.title}</div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-200/80">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="capabilities" className="mt-20 scroll-mt-16">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5">
                <div className="text-xs font-semibold tracking-[0.32em] text-slate-200/70">
                  CORE CAPABILITIES
                </div>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  What makes the product feel complete
                </h2>
              </div>
              <div className="lg:col-span-7 lg:pt-3">
                <p className="max-w-2xl text-base leading-relaxed text-slate-200/80">
                  The landing page leads with product value, then backs it up with clear workflows, seeded data, and interface evidence.
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {capabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="rounded-[2.25rem] border border-white/10 bg-white/[0.05] p-8 shadow-[0_30px_110px_rgba(2,6,23,0.55)] backdrop-blur"
                >
                  <Pill tone={cap.tone}>Capability</Pill>
                  <div className="mt-6 text-3xl font-semibold tracking-tight text-white">{cap.title}</div>
                  <p className="mt-5 text-sm leading-relaxed text-slate-200/80">{cap.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="system" className="mt-24 scroll-mt-16">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <div className="text-xs font-semibold tracking-[0.32em] text-slate-200/70">
                  SCROLLYTELLING SYSTEM
                </div>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  A narrative layer that feels like enterprise software
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200/80">
                  Motion is used as product communication: progressive context, spatial layering, and collaborative signals that make the platform
                  feel sophisticated without feeling theatrical.
                </p>
              </div>
              <div className="lg:col-span-5 lg:pt-9">
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] px-7 py-6 shadow-[0_30px_100px_rgba(2,6,23,0.55)] backdrop-blur">
                  <div className="text-sm font-semibold text-white">Motion style</div>
                  <div className="mt-2 text-sm text-slate-200/80">Restrained, data-first, reviewer-safe</div>
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/55 p-8 shadow-[0_30px_120px_rgba(2,6,23,0.65)]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold tracking-[0.32em] text-slate-200/70">
                        INTERACTIVE SCENE
                      </div>
                      <div className="mt-4 text-3xl font-semibold tracking-tight text-white">
                        Make cross-team decisions feel coordinated
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right">
                      <div className="text-xs font-semibold text-slate-200/70">Active metric</div>
                      <div className="mt-1 text-2xl font-semibold text-white">4</div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">role lanes</div>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {["Signals", "Context", "Review"].map((label) => (
                      <div
                        key={label}
                        className={`rounded-2xl border px-5 py-4 text-center text-sm font-semibold transition ${
                          label === "Context"
                            ? "border-sky-300/30 bg-sky-500/10 text-white shadow-[0_26px_70px_rgba(56,189,248,0.18)]"
                            : "border-white/10 bg-white/5 text-slate-200/80 hover:bg-white/10"
                        }`}
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {["Faculty", "Ops", "Risk"].map((label) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm font-semibold text-slate-200/80 transition hover:bg-white/10"
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 px-7 py-6">
                    <div className="text-xs font-semibold tracking-[0.32em] text-slate-200/70">
                      COLLABORATIVE REVIEW
                    </div>
                    <div className="mt-3 text-sm text-slate-200/80">
                      Admin, faculty, student, reviewer — a shared surface that suggests handoff and validation.
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {lanes.map((lane) => (
                        <button
                          key={lane.key}
                          type="button"
                          onClick={() => setActiveLane(lane.key)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            activeLane === lane.key
                              ? "bg-white text-slate-950"
                              : "border border-white/10 bg-transparent text-slate-200/80 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {lane.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:col-span-5">
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] px-7 py-6 shadow-[0_30px_110px_rgba(2,6,23,0.55)] backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold tracking-[0.32em] text-slate-200/70">
                        SIGNAL INTAKE
                      </div>
                      <div className="mt-4 text-2xl font-semibold tracking-tight text-white">
                        Capture governance and academic movement in one feed
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-slate-200/80">
                        Approvals, student changes, faculty ownership, subject planning, and risk signals move through one operational stream instead
                        of disconnected screens.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right">
                      <div className="text-sm font-semibold text-white">12</div>
                      <div className="mt-1 text-xs font-semibold text-slate-200/70">live signals</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.06] px-7 py-6 shadow-[0_30px_110px_rgba(2,6,23,0.55)] backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold tracking-[0.32em] text-slate-200/70">
                        CONTEXT LAYERING
                      </div>
                      <div className="mt-4 text-2xl font-semibold tracking-tight text-white">
                        Surface the next action with spatial context
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-slate-200/80">
                        Each layer adds operational meaning: who owns the issue, what changed, which student groups are affected, and where the team
                        should intervene next.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right">
                      <div className="text-sm font-semibold text-white">3</div>
                      <div className="mt-1 text-xs font-semibold text-slate-200/70">context layers</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.06] px-7 py-6 shadow-[0_30px_110px_rgba(2,6,23,0.55)] backdrop-blur">
                  <div className="text-xs font-semibold tracking-[0.32em] text-slate-200/70">
                    ACTIVE LANE
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-6">
                    <div>
                      <div className="text-2xl font-semibold tracking-tight text-white">{activeLaneMeta.label}</div>
                      <div className="mt-2 text-sm text-slate-200/80">{activeLaneMeta.desc}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-right">
                      <div className="text-xs font-semibold text-slate-200/70">Signal</div>
                      <div className="mt-1 text-sm font-semibold text-white">Shared visibility</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="preview" className="mt-24 scroll-mt-16">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-xs font-semibold tracking-[0.32em] text-slate-200/70">
                  INTERFACE PREVIEW
                </div>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  A stronger first impression for reviewers
                </h2>
                <p className="mt-5 text-base leading-relaxed text-slate-200/80">
                  Reviewers should immediately see a presentable product story, seeded operational data, and screens that look ready for discussion.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200 transition hover:text-white"
              >
                Open sign-in
                <ArrowRight />
              </Link>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-3">
              {previewCards.map((card) => (
                <div
                  key={card.title}
                  className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.05] shadow-[0_30px_120px_rgba(2,6,23,0.55)] backdrop-blur"
                >
                  <div className="bg-slate-950/60 px-8 py-7">
                    <div className="text-2xl font-semibold tracking-tight text-white">{card.title}</div>
                    <div className="mt-3 text-sm text-slate-200/80">{card.desc}</div>
                  </div>
                  <div className={`relative bg-gradient-to-br ${card.accent}`}>
                    <div className="p-8">
                      <div className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold tracking-[0.3em] text-slate-200/70 uppercase">
                            SPID
                          </div>
                          <div className="text-xs font-semibold text-slate-200/70">Analytics Overview</div>
                        </div>
                        <div className="mt-6 grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="h-20 rounded-2xl bg-white/10" />
                            <div className="h-20 rounded-2xl bg-white/5" />
                          </div>
                          <div className="h-24 rounded-2xl bg-white/5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="mt-20 border-t border-white/10 py-10">
            <div className="flex flex-col gap-3 text-sm text-slate-200/70 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-semibold text-white">Student Outcome Monitor</span>{" "}
                <span className="text-slate-200/60">— SPID landing experience</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/login" className="font-semibold text-slate-100 transition hover:text-white">
                  Sign in
                </Link>
                <Link to="/register" className="font-semibold text-slate-100 transition hover:text-white">
                  Request access
                </Link>
                <a href="#capabilities" className="font-semibold text-slate-100 transition hover:text-white">
                  Capabilities
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Landing;
