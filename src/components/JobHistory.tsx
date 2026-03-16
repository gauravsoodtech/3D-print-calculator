"use client";

import { useEffect, useState } from "react";
import { exportJobsCSV, PrintJob } from "@/lib/storage";

const fmt = (n: number) =>
  "₹" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`bg-zinc-900 border ${color} rounded-2xl p-4`}>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-bold text-zinc-100 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// Simple filament type badge colors
const TYPE_COLORS: Record<string, string> = {
  PLA:      "bg-green-500/15 text-green-400 border-green-500/20",
  "PLA+":   "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  PETG:     "bg-blue-500/15 text-blue-400 border-blue-500/20",
  ABS:      "bg-orange-500/15 text-orange-400 border-orange-500/20",
  ASA:      "bg-amber-500/15 text-amber-400 border-amber-500/20",
  TPU:      "bg-purple-500/15 text-purple-400 border-purple-500/20",
  Nylon:    "bg-pink-500/15 text-pink-400 border-pink-500/20",
  "Silk PLA": "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Carbon:   "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_COLORS[type] ?? "bg-zinc-700/40 text-zinc-400 border-zinc-600/30";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {type}
    </span>
  );
}

export default function JobHistory() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("unexpected response");
        setJobs(data.map((j: PrintJob & { date: string | Date }) => ({
          ...j,
          date: typeof j.date === "string" ? j.date : new Date(j.date).toISOString(),
        })));
        setLoading(false);
      })
      .catch(() => {
        setFetchError(true);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string) {
    if (deleteConfirm === id) {
      await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      // Auto-cancel after 2s
      setTimeout(() => setDeleteConfirm(null), 2000);
    }
  }

  const totalRevenue = jobs.reduce((s, j) => s + j.sellingPrice, 0);
  const totalProfit = jobs.reduce((s, j) => s + j.profit, 0);
  const avgMarkup = jobs.length > 0
    ? jobs.reduce((s, j) => s + j.markupPercent, 0) / jobs.length
    : 0;

  if (loading) {
    return <div className="text-zinc-500 text-sm py-24 text-center">Loading history…</div>;
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-zinc-300">Could not load history</p>
        <p className="text-sm text-zinc-600 mt-1">Check your connection and try refreshing the page.</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl mb-4">
          📋
        </div>
        <p className="text-lg font-semibold text-zinc-300">No saved jobs yet</p>
        <p className="text-sm text-zinc-600 mt-1">
          Save a print job from the Calculator to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Jobs"
          value={String(jobs.length)}
          color="border-zinc-800"
        />
        <StatCard
          label="Total Revenue"
          value={fmt(totalRevenue)}
          color="border-orange-500/20"
        />
        <StatCard
          label="Total Profit"
          value={fmt(totalProfit)}
          sub={totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin` : undefined}
          color={totalProfit >= 0 ? "border-emerald-500/20" : "border-red-500/20"}
        />
        <StatCard
          label="Avg Markup"
          value={`${avgMarkup.toFixed(0)}%`}
          color="border-zinc-800"
        />
      </div>

      {/* Table header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => exportJobsCSV(jobs)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700/60 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <span>↓</span> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-800">
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-widest">Job</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-widest">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-widest">Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-widest">Cost</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-widest">Sell</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-widest">Profit</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-widest">Mkup</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="border-t border-zinc-800/60 hover:bg-zinc-800/30 transition-colors group"
              >
                <td className="px-4 py-3 font-medium text-zinc-100 max-w-[140px] truncate">{job.name}</td>
                <td className="px-4 py-3">
                  <TypeBadge type={job.filamentType} />
                </td>
                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap text-xs">
                  {new Date(job.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{fmt(job.totalCost)}</td>
                <td className="px-4 py-3 text-right text-orange-400 font-semibold tabular-nums">{fmt(job.sellingPrice)}</td>
                <td className={`px-4 py-3 text-right font-medium tabular-nums ${job.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fmt(job.profit)}
                </td>
                <td className="px-4 py-3 text-right text-zinc-500 text-xs">{job.markupPercent}%</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(job.id)}
                    className={`text-xs px-2 py-0.5 rounded transition-all ${
                      deleteConfirm === job.id
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100"
                    }`}
                    title={deleteConfirm === job.id ? "Click again to confirm" : "Delete"}
                  >
                    {deleteConfirm === job.id ? "Sure?" : "✕"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
