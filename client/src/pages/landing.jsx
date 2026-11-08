import { Link } from "react-router-dom";

const SECTORS = [
  {
    icon: "🛡️",
    name: "Defense & Aerospace",
    desc: "DRDO, Ordnance factories, Indian Air Force, and naval procurement contracts.",
  },
  {
    icon: "🚆",
    name: "Railways & Transport",
    desc: "Indian Railways, metro rail corporations, port trusts, and freight corridors.",
  },
  {
    icon: "⚡",
    name: "Electrical & Electronics",
    desc: "Power grids, solar installations, high-voltage transformers, and lighting works.",
  },
  {
    icon: "🏥",
    name: "Healthcare & Medical Supplies",
    desc: "AIIMS, government hospitals, medical colleges, pharmaceutical supplies & diagnostics.",
  },
  {
    icon: "💻",
    name: "Information Technology & Software",
    desc: "Cloud infrastructure, cybersecurity, system integration, software development & ERP.",
  },
  {
    icon: "🏗️",
    name: "Civil Construction",
    desc: "National highways, bridges, government buildings, border roads, and urban housing.",
  },
];

const FEATURES = [
  {
    icon: "🎯",
    title: "Industry-Specific Matching",
    description:
      "Stop wasting hours scrolling through thousands of unrelated contracts. Choose your sectors and get a personalized feed.",
  },
  {
    icon: "⏳",
    title: "Real-Time Expiry Radar",
    description:
      "Automated deadline countdowns highlight tenders closing today, tomorrow, or next week so you never miss a submission cutoff.",
  },
  {
    icon: "📬",
    title: "Instant Email Notifications",
    description:
      "Get email notifications delivered straight to your inbox the moment a new tender matching your chosen sector is published.",
  },
  {
    icon: "🔗",
    title: "Direct Government Portal Links",
    description:
      "Jump directly to the official eprocure.gov.in listing with one click to download bidding documents and submit proposals.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Choose Your Sectors",
    desc: "Create an account in 30 seconds and select the industries relevant to your business.",
  },
  {
    step: "02",
    title: "Automated Daily Ingestion",
    desc: "Our cloud engine scrapes and parses latest active tenders directly from eprocure.gov.in every morning at 8:00 AM IST.",
  },
  {
    step: "03",
    title: "Review & Submit Bids",
    desc: "Access deadline countdowns, direct portal links, and tailored email alerts before bidding closes.",
  },
];

function Landing() {
  const token = localStorage.getItem("token");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Central Government Procurement Alerts</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight md:leading-tight mb-6">
            Never Miss a High-Value <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              Government Tender
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-300 mb-10 leading-relaxed font-normal">
            GovTapp automatically tracks, categorizes, and alerts contractors to
            verified Indian government tenders from{" "}
            <span className="text-white font-medium">eprocure.gov.in</span>. Filtered by your industry with real-time deadline countdowns.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to={token ? "/dashboard" : "/signup"}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition transform hover:-translate-y-0.5 text-center text-sm"
            >
              {token ? "Go to Your Dashboard →" : "Get Started for Free →"}
            </Link>

            <Link
              to={token ? "/categories" : "/login"}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold rounded-xl transition text-center text-sm"
            >
              {token ? "Manage Categories" : "Sign In to Existing Account"}
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-slate-800/80 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-white">6+</div>
              <div className="text-xs text-slate-400 mt-1">Core Sectors Monitored</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-blue-400">8:00 AM</div>
              <div className="text-xs text-slate-400 mt-1">Daily Automated Scrapes</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-emerald-400">0</div>
              <div className="text-xs text-slate-400 mt-1">Expired Tenders in Feed</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-indigo-300">100%</div>
              <div className="text-xs text-slate-400 mt-1">Free Public Procurement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tender Card Preview Mockup */}
      <section className="relative -mt-10 max-w-4xl mx-auto px-6 mb-20 z-10">
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏛️</span>
              <span className="font-semibold text-slate-800 text-sm">
                Sample Live Feed Preview
              </span>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              Verified Source: eprocure.gov.in
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="bg-slate-200/70 text-slate-700 font-mono text-xs px-2.5 py-1 rounded font-medium">
                30003/DTK/19TF/ENQ-36
              </span>
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                Defense & Aerospace
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              SUPPLY AND INSTALLATION OF HIGH-PRECISION NAVIGATIONAL RADAR SYSTEMS
            </h3>
            <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
              <span>🏛️</span>
              <span>Border Roads Organisation || HQ CE (P) Dantak</span>
            </p>
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-200 text-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">
                  📅 Deadline: <strong>25 Nov 2026 at 03:00 PM</strong>
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  ⏳ 17 days left
                </span>
              </div>
              <span className="text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                View Portal ↗
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sectors Covered Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 mb-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Sectors Covered
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mt-3">
            Tailored for Every Major Industry
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Select the industries you want to monitor. Our classifier filters tenders
            so you only see contracts that matter to your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECTORS.map((sec) => (
            <div
              key={sec.name}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl mb-3">{sec.icon}</div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {sec.name}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {sec.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-900/50 px-3 py-1 rounded-full border border-blue-800">
              Why GovTapp
            </span>
            <h2 className="text-3xl font-bold tracking-tight mt-3">
              Built for Contractors, Vendors & Enterprises
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Government portals are notoriously slow and hard to navigate. GovTapp
              makes tracking and bidding seamless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 hover:border-slate-600 transition"
              >
                <div className="text-3xl mb-4">{feat.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {feat.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Workflow
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mt-3">
            How GovTapp Works
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Get up and running in under a minute with three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="inline-block text-2xl font-extrabold text-blue-600 font-mono mb-4">
                  {s.step}
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {s.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">
            Start Winning Government Contracts Today
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            Create your account now to get instant access to your customized tender
            feed and automated email alerts.
          </p>
          <Link
            to={token ? "/dashboard" : "/signup"}
            className="inline-block px-8 py-3.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl shadow-lg transition transform hover:-translate-y-0.5 text-sm"
          >
            {token ? "Go to Dashboard →" : "Create Free Account →"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-900 text-xs">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <span>🏛️</span>
            <span>GovTapp</span>
          </div>

          <p className="text-center sm:text-left text-slate-500">
            Public procurement data indexed from{" "}
            <a
              href="https://eprocure.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:underline"
            >
              eprocure.gov.in
            </a>
            . Not an official government portal.
          </p>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-white transition">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-white transition">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
