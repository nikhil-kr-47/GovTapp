import api from "../api.js";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Dashboard() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/tenders/matching")
      .then((res) => {
        setTenders(res.data);
      })
      .catch((err) => {
        console.error("Failed fetching tenders:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter tenders matching the search query
  const filteredTenders = tenders.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q) ||
      t.referenceNo.toLowerCase().includes(q) ||
      (t.category?.name && t.category.name.toLowerCase().includes(q))
    );
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
      {/* Header & Search Bar */}
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
          <p className="text-slate-500 text-xs">
            Live tenders scraped from eprocure.gov.in matching your selected industries.
          </p>
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
      {filteredTenders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            {search ? "No tenders found" : "No matching tenders yet"}
          </h3>
          <p className="text-slate-500 text-xs mb-6">
            {search
              ? `No tenders match "${search}". Try searching a different keyword.`
              : "We haven't found tenders for your currently selected categories yet."}
          </p>
          {search ? (
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
          {filteredTenders.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                {/* Reference Number & Category Tag */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2.5 py-1 rounded font-medium">
                    {t.referenceNo}
                  </span>
                  {t.category?.name && (
                    <span className="bg-blue-50 text-blue-700 text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-blue-200">
                      {t.category.name}
                    </span>
                  )}
                </div>

                {/* Tender Title */}
                <h2 className="text-sm font-semibold text-slate-900 leading-snug mb-2 hover:text-blue-600 transition">
                  {t.title}
                </h2>

                {/* Department */}
                <p className="text-slate-500 text-xs mb-4 flex items-start gap-1.5 line-clamp-2">
                  <span className="shrink-0">🏛️</span>
                  <span>{t.department}</span>
                </p>
              </div>

              {/* Card Footer: Deadline & Direct Portal Link */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <span>📅</span>
                  <span>
                    Deadline:{" "}
                    <strong className="text-slate-700">
                      {t.deadline
                        ? new Date(t.deadline).toLocaleDateString()
                        : "Refer to portal"}
                    </strong>
                  </span>
                </span>

                {t.sourceUrl && (
                  <a
                    href={t.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline transition"
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