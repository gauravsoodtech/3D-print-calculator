"use client";

import { useEffect, useState } from "react";
import { QuotationItemDraft } from "@/lib/types";

interface Quotation {
  id: string;
  quotationNumber: string;
  clientName: string;
}

interface Props {
  draft: QuotationItemDraft;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddToQuotationModal({ draft, onClose, onAdded }: Props) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    fetch("/api/quotations")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setQuotations(list);
        if (list.length > 0) setSelectedId(list[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleAdd() {
    if (!selectedId) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/quotations/${selectedId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (res.ok) {
      onAdded();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to add item");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-100">Add to Quotation</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors text-xl leading-none">×</button>
        </div>

        {/* Item summary */}
        <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-3 mb-4 space-y-1">
          <p className="text-sm font-medium text-zinc-200">{draft.itemName || "Unnamed Job"}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">{draft.filamentType}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">{draft.quality}</span>
            <span className="text-xs text-zinc-500">{draft.infillPercent}% infill</span>
            <span className="text-xs text-zinc-500">{draft.weightGrams}g</span>
          </div>
          <p className="text-sm text-orange-400 font-semibold">
            ₹{draft.sellingPrice.toFixed(2)}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500 py-4 text-center">Loading quotations…</p>
        ) : quotations.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-zinc-500 mb-3">No quotations yet.</p>
            <a
              href="/admin/quotations/new"
              target="_blank"
              className="text-sm text-orange-400 hover:text-orange-300 underline"
            >
              Create one first
            </a>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Select Quotation</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100
                  px-3 py-2.5 focus:outline-none focus:border-orange-500/60 transition-all"
              >
                {quotations.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.quotationNumber} — {q.clientName}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleAdd}
                disabled={saving || !selectedId}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {saving ? "Adding…" : "Add Item"}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
