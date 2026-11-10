import api from "../api.js";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Helper to format deadline and calculate remaining time
function formatDeadline(deadlineStr) {
  if (!deadlineStr) {
    return {
      text: "Refer to portal",
      badge: null,
      isExpired: false,
    };
  }

  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      text: "Expired",
      badge: "Expired",
      isExpired: true,
    };
  }

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const dateFormatted = deadline.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const timeFormatted = deadline.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (diffHours <= 24) {
    return {
      text: `${dateFormatted} at ${timeFormatted}`,
      badge: "🔥 Closes Today",
      urgency: "urgent",
      isExpired: false,
    };
  }

  if (diffDays === 1) {
    return {
      text: `${dateFormatted} at ${timeFormatted}`,
      badge: "⚡ Closes Tomorrow",
      urgency: "urgent",
      isExpired: false,
    };
  }

  return {
    text: `${dateFormatted}`,
    badge: `⏳ ${diffDays} days left`,
    urgency: "normal",
    isExpired: false,
  };
}

function Dashboard() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "saved"
  const [savedIds, setSavedIds] = useState(new Set());
  const [summarizingId, setSummarizingId] = useState(null);
  const [expandedSummaries, setExpandedSummaries] = useState({});

  useEffect(() => {
    // 1. Fetch matching active tenders
    api
      .get("/tenders/matching")
      .then((res) => {
        const currentTime = Date.now();
        const activeOnly = res.data.filter((t) => {
          if (!t.deadline) return true;
          return new Date(t.deadline).getTime() >= currentTime;
        });
        setTenders(activeOnly);
      })
      .catch((err) => {
        console.error("Failed fetching tenders:", err);
      })
      .finally(() => setLoading(false));

    // 2. Fetch user's saved tender IDs for instant bookmark state
    api
      .get("/tenders/saved/ids")
      .then((res) => {
        setSavedIds(new Set(res.data));
      })
      .catch((err) => {
        console.error("Failed fetching saved IDs:", err);
      });
  }, []);

  // Handle bookmarking/saving tender with optimistic UI update
  const handleToggleSave = async (tenderId) => {
    const isCurrentlySaved = savedIds.has(tenderId);

    // Optimistic UI state
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) next.delete(tenderId);
      else next.add(tenderId);
      return next;
    });

    try {
      await api.post(`/tenders/${tenderId}/save`);
    } catch (err) {
      console.error("Failed saving tender:", err);
      // Rollback on network failure
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.add(tenderId);
        else next.delete(tenderId);
        return next;
      });
    }
  };

  // Handle generating or toggling AI summary
  const handleSummarize = async (tenderId) => {
    const tender = tenders.find((t) => t.id === tenderId);
    
    // If summary is already cached in state, toggle visibility
    if (tender?.summary) {
      setExpandedSummaries((prev) => ({
        ...prev,
        [tenderId]: !prev[tenderId],
      }));
      return;
    }

    // Call backend API to generate summary
    try {
      setSummarizingId(tenderId);
      const res = await api.post(`/tenders/${tenderId}/summarize`);

      // Update tender with newly returned summary
      setTenders((prev) =>
        prev.map((t) =>
          t.id === tenderId ? { ...t, summary: res.data.summary } : t
        )
      );

      // Auto-expand the summary
      setExpandedSummaries((prev) => ({
        ...prev,
        [tenderId]: true,
      }));
    } catch (err) {
      console.error("Failed generating summary:", err);
      alert(
        err.response?.data?.error ||
          "Could not generate AI summary at this moment. Please try again."
      );
    } finally {
      setSummarizingId(null);
    }
  };

  // Filter active tenders matching the search query
  const filteredTenders = tenders.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q) ||
      t.referenceNo.toLowerCase().includes(q) ||
      (t.category?.name && t.category.name.toLowerCase().includes(q))
    );
  });

  // Apply tab filter: "all" vs "saved"
  const displayedTenders = filteredTenders.filter((t) => {
    if (activeTab === "saved") {
      return savedIds.has(t.id);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-block animate-spin text-3xl mb-3">⚙️</div>
        <p className="text-slate-500 font-medium text-sm">
          Fetching your personalized tenders...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header, Tab Switcher & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Tender Feed
            </h1>
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {filteredTenders.length} Active
            </span>
          </div>
          <p className="text-slate-500 text-xs mb-3">
            Live tenders scraped from eprocure.gov.in matching your selected industries.
          </p>

          {/* Tab Switcher: All Tenders vs Saved Watchlist */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Tenders ({filteredTenders.length})
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "saved"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              <span>⭐</span>
              <span>Saved Watchlist ({savedIds.size})</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search keywords, department, ref no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-sm">
            🔍
          </span>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {displayedTenders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="text-4xl mb-3">{activeTab === "saved" ? "⭐" : "📭"}</div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            {activeTab === "saved"
              ? "No saved tenders yet"
              : search
              ? "No tenders found"
              : "No matching tenders yet"}
          </h3>
          <p className="text-slate-500 text-xs mb-6">
            {activeTab === "saved"
              ? "Click the '☆ Save' button on any tender card to bookmark it to your watchlist for quick access."
              : search
              ? `No tenders match "${search}". Try searching a different keyword.`
              : "We haven't found tenders for your currently selected categories yet."}
          </p>
          {activeTab === "saved" ? (
            <button
              onClick={() => setActiveTab("all")}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
            >
              Browse All Tenders
            </button>
          ) : search ? (
            <button
              onClick={() => setSearch("")}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Clear Search
            </button>
          ) : (
            <Link
              to="/categories"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition inline-block"
            >
              Adjust Categories
            </Link>
          )}
        </div>
      ) : (
        /* Tenders Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedTenders.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                {/* Reference Number & Category Tag & Save Bookmark */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2.5 py-1 rounded font-medium">
                    {t.referenceNo}
                  </span>
                  <div className="flex items-center gap-2">
                    {t.category?.name && (
                      <span className="bg-blue-50 text-blue-700 text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-blue-200">
                        {t.category.name}
                      </span>
                    )}
                    <button
                      onClick={() => handleToggleSave(t.id)}
                      title={savedIds.has(t.id) ? "Remove from Saved" : "Save Tender"}
                      className={`text-xs px-2.5 py-0.5 rounded-full border transition flex items-center gap-1 cursor-pointer ${
                        savedIds.has(t.id)
                          ? "bg-amber-50 text-amber-700 border-amber-300 font-semibold"
                          : "bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>{savedIds.has(t.id) ? "★" : "☆"}</span>
                      <span>{savedIds.has(t.id) ? "Saved" : "Save"}</span>
                    </button>
                  </div>
                </div>

                {/* Tender Title */}
                <h2 className="text-sm font-semibold text-slate-900 leading-snug mb-2 hover:text-blue-600 transition">
                  {t.title}
                </h2>

                {/* Department */}
                <p className="text-slate-500 text-xs mb-3 flex items-start gap-1.5 line-clamp-2">
                  <span className="shrink-0">🏛️</span>
                  <span>{t.department}</span>
                </p>

                {/* AI Summary Section */}
                <div className="mb-3">
                  <button
                    onClick={() => handleSummarize(t.id)}
                    disabled={summarizingId === t.id}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition disabled:opacity-60 cursor-pointer"
                  >
                    {summarizingId === t.id ? (
                      <>
                        <span className="animate-spin text-xs">⚙️</span>
                        <span>Analyzing tender...</span>
                      </>
                    ) : t.summary ? (
                      <>
                        <span>✨</span>
                        <span>{expandedSummaries[t.id] ? "Hide Summary" : "View AI Summary"}</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Summarize with AI</span>
                      </>
                    )}
                  </button>

                  {/* Summary Box */}
                  {expandedSummaries[t.id] && t.summary && (
                    <div className="mt-2.5 p-3.5 bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-slate-50 border border-indigo-100 rounded-lg text-xs">
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-indigo-100/60">
                        <span className="font-semibold text-indigo-900 flex items-center gap-1 text-[11px]">
                          <span>🤖</span>
                          <span>AI Intelligence Breakdown</span>
                        </span>
                        <span className="text-[10px] text-indigo-600 bg-indigo-100/70 px-1.5 py-0.5 rounded font-medium">
                          Gemini 1.5
                        </span>
                      </div>
                      <div className="whitespace-pre-line leading-relaxed text-slate-700 font-normal">
                        {t.summary}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Deadline & Direct Portal Link */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                {(() => {
                  const dInfo = formatDeadline(t.deadline);
                  return (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-500 flex items-center gap-1">
                        <span>📅</span>
                        <span>
                          Deadline:{" "}
                          <strong className="text-slate-700">
                            {dInfo.text}
                          </strong>
                        </span>
                      </span>
                      {dInfo.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            dInfo.urgency === "urgent"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {dInfo.badge}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {t.sourceUrl && (
                  <a
                    href={t.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline transition shrink-0"
                  >
                    View Portal ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;