"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface QuotationItem {
  id: string;
  itemName: string;
  sellingPrice: number;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  clientName: string;
  shareToken: string;
  createdAt: string;
  items: QuotationItem[];
}

const fmt = (n: number) =>
  "₹" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function AdminPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/quotations")
      .then((r) => r.json())
      .then((data) => {
        setQuotations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this quotation and all its items?")) return;
    await fetch(`/api/quotations/${id}`, { method: "DELETE" });
    setQuotations((prev) => prev.filter((q) => q.id !== id));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function copyShareLink(shareToken: string, id: string) {
    const url = `${window.location.origin}/q/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Quotations</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage client quotations</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/quotations/new"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-semibold transition-all"
          >
            + New Quotation
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all"
          >
            Sign out
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm py-12 text-center">Loading…</div>
      ) : quotations.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-500 text-sm">No quotations yet.</p>
          <Link
            href="/admin/quotations/new"
            className="mt-4 inline-block px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-semibold transition-all"
          >
            Create your first quotation
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quotations.map((q) => {
            const total = q.items.reduce((sum, i) => sum + i.sellingPrice, 0);
            return (
              <div
                key={q.id}
                className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-zinc-100">{q.quotationNumber}</span>
                    <span className="text-sm text-zinc-400">{q.clientName}</span>
                    <span className="text-xs text-zinc-600">
                      {new Date(q.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-500">{q.items.length} item{q.items.length !== 1 ? "s" : ""}</span>
                    {total > 0 && (
                      <span className="text-xs text-orange-400 font-medium">{fmt(total)} total</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyShareLink(q.shareToken, q.id)}
                    className="px-3 py-1.5 text-xs font-medium border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-100 rounded-lg transition-all"
                  >
                    {copiedId === q.id ? "Copied!" : "Copy Link"}
                  </button>
                  <Link
                    href={`/admin/quotations/${q.id}`}
                    className="px-3 py-1.5 text-xs font-medium border border-zinc-700 hover:border-orange-500/50 text-zinc-400 hover:text-orange-400 rounded-lg transition-all"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="px-3 py-1.5 text-xs font-medium border border-zinc-700 hover:border-red-500/50 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
