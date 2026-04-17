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
  <div className="rounded-3xl border border-slate-200/70 bg-white/80 px-6 py-6 shadow-[0_26px_80px_rgba(2,6,23,0.10)] backdrop-blur">
    <div className="text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
    <div className="mt-2 text-sm text-slate-600">{label}</div>
  </div>
);

const Pill = ({ children, tone = "sky" }) => {
  const toneClasses =
    tone === "mint"
      ? "bg-emerald-500/10 text-emerald-800 ring-1 ring-emerald-200"
      : tone === "violet"
        ? "bg-violet-500/10 text-violet-800 ring-1 ring-violet-200"
        : "bg-sky-500/10 text-sky-800 ring-1 ring-sky-200";
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
      "Outcome attainment tracking and stability insights",
      "CO/PO mapping with reviewer-friendly visuals",
      "Faculty and subject ownership workflows",
      "Student profiles with marks and attendance context"
    ],
    []
  );

  const capabilities = useMemo(
    () => [
      {
        tone: "sky",
        title: "Outcome-first operations",
        body:
          "Manage students, faculty, subjects, approvals, and activity history from one integrated academic workspace."
      },
      {
        tone: "violet",
        title: "Stability analytics",
        body:
          "See attainment trends, stability drift, weak subjects, and risk signals without manual spreadsheet work."
      },
      {
        tone: "mint",
        title: "Role-aware experience",
        body:
          "Admins, faculty, students, and reviewers each see the right workflows, permissions, and visibility."
      }
    ],
    []
  );

  const trend2035 = useMemo(
    () => [
      {
        title: "Outcome stability signals",
        body:
          "Early warnings based on attendance drift, grade volatility, and subject difficulty, explained with review-ready context."
      },
      {
        title: "Evidence-ready views",
        body:
          "Audit-friendly reporting that supports approvals and review discussions without exposing unnecessary detail."
      },
      {
        title: "Cohort comparison",
        body:
          "Compare cohorts by semester, subject, and owner using KPI tiles and trend movement views."
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
        title: "Outcome dashboard",
        desc: "Attainment KPIs, weak segments, and stability signals",
        accent: "from-sky-500/30 via-indigo-500/10 to-transparent"
      },
      {
        title: "Student profiles",
        desc: "Searchable records with marks, attendance, and context",
        accent: "from-indigo-500/25 via-slate-900/10 to-transparent"
      },
      {
        title: "Attainment workspace",
        desc: "Subject outcomes, CO/PO mapping, and analytics",
        accent: "from-violet-500/25 via-slate-900/10 to-transparent"
      }
    ],
    []
  );

  const activeLaneMeta =
    lanes.find((lane) => lane.key === activeLane) || lanes[0];

  return (
    <div className="min-h-screen landing-bg text-slate-900">
      <div className="landing-gridlines">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-[0.34em] text-slate-600">
              STUDENT LEARNING OUTCOME STABILITY MONITOR
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Outcome attainment tracking, stability insights, and academic governance in one platform.
            </div>
          </div>
          <nav className="flex items-center gap-3 sm:gap-4">
            <div className="hidden items-center gap-4 lg:flex">
              <a
                href="#capabilities"
                className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                Capabilities
              </a>
              <a
                href="#system"
                className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                Insights
              </a>
              <a
                href="#preview"
                className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                Preview
              </a>
            </div>
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-full border border-slate-200/70 bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-[0_26px_70px_rgba(2,6,23,0.12)] transition hover:bg-slate-800"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-slate-200/70 bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_26px_70px_rgba(2,6,23,0.10)] transition hover:bg-slate-50"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_26px_70px_rgba(2,6,23,0.14)] transition hover:bg-sky-500"
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
              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Outcome attainment, stability insights, and academic operations in one polished system.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
                Student Learning Outcome Stability Monitor brings marks, attendance, subjects, and approvals into one coherent workflow. It helps
                teams track attainment, understand stability drift, and present evidence-ready analytics during reviews.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#capabilities"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_30px_80px_rgba(2,6,23,0.14)] transition hover:bg-slate-800"
                >
                  Explore the product
                  <ArrowRight />
                </a>
                <a
                  href="#preview"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_30px_80px_rgba(2,6,23,0.08)] transition hover:bg-slate-50"
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
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 shadow-[0_30px_90px_rgba(2,6,23,0.12)] backdrop-blur">
                <div className="flex items-start justify-between gap-6 px-7 pb-6 pt-7">
                  <div>
                    <div className="text-xs font-semibold tracking-[0.32em] text-slate-600">
                      PLATFORM SNAPSHOT
                    </div>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                      Built for review, demo, and discussion
                    </h2>
                  </div>
                  <div className="shrink-0 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 text-right">
                    <div className="text-xs font-semibold text-slate-600">Focus</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Operations + analytics</div>
                  </div>
                </div>

                <div className="space-y-3 px-7 pb-6">
                  {snapshot.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-4"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-200">
                        <CheckIcon className="h-5 w-5" />
                      </span>
                      <div className="text-sm font-medium text-slate-800">{item}</div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200/70 px-7 py-6">
                  <div className="text-xs font-semibold tracking-[0.32em] text-slate-600">
                    DEMO ACCOUNTS
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Seeded admin, faculty, and student flows are available for local review.
                  </p>
                  <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-4 text-sm text-slate-800">
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      <span>
                        <span className="text-slate-600">Admin:</span> admin@gmail.com
                      </span>
                      <span>
                        <span className="text-slate-600">Faculty:</span> mathi@gmail.com
                      </span>
                      <span>
                        <span className="text-slate-600">Student:</span> abi@gmail.com
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      Open sign-in
                      <ArrowRight />
                    </Link>
                    <a
                      href="#preview"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-900"
                    >
                      View interface preview
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <section className="mt-16 grid gap-8 rounded-3xl border border-slate-200/70 bg-white/70 p-8 shadow-[0_30px_90px_rgba(2,6,23,0.10)] backdrop-blur sm:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <div className="text-xs font-semibold tracking-[0.32em] text-slate-600">
                  FUTURE-READY FEATURES
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Built to feel modern now, and future-ready later
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  A forward-looking layer that keeps analytics review-safe while still communicating what's next for academic outcome tracking.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-6 py-5">
                <div className="text-xs font-semibold tracking-[0.26em] text-slate-600 uppercase">
                  Outcome signals
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Latency</span>
                    <span className="font-semibold text-slate-900">Live</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Coordination</span>
                    <span className="font-semibold text-slate-900">Shared</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Motion</span>
                    <span className="font-semibold text-slate-900">Restrained</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {trend2035.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-slate-200/70 bg-white/70 p-7 shadow-[0_30px_80px_rgba(2,6,23,0.08)]"
                >
                  <div className="text-xs font-semibold tracking-[0.3em] text-slate-600 uppercase">
                    Trend
                  </div>
                  <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{item.title}</div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="capabilities" className="mt-20 scroll-mt-16">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5">
                <div className="text-xs font-semibold tracking-[0.32em] text-slate-600">
                  CORE CAPABILITIES
                </div>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  What makes the product feel complete
                </h2>
              </div>
              <div className="lg:col-span-7 lg:pt-3">
                <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                  The landing page leads with product value, then backs it up with clear workflows, seeded data, and interface evidence.
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {capabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="rounded-[2.25rem] border border-slate-200/70 bg-white/80 p-8 shadow-[0_30px_90px_rgba(2,6,23,0.10)] backdrop-blur"
                >
                  <Pill tone={cap.tone}>Capability</Pill>
                  <div className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">{cap.title}</div>
                  <p className="mt-5 text-sm leading-relaxed text-slate-600">{cap.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="system" className="mt-24 scroll-mt-16">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <div className="text-xs font-semibold tracking-[0.32em] text-slate-600">
                  INSIGHTS SYSTEM
                </div>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  A narrative layer that feels review-ready
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600">
                  The UI communicates progress with clear context and layered panels so reviewers can follow what changed, why it matters, and what
                  action is next.
                </p>
              </div>
              <div className="lg:col-span-5 lg:pt-9">
                <div className="rounded-3xl border border-slate-200/70 bg-white/70 px-7 py-6 shadow-[0_30px_80px_rgba(2,6,23,0.08)] backdrop-blur">
                  <div className="text-sm font-semibold text-slate-900">Motion style</div>
                  <div className="mt-2 text-sm text-slate-600">Restrained, outcome-first, review-safe</div>
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <div className="rounded-[2.5rem] border border-slate-200/70 bg-white/80 p-8 shadow-[0_30px_90px_rgba(2,6,23,0.10)] backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold tracking-[0.32em] text-slate-600">
                        INTERACTIVE SCENE
                      </div>
                      <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                        Make cross-team decisions feel coordinated
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 text-right">
                      <div className="text-xs font-semibold text-slate-600">Active metric</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-950">4</div>
                      <div className="mt-1 text-sm font-semibold text-slate-700">role lanes</div>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {["Signals", "Context", "Review"].map((label) => (
                      <div
                        key={label}
                        className={`rounded-2xl border px-5 py-4 text-center text-sm font-semibold transition ${
                          label === "Context"
                            ? "border-sky-200 bg-sky-500/10 text-sky-900 shadow-[0_26px_70px_rgba(2,6,23,0.10)]"
                            : "border-slate-200/70 bg-white text-slate-700 hover:bg-slate-50"
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
                        className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-3xl border border-slate-200/70 bg-white px-7 py-6">
                    <div className="text-xs font-semibold tracking-[0.32em] text-slate-600">
                      COLLABORATIVE REVIEW
                    </div>
                    <div className="mt-3 text-sm text-slate-600">
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
                              ? "bg-slate-900 text-white"
                              : "border border-slate-200/70 bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
                <div className="rounded-3xl border border-slate-200/70 bg-white/80 px-7 py-6 shadow-[0_30px_80px_rgba(2,6,23,0.10)] backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold tracking-[0.32em] text-slate-600">
                        SIGNAL INTAKE
                      </div>
                      <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                        Capture governance and academic movement in one feed
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-slate-600">
                        Approvals, student changes, faculty ownership, subject planning, and risk signals move through one operational stream instead
                        of disconnected screens.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 text-right">
                      <div className="text-sm font-semibold text-slate-950">12</div>
                      <div className="mt-1 text-xs font-semibold text-slate-600">live signals</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white/80 px-7 py-6 shadow-[0_30px_80px_rgba(2,6,23,0.10)] backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold tracking-[0.32em] text-slate-600">
                        CONTEXT LAYERING
                      </div>
                      <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                        Surface the next action with spatial context
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-slate-600">
                        Each layer adds operational meaning: who owns the issue, what changed, which student groups are affected, and where the team
                        should intervene next.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 text-right">
                      <div className="text-sm font-semibold text-slate-950">3</div>
                      <div className="mt-1 text-xs font-semibold text-slate-600">context layers</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white/80 px-7 py-6 shadow-[0_30px_80px_rgba(2,6,23,0.10)] backdrop-blur">
                  <div className="text-xs font-semibold tracking-[0.32em] text-slate-600">
                    ACTIVE LANE
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-6">
                    <div>
                      <div className="text-2xl font-semibold tracking-tight text-slate-950">{activeLaneMeta.label}</div>
                      <div className="mt-2 text-sm text-slate-600">{activeLaneMeta.desc}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-900 px-5 py-4 text-right">
                      <div className="text-xs font-semibold text-slate-200">Signal</div>
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
                <div className="text-xs font-semibold tracking-[0.32em] text-slate-600">
                  INTERFACE PREVIEW
                </div>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  A stronger first impression for reviewers
                </h2>
                <p className="mt-5 text-base leading-relaxed text-slate-600">
                  Reviewers should immediately see a presentable product story, seeded operational data, and screens that look ready for discussion.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-900"
              >
                Open sign-in
                <ArrowRight />
              </Link>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-3">
              {previewCards.map((card) => (
                <div
                  key={card.title}
                  className="overflow-hidden rounded-[2.5rem] border border-slate-200/70 bg-white/80 shadow-[0_30px_90px_rgba(2,6,23,0.10)] backdrop-blur"
                >
                  <div className="border-b border-slate-200/70 bg-white px-8 py-7">
                    <div className="text-2xl font-semibold tracking-tight text-slate-950">{card.title}</div>
                    <div className="mt-3 text-sm text-slate-600">{card.desc}</div>
                  </div>
                  <div className={`relative bg-gradient-to-br ${card.accent}`}>
                    <div className="p-8">
                      <div className="rounded-[2rem] border border-slate-200/70 bg-white/70 p-6 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold tracking-[0.3em] text-slate-600 uppercase">
                            SLO Monitor
                          </div>
                          <div className="text-xs font-semibold text-slate-600">Analytics Overview</div>
                        </div>
                        <div className="mt-6 grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="h-20 rounded-2xl bg-slate-900/10" />
                            <div className="h-20 rounded-2xl bg-slate-900/5" />
                          </div>
                          <div className="h-24 rounded-2xl bg-slate-900/5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="mt-20 border-t border-slate-200/70 py-10">
            <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-semibold text-slate-900">Student Learning Outcome Stability Monitor</span>{" "}
                <span className="text-slate-500">— landing experience</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/login" className="font-semibold text-slate-700 transition hover:text-slate-950">
                  Sign in
                </Link>
                <Link to="/register" className="font-semibold text-slate-700 transition hover:text-slate-950">
                  Request access
                </Link>
                <a href="#capabilities" className="font-semibold text-slate-700 transition hover:text-slate-950">
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
