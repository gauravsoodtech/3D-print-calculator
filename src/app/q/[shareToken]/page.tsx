import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { R2_PUBLIC_BASE_URL } from "@/lib/r2";
import STLViewerClient from "@/components/STLViewerClient";

interface QuotationItemRow {
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

const fmt = (n: number) =>
  "₹" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function fmtTime(mins: number) {
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}


export default async function PublicQuotationPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const quotation = await db.quotation.findUnique({
    where: { shareToken },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!quotation) notFound();

  const items = quotation.items as QuotationItemRow[];
  const total = items.reduce((sum, i) => sum + i.sellingPrice, 0);

  const dateStr = new Date(quotation.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-orange-500 text-lg">⬡</span>
            <span className="font-bold text-sm tracking-tight">
              <span className="text-orange-400">miniory</span>
              <span className="text-zinc-100">3D</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/miniory3d"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-orange-400 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @miniory3d
            </a>
            <div className="text-xs text-zinc-600">{dateStr}</div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Quotation header */}
        <div className="mb-10">
          <p className="text-xs font-mono text-orange-500/70 tracking-widest uppercase mb-2">
            Quotation · {quotation.quotationNumber}
          </p>
          <h1 className="text-3xl font-bold text-zinc-100 leading-tight">
            For{" "}
            <span className="text-orange-400">{quotation.clientName}</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Items */}
        <div className="space-y-5">
          {items.length === 0 ? (
            <div className="py-20 text-center text-zinc-600 text-sm">
              No items in this quotation yet.
            </div>
          ) : (
            items.map((item, idx) => {
              const stlUrl = item.stlKey
                ? `${R2_PUBLIC_BASE_URL}/${item.stlKey}`
                : null;

              return (
                <div
                  key={item.id}
                  className="bg-zinc-900 border border-zinc-800/70 rounded-2xl overflow-hidden flex flex-col md:flex-row"
                >
                  {/* Left: 3D viewer or placeholder */}
                  <div className="md:w-[45%] shrink-0 bg-zinc-950 flex items-center justify-center h-[280px] md:h-auto md:self-stretch relative">
                    {stlUrl ? (
                      <STLViewerClient stlUrl={stlUrl} />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-zinc-700">
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                        >
                          <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          <path d="M2 17l10 5 10-5" />
                          <path d="M2 12l10 5 10-5" />
                        </svg>
                        <span className="text-xs font-mono tracking-wide">
                          No 3D model
                        </span>
                      </div>
                    )}
                    {/* Item number badge */}
                    <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-[10px] font-mono text-zinc-500">
                      {idx + 1}
                    </div>
                  </div>

                  {/* Right: details */}
                  <div className="flex-1 p-6 flex flex-col justify-between gap-5">
                    {/* Name */}
                    <h2 className="text-xl font-bold text-white leading-tight">
                      {item.itemName}
                    </h2>

                    {/* Specs grid — all 5 fields in same style */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-950/60 rounded-xl p-3 text-center">
                        <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">
                          Material
                        </p>
                        <p className="text-sm font-bold text-zinc-100">
                          {item.filamentType}
                        </p>
                      </div>
                      <div className="bg-zinc-950/60 rounded-xl p-3 text-center">
                        <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">
                          Quality
                        </p>
                        <p className="text-sm font-bold text-zinc-100">
                          {item.quality}
                        </p>
                      </div>
                      <div className="bg-zinc-950/60 rounded-xl p-3 text-center">
                        <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">
                          Infill
                        </p>
                        <p className="text-sm font-bold text-zinc-100">
                          {item.infillPercent}%
                        </p>
                      </div>
                      <div className="bg-zinc-950/60 rounded-xl p-3 text-center">
                        <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">
                          Print time
                        </p>
                        <p className="text-sm font-bold text-zinc-100">
                          {fmtTime(item.printMinutes)}
                        </p>
                      </div>
                      <div className="bg-zinc-950/60 rounded-xl p-3 text-center">
                        <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">
                          Weight
                        </p>
                        <p className="text-sm font-bold text-zinc-100">
                          {item.weightGrams}g
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-end justify-between border-t border-zinc-800/50 pt-4">
                      <span className="text-xs text-zinc-600 uppercase tracking-widest">
                        Price
                      </span>
                      <span className="text-2xl font-bold text-orange-400 tabular-nums">
                        {fmt(item.sellingPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Total */}
        {items.length > 1 && (
          <div className="mt-5 bg-zinc-900 border border-orange-900/30 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-widest mb-0.5">
                Total
              </p>
              <p className="text-sm text-zinc-400">
                {items.length} items
              </p>
            </div>
            <span className="text-3xl font-bold text-orange-400 tabular-nums">
              {fmt(total)}
            </span>
          </div>
        )}

        <p className="mt-10 text-xs text-zinc-700 text-center">
          miniory3D · Prices in INR (₹) · Valid for 30 days
        </p>
      </main>
    </div>
  );
}
