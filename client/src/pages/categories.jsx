import { useState, useEffect } from "react";
import api from "../api.js";
import { useNavigate } from "react-router-dom";

// Sector icons mapping
const CATEGORY_ICONS = {
  "Defense & Aerospace": "🛡️",
  "Railways & Transport": "🚆",
  "Electrical & Electronics": "⚡",
  "Healthcare & Medical Supplies": "🏥",
  "Information Technology & Software": "💻",
  "Civil Construction": "🏗️",
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all categories and user's existing selections in parallel
    Promise.all([
      api.get("/categories"),
      api.get("/categories/mine").catch(() => ({ data: [] })), // Falls back safely if /mine isn't added yet
    ])
      .then(([allRes, mineRes]) => {
        setCategories(allRes.data);
        if (Array.isArray(mineRes.data) && mineRes.data.length > 0) {
          setSelected(mineRes.data);
        }
      })
      .catch((err) => console.error("Failed loading categories:", err))
      .finally(() => setLoading(false));
  }, []);

  function toggle(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function handleSelectAll() {
    if (selected.length === categories.length) {
      setSelected([]); // Deselect all
    } else {
      setSelected(categories.map((c) => c.id)); // Select all
    }
  }

  async function handleSave() {
    if (selected.length === 0) {
      alert("Please select at least one category to receive relevant tenders!");
      return;
    }

    setSaving(true);
    try {
      await api.post("/categories/select", { catIds: selected });
      navigate("/dashboard");
    } catch (err) {
        console.log(err);
      alert("Failed saving preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-slate-500 font-medium">
        Loading industries & categories...
      </div>
    );
  }

  const allSelected = categories.length > 0 && selected.length === categories.length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Select Your Sectors
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Choose the government industries you want to monitor. We'll personalize
          your dashboard feed and email alerts automatically.
        </p>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {selected.length} of {categories.length} selected
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {categories.map((cat) => {
          const isChecked = selected.includes(cat.id);
          const icon = CATEGORY_ICONS[cat.name] || "📋";

          return (
            <div
              key={cat.id}
              onClick={() => toggle(cat.id)}
              className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none flex flex-col justify-between ${
                isChecked
                  ? "bg-blue-50/60 border-blue-600 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{icon}</span>
                {/* Custom Checkbox circle */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                    isChecked
                      ? "bg-blue-600 text-white"
                      : "border border-slate-300 bg-white"
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="w-3.5 h-3.5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  )}
                </div>
              </div>

              <div>
                <h3
                  className={`text-sm font-semibold leading-tight ${
                    isChecked ? "text-blue-950" : "text-slate-800"
                  }`}
                >
                  {cat.name}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Save Action */}
      <div className="flex justify-end pt-6 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg shadow transition cursor-pointer flex items-center gap-2"
        >
          {saving ? "Saving..." : "Save Preferences & Go to Dashboard →"}
        </button>
      </div>
    </div>
  );
}

export default Categories;