"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewQuotationPage() {
  const router = useRouter();
  const [quotationNumber, setQuotationNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quotationNumber: quotationNumber.trim(), clientName: clientName.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/quotations/${data.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create quotation");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← Quotations
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-lg font-semibold text-zinc-100">New Quotation</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Quotation Number</label>
          <input
            type="text"
            value={quotationNumber}
            onChange={(e) => setQuotationNumber(e.target.value)}
            placeholder="e.g. Q-2025-001"
            required
            autoFocus
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600
              px-3 py-2.5 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Client Name</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            required
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600
              px-3 py-2.5 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Quotation"}
          </button>
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
