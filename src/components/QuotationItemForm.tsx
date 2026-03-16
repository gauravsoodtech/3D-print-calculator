"use client";

import { useState, useEffect, FormEvent } from "react";

interface QuotationItem {
  id: string;
  itemName: string;
  filamentType: string;
  quality: string;
  infillPercent: number;
  printMinutes: number;
  weightGrams: number;
  sellingPrice: number;
  stlKey: string | null;
  sortOrder: number;
}

interface Props {
  quotationId: string;
  item: QuotationItem | null; // null = new item
  onSaved: (item: QuotationItem) => void;
  onClose: () => void;
}

const QUALITY_OPTIONS = ["Draft", "Standard", "Fine", "Ultra"];
const FILAMENT_TYPES = ["PLA", "PLA+", "PETG", "ABS", "ASA", "TPU", "Nylon", "Silk PLA", "Carbon", "Other"];

export default function QuotationItemForm({ quotationId, item, onSaved, onClose }: Props) {
  const [itemName, setItemName] = useState(item?.itemName ?? "");
  const [filamentType, setFilamentType] = useState(item?.filamentType ?? "PLA");
  const [quality, setQuality] = useState(item?.quality ?? "Standard");
  const [infillPercent, setInfillPercent] = useState(String(item?.infillPercent ?? 15));
  const [printHours, setPrintHours] = useState(String(Math.floor((item?.printMinutes ?? 0) / 60)));
  const [printMins, setPrintMins] = useState(String((item?.printMinutes ?? 0) % 60));
  const [weightGrams, setWeightGrams] = useState(String(item?.weightGrams ?? ""));
  const [sellingPrice, setSellingPrice] = useState(String(item?.sellingPrice ?? ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Lock scroll on open
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const printMinutes = (parseInt(printHours) || 0) * 60 + (parseInt(printMins) || 0);
    const body = {
      itemName: itemName.trim() || "Unnamed Item",
      filamentType,
      quality,
      infillPercent: parseInt(infillPercent) || 15,
      printMinutes,
      weightGrams: parseFloat(weightGrams) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
    };

    let res: Response;
    if (item) {
      res = await fetch(`/api/quotations/${quotationId}/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch(`/api/quotations/${quotationId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    if (res.ok) {
      const saved = await res.json();
      onSaved(saved);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save item");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-100">
            {item ? "Edit Item" : "Add Item"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Dragon figurine"
              autoFocus
              className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600
                px-3 py-2.5 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Filament Type</label>
              <select
                value={filamentType}
                onChange={(e) => setFilamentType(e.target.value)}
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100
                  px-3 py-2.5 focus:outline-none focus:border-orange-500/60 transition-all"
              >
                {FILAMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Infill %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={infillPercent}
                onChange={(e) => setInfillPercent(e.target.value)}
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100
                  px-3 py-2.5 focus:outline-none focus:border-orange-500/60 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Quality</label>
            <div className="flex gap-2">
              {QUALITY_OPTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    quality === q
                      ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                      : "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Print Time</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type="number" min="0" value={printHours} onChange={(e) => setPrintHours(e.target.value)} placeholder="0"
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 px-3 py-2.5 pr-8
                      focus:outline-none focus:border-orange-500/60 transition-all" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">h</span>
                </div>
                <div className="relative flex-1">
                  <input type="number" min="0" max="59" value={printMins} onChange={(e) => setPrintMins(e.target.value)} placeholder="0"
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 px-3 py-2.5 pr-8
                      focus:outline-none focus:border-orange-500/60 transition-all" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">m</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Weight (g)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                placeholder="50"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600
                  px-3 py-2.5 focus:outline-none focus:border-orange-500/60 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Selling Price (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm select-none pointer-events-none">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600
                  pl-7 pr-3 py-2.5 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            >
              {loading ? "Saving…" : item ? "Save Changes" : "Add Item"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
