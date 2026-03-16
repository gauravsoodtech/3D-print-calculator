"use client";

import { useState } from "react";
import { JobCalcResult } from "@/lib/calculations";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { QuotationItemDraft } from "@/lib/types";
import dynamic from "next/dynamic";

const AddToQuotationModal = dynamic(() => import("./AddToQuotationModal"), { ssr: false });

const fmt = (n: number) =>
  "₹" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function roundUp(n: number, to: number) {
  return Math.ceil(n / to) * to;
}

interface Props {
  result: JobCalcResult;
  onSave: () => void;
  canSave: boolean;
  saved: boolean;
  currentInputs: QuotationItemDraft;
}

const SEGMENTS = [
  { key: "materialCost",       label: "Material",        color: "bg-orange-500",  text: "text-orange-400" },
  { key: "laborCost",          label: "Labor",           color: "bg-blue-500",    text: "text-blue-400" },
  { key: "electricityCost",    label: "Electricity",     color: "bg-yellow-500",  text: "text-yellow-400" },
  { key: "postProcessingCost", label: "Post-processing", color: "bg-purple-500",  text: "text-purple-400" },
  { key: "packagingCost",      label: "Packaging",       color: "bg-emerald-500", text: "text-emerald-400" },
] as const;

export default function CostBreakdown({ result, onSave, canSave, saved, currentInputs }: Props) {
  const { totalCost, sellingPrice, profit, marginPercent } = result;
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addedToQuotation, setAddedToQuotation] = useState(false);
  const isAdmin = useIsAdmin();

  function copyPrice() {
    navigator.clipboard.writeText(sellingPrice.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const roundedOptions =
    sellingPrice > 0
      ? [
          { label: "₹10", value: roundUp(sellingPrice, 10) },
          { label: "₹50", value: roundUp(sellingPrice, 50) },
          { label: "₹100", value: roundUp(sellingPrice, 100) },
        ].filter((o, i, arr) => o.value !== sellingPrice && arr.findIndex((x) => x.value === o.value) === i)
      : [];

  const hasData = totalCost > 0;

  return (
    <div className="space-y-3">
      {/* Selling price hero */}
      <div className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/20 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs font-medium text-orange-400/70 uppercase tracking-widest">Selling Price</p>
          {hasData && (
            <button
              onClick={copyPrice}
              className="text-xs text-zinc-500 hover:text-orange-400 transition-colors px-2 py-0.5 rounded border border-zinc-700/50 hover:border-orange-500/30"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
        <p className="text-3xl font-bold text-orange-400 num-transition">
          {hasData ? fmt(sellingPrice) : "₹—"}
        </p>
        {/* Rounded suggestions */}
        {roundedOptions.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-zinc-600">Round up to</span>
            {roundedOptions.map((o) => (
              <span
                key={o.value}
                className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300"
                title={`Margin: ${(((o.value - totalCost) / o.value) * 100).toFixed(1)}%`}
              >
                {fmt(o.value)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main breakdown card */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Cost Breakdown</h2>

        {/* Stacked bar */}
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden flex gap-px">
          {hasData
            ? SEGMENTS.map(({ key, color }) => {
                const pct = (result[key] / totalCost) * 100;
                return pct > 0.5 ? (
                  <div
                    key={key}
                    className={`${color} h-full transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                ) : null;
              })
            : <div className="bg-zinc-700 w-full h-full rounded-full" />}
        </div>

        {/* Segment rows */}
        <div className="space-y-2.5">
          {SEGMENTS.map(({ key, label, color, text }) => {
            const pct = hasData && totalCost > 0 ? (result[key] / totalCost) * 100 : 0;
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-sm ${color} shrink-0`} />
                  <span className="text-zinc-400">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {pct > 0.5 && (
                    <span className="text-xs text-zinc-600">{pct.toFixed(0)}%</span>
                  )}
                  <span className={`font-medium tabular-nums ${hasData && result[key] > 0 ? text : "text-zinc-600"}`}>
                    {fmt(result[key])}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="border-t border-zinc-800 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Total Cost</span>
            <span className="font-medium text-zinc-200 tabular-nums">{fmt(totalCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Profit</span>
            <span className={`font-medium tabular-nums ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fmt(profit)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Margin</span>
            <span className={`font-medium tabular-nums ${marginPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {marginPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={!canSave}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
          saved
            ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 cursor-default"
            : canSave
            ? "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
            : "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700"
        }`}
      >
        {saved ? "✓ Saved to History" : "Save Job"}
      </button>

      {/* Add to Quotation — admin only */}
      {isAdmin && (
        <button
          onClick={() => { setShowAddModal(true); setAddedToQuotation(false); }}
          disabled={!hasData || addedToQuotation}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all border ${
            addedToQuotation
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 cursor-default"
              : hasData
              ? "border-zinc-700 hover:border-orange-500/50 text-zinc-400 hover:text-orange-400"
              : "border-zinc-800 text-zinc-700 cursor-not-allowed"
          }`}
        >
          {addedToQuotation ? "✓ Added to Quotation" : "+ Add to Quotation"}
        </button>
      )}

      {showAddModal && (
        <AddToQuotationModal
          draft={currentInputs}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            setAddedToQuotation(true);
          }}
        />
      )}
    </div>
  );
}
