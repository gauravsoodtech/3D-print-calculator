"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import QuotationItemForm from "@/components/QuotationItemForm";
import STLUploadButton from "@/components/STLUploadButton";

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

interface Quotation {
  id: string;
  quotationNumber: string;
  clientName: string;
  shareToken: string;
  items: QuotationItem[];
}

const fmt = (n: number) =>
  "₹" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function fmtTime(mins: number) {
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<QuotationItem | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaNumber, setMetaNumber] = useState("");
  const [metaClient, setMetaClient] = useState("");

  useEffect(() => {
    fetch(`/api/quotations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setQuotation(data);
        setMetaNumber(data.quotationNumber ?? "");
        setMetaClient(data.clientName ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function saveMeta() {
    const res = await fetch(`/api/quotations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quotationNumber: metaNumber, clientName: metaClient }),
    });
    if (res.ok) {
      const data = await res.json();
      setQuotation(data);
      setEditingMeta(false);
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/quotations/${id}/items/${itemId}`, { method: "DELETE" });
    setQuotation((prev) =>
      prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : prev
    );
  }

  function copyShareLink() {
    if (!quotation) return;
    navigator.clipboard.writeText(`${window.location.origin}/q/${quotation.shareToken}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleItemSaved(item: QuotationItem) {
    setQuotation((prev) => {
      if (!prev) return prev;
      const exists = prev.items.some((i) => i.id === item.id);
      return {
        ...prev,
        items: exists
          ? prev.items.map((i) => (i.id === item.id ? item : i))
          : [...prev.items, item],
      };
    });
    setShowItemForm(false);
    setEditingItem(null);
  }

  function handleStlConfirmed(itemId: string, stlKey: string) {
    setQuotation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((i) => (i.id === itemId ? { ...i, stlKey } : i)),
      };
    });
  }

  if (loading) {
    return <div className="text-zinc-500 text-sm py-12 text-center">Loading…</div>;
  }

  if (!quotation) {
    return (
      <div className="text-zinc-500 text-sm py-12 text-center">
        Quotation not found. <Link href="/admin" className="text-orange-400 hover:underline">Back to list</Link>
      </div>
    );
  }

  const total = quotation.items.reduce((sum, i) => sum + i.sellingPrice, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
              ← Quotations
            </Link>
            <span className="text-zinc-700">/</span>
            {editingMeta ? (
              <div className="flex items-center gap-2">
                <input
                  value={metaNumber}
                  onChange={(e) => setMetaNumber(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-orange-500/60 w-32"
                />
                <input
                  value={metaClient}
                  onChange={(e) => setMetaClient(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-orange-500/60 w-40"
                />
                <button onClick={saveMeta} className="text-xs text-orange-400 hover:text-orange-300">Save</button>
                <button onClick={() => setEditingMeta(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setEditingMeta(true)}
                className="flex items-center gap-2 group"
              >
                <h1 className="text-lg font-semibold text-zinc-100 group-hover:text-orange-400 transition-colors">
                  {quotation.quotationNumber}
                </h1>
                <span className="text-zinc-400 text-sm">{quotation.clientName}</span>
                <span className="text-xs text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
              </button>
            )}
          </div>
          {total > 0 && (
            <p className="text-sm text-zinc-500 ml-0">
              {quotation.items.length} item{quotation.items.length !== 1 ? "s" : ""} · {fmt(total)} total
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyShareLink}
            className="px-3 py-1.5 text-xs font-medium border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-100 rounded-lg transition-all"
          >
            {copiedLink ? "Copied!" : "Copy Client Link"}
          </button>
          <a
            href={`/q/${quotation.shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-100 rounded-lg transition-all"
          >
            Preview
          </a>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {quotation.items.map((item) => (
          <div key={item.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-zinc-100">{item.itemName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300">
                    {item.filamentType}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300">
                    {item.quality}
                  </span>
                  <span className="text-xs text-zinc-500">{item.infillPercent}% infill</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                  <span>{fmtTime(item.printMinutes)} print</span>
                  <span>{item.weightGrams}g</span>
                  <span className="text-orange-400 font-medium text-sm">{fmt(item.sellingPrice)}</span>
                </div>
                {item.stlKey && (
                  <p className="mt-1 text-xs text-emerald-500">✓ STL uploaded</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <STLUploadButton
                  quotationId={quotation.id}
                  itemId={item.id}
                  onConfirmed={(key) => handleStlConfirmed(item.id, key)}
                />
                <button
                  onClick={() => { setEditingItem(item); setShowItemForm(true); }}
                  className="px-3 py-1.5 text-xs font-medium border border-zinc-700 hover:border-orange-500/50 text-zinc-400 hover:text-orange-400 rounded-lg transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="px-3 py-1.5 text-xs font-medium border border-zinc-700 hover:border-red-500/50 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => { setEditingItem(null); setShowItemForm(true); }}
          className="w-full py-4 border-2 border-dashed border-zinc-700 hover:border-orange-500/50 rounded-2xl text-sm text-zinc-500 hover:text-orange-400 transition-all"
        >
          + Add Item
        </button>
      </div>

      {/* Item modal */}
      {showItemForm && (
        <QuotationItemForm
          quotationId={quotation.id}
          item={editingItem}
          onSaved={handleItemSaved}
          onClose={() => { setShowItemForm(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}
