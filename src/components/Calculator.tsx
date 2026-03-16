"use client";

import { useEffect, useState } from "react";
import { loadSettings } from "@/lib/storage";
import { calculateJob, toPrintJob, JobCalcResult } from "@/lib/calculations";
import CostBreakdown from "./CostBreakdown";
import { QuotationItemDraft } from "@/lib/types";

const QUALITY_OPTIONS = ["Draft", "Standard", "Fine", "Ultra"] as const;

const DRAFT_KEY = "print_calc_form_draft";

const ZERO_RESULT: JobCalcResult = {
  materialCost: 0,
  laborCost: 0,
  electricityCost: 0,
  postProcessingCost: 0,
  packagingCost: 0,
  totalCost: 0,
  sellingPrice: 0,
  profit: 0,
  marginPercent: 0,
};

export const FILAMENT_PRESETS = [
  { label: "PLA",      price: 1000 },
  { label: "PLA+",     price: 1200 },
  { label: "PETG",     price: 1400 },
  { label: "ABS",      price: 1100 },
  { label: "ASA",      price: 1500 },
  { label: "TPU",      price: 1800 },
  { label: "Nylon",    price: 2500 },
  { label: "Silk PLA", price: 1400 },
  { label: "Carbon",   price: 4000 },
];

function num(v: string) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function InputField({
  label, value, onChange, placeholder, prefix, hint, type = "number",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; prefix?: string; hint?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <div className="flex">
        {prefix && (
          <span className="flex items-center bg-zinc-800 border border-zinc-700/60 border-r-0 rounded-l-xl px-2.5 text-xs text-zinc-500 whitespace-nowrap select-none shrink-0">
            {prefix}
          </span>
        )}
        <input
          type={type}
          min={type === "number" ? "0" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`bg-zinc-800/60 border border-zinc-700/60 text-sm text-zinc-100 placeholder-zinc-600
            focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all
            ${prefix ? "rounded-r-xl flex-1 min-w-0 px-3 py-2.5" : "rounded-xl w-full px-3 py-2.5"}`}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

function TimeField({
  label, hours, minutes, onHours, onMinutes,
}: {
  label: string; hours: string; minutes: string;
  onHours: (v: string) => void; onMinutes: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input type="number" min="0" value={hours} onChange={(e) => onHours(e.target.value)} placeholder="0"
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 px-3 py-2.5 pr-10
              focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">hr</span>
        </div>
        <div className="relative flex-1">
          <input type="number" min="0" max="59" value={minutes} onChange={(e) => onMinutes(e.target.value)} placeholder="0"
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 px-3 py-2.5 pr-10
              focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">min</span>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Calculator() {
  const [name, setName] = useState("");
  const [filamentType, setFilamentType] = useState("PLA");
  const [customFilament, setCustomFilament] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [weightGrams, setWeightGrams] = useState("");
  const [filamentPricePerKg, setFilamentPricePerKg] = useState("");
  const [printHours, setPrintHours] = useState("");
  const [printMins, setPrintMins] = useState("");
  const [printerWatts, setPrinterWatts] = useState("");
  const [electricityRate, setElectricityRate] = useState("");
  const [laborHours, setLaborHours] = useState("");
  const [laborMins, setLaborMins] = useState("");
  const [laborRate, setLaborRate] = useState("");
  const [postProcessing, setPostProcessing] = useState("");
  const [packaging, setPackaging] = useState("");
  const [markup, setMarkup] = useState("");
  const [quality, setQuality] = useState("Standard");
  const [infillPercent, setInfillPercent] = useState("15");
  const [result, setResult] = useState<JobCalcResult>(ZERO_RESULT);
  const [saved, setSaved] = useState(false);

  // On mount: restore draft from sessionStorage, fallback to settings defaults
  useEffect(() => {
    const s = loadSettings();

    // window flag survives navigation (component unmount/remount) but is cleared on page refresh
    const isNavigation = !!(window as unknown as Record<string, unknown>).__calcFormSession;
    (window as unknown as Record<string, unknown>).__calcFormSession = true;

    if (!isNavigation) {
      // Page was refreshed — clear the draft and start fresh
      sessionStorage.removeItem(DRAFT_KEY);
      setFilamentPricePerKg(String(s.filamentPricePerKg));
      setPrinterWatts(String(s.printerWatts));
      setElectricityRate(String(s.electricityRatePerKwh));
      setLaborRate(String(s.laborRatePerHour));
      setPackaging(String(s.defaultPackagingPercent));
      setMarkup(String(s.markupPercent));
      return;
    }

    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setName(d.name ?? "");
        setFilamentType(d.filamentType ?? "PLA");
        setIsCustom(d.isCustom ?? false);
        setCustomFilament(d.customFilament ?? "");
        setWeightGrams(d.weightGrams ?? "");
        setFilamentPricePerKg(d.filamentPricePerKg ?? String(s.filamentPricePerKg));
        setPrintHours(d.printHours ?? "");
        setPrintMins(d.printMins ?? "");
        setPrinterWatts(d.printerWatts ?? String(s.printerWatts));
        setElectricityRate(d.electricityRate ?? String(s.electricityRatePerKwh));
        setLaborHours(d.laborHours ?? "");
        setLaborMins(d.laborMins ?? "");
        setLaborRate(d.laborRate ?? String(s.laborRatePerHour));
        setPostProcessing(d.postProcessing ?? "");
        setPackaging(d.packaging ?? String(s.defaultPackagingPercent));
        setMarkup(d.markup ?? String(s.markupPercent));
        setQuality(d.quality ?? "Standard");
        setInfillPercent(d.infillPercent ?? "15");
        return;
      } catch { /* fall through to defaults */ }
    }
    // No draft saved yet during this navigation session — load defaults
    setFilamentPricePerKg(String(s.filamentPricePerKg));
    setPrinterWatts(String(s.printerWatts));
    setElectricityRate(String(s.electricityRatePerKwh));
    setLaborRate(String(s.laborRatePerHour));
    setPackaging(String(s.defaultPackagingPercent));
    setMarkup(String(s.markupPercent));
  }, []);

  // Save draft to sessionStorage on every field change
  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      name, filamentType, isCustom, customFilament,
      weightGrams, filamentPricePerKg,
      printHours, printMins, printerWatts, electricityRate,
      laborHours, laborMins, laborRate,
      postProcessing, packaging, markup,
      quality, infillPercent,
    }));
  }, [name, filamentType, isCustom, customFilament, weightGrams, filamentPricePerKg,
      printHours, printMins, printerWatts, electricityRate,
      laborHours, laborMins, laborRate, postProcessing, packaging, markup,
      quality, infillPercent]);

  // Recalculate live
  useEffect(() => {
    const r = calculateJob({
      name,
      filamentType,
      weightGrams: num(weightGrams),
      filamentPricePerKg: num(filamentPricePerKg),
      printMinutes: num(printHours) * 60 + num(printMins),
      printerWatts: num(printerWatts),
      electricityRatePerKwh: num(electricityRate),
      laborMinutes: num(laborHours) * 60 + num(laborMins),
      laborRatePerHour: num(laborRate),
      postProcessingCost: num(postProcessing),
      packagingPercent: num(packaging),
      markupPercent: num(markup),
    });
    setResult(r);
    setSaved(false);
  }, [name, filamentType, weightGrams, filamentPricePerKg,
      printHours, printMins, printerWatts, electricityRate,
      laborHours, laborMins, laborRate, postProcessing, packaging, markup]);

  function selectPreset(label: string) {
    setFilamentType(label);
    setIsCustom(false);
    const preset = FILAMENT_PRESETS.find((p) => p.label === label)!;
    const currentIsPresetPrice = FILAMENT_PRESETS.some((p) => String(p.price) === filamentPricePerKg);
    if (!filamentPricePerKg || currentIsPresetPrice) {
      setFilamentPricePerKg(String(preset.price));
    }
  }

  function selectCustom() {
    setIsCustom(true);
    setFilamentType(customFilament);
  }

  async function handleSave() {
    const job = toPrintJob(
      {
        name: name.trim() || "Unnamed Job",
        filamentType,
        weightGrams: num(weightGrams),
        filamentPricePerKg: num(filamentPricePerKg),
        printMinutes: num(printHours) * 60 + num(printMins),
        printerWatts: num(printerWatts),
        electricityRatePerKwh: num(electricityRate),
        laborMinutes: num(laborHours) * 60 + num(laborMins),
        laborRatePerHour: num(laborRate),
        postProcessingCost: num(postProcessing),
        packagingPercent: num(packaging),
        markupPercent: num(markup),
      },
      result
    );
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      if (res.ok) setSaved(true);
    } catch {
      // network error — silent fail, button stays enabled so user can retry
    }
  }

  const perGramPrice = num(filamentPricePerKg) > 0
    ? `₹${(num(filamentPricePerKg) / 1000).toFixed(2)}/g`
    : null;
  const suggestedPresetPrice = !isCustom
    ? FILAMENT_PRESETS.find((p) => p.label === filamentType)?.price
    : null;
  const priceHint =
    suggestedPresetPrice && String(suggestedPresetPrice) !== filamentPricePerKg
      ? `Typical ${filamentType}: ₹${suggestedPresetPrice}/kg`
      : perGramPrice ? `= ${perGramPrice}` : undefined;

  const printTotalMins = num(printHours) * 60 + num(printMins);
  const elecCostHint = printTotalMins > 0 && num(printerWatts) > 0 && num(electricityRate) > 0
    ? `≈ ₹${((num(printerWatts) / 1000) * (printTotalMins / 60) * num(electricityRate)).toFixed(2)} for this job`
    : undefined;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">New Print Job</h1>
        <p className="text-sm text-zinc-500 mt-1">Fill in the details — cost updates live as you type</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-4">

          {/* Job Info */}
          <SectionCard title="Job Info" icon="📋">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <InputField type="text" label="Print Name" value={name} onChange={setName} placeholder="e.g. Dragon figurine" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-2">Filament Type</label>
                <div className="flex flex-wrap gap-2">
                  {FILAMENT_PRESETS.map(({ label }) => (
                    <button key={label} type="button" onClick={() => selectPreset(label)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                        filamentType === label && !isCustom
                          ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                          : "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                      }`}>
                      {label}
                    </button>
                  ))}
                  <button type="button" onClick={selectCustom}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                      isCustom
                        ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                        : "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                    }`}>
                    Other
                  </button>
                </div>
                {isCustom && (
                  <input type="text" value={customFilament} autoFocus
                    onChange={(e) => { setCustomFilament(e.target.value); setFilamentType(e.target.value); }}
                    placeholder="e.g. HIPS, PC, PVA…"
                    className="mt-2 w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600
                      px-3 py-2.5 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all max-w-xs" />
                )}
              </div>
            </div>
          </SectionCard>

          {/* Material */}
          <SectionCard title="Material" icon="🧵">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Filament Price" value={filamentPricePerKg} onChange={setFilamentPricePerKg}
                placeholder="1200" prefix="₹/kg" hint={priceHint} />
              <InputField label="Weight Used" value={weightGrams} onChange={setWeightGrams}
                placeholder="50" prefix="g" />
              <InputField label="Infill %" value={infillPercent} onChange={setInfillPercent}
                placeholder="15" hint="Display only — does not affect cost" />
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Quality</label>
                <div className="flex gap-2">
                  {QUALITY_OPTIONS.map((q) => (
                    <button key={q} type="button" onClick={() => setQuality(q)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        quality === q
                          ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                          : "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                      }`}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Time & Electricity */}
          <SectionCard title="Time & Electricity" icon="⚡">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TimeField label="Print Time" hours={printHours} minutes={printMins}
                onHours={setPrintHours} onMinutes={setPrintMins} />
              <TimeField label="Active Labor Time" hours={laborHours} minutes={laborMins}
                onHours={setLaborHours} onMinutes={setLaborMins} />
              <InputField label="Labor Rate" value={laborRate} onChange={setLaborRate}
                placeholder="200" prefix="₹/hr" />
              <InputField label="Printer Power" value={printerWatts} onChange={setPrinterWatts}
                placeholder="350" prefix="W" hint="Bambu P2S avg ≈ 200W (PLA), peak 1200W" />
              <InputField label="Electricity Rate" value={electricityRate} onChange={setElectricityRate}
                placeholder="6.5" prefix="₹/kWh" hint={elecCostHint ?? "Delhi: ₹6.50/kWh (401–800 units)"} />
            </div>
          </SectionCard>

          {/* Other Costs */}
          <SectionCard title="Other Costs" icon="📦">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField label="Post-processing" value={postProcessing} onChange={setPostProcessing}
                placeholder="0" prefix="₹" hint="Sanding, painting, IPA…" />
              <InputField label="Packaging" value={packaging} onChange={setPackaging}
                placeholder="20" prefix="%" hint="% of subtotal" />
              <InputField label="Markup" value={markup} onChange={setMarkup}
                placeholder="40" prefix="%" hint="Profit margin on top of cost" />
            </div>
          </SectionCard>
        </div>

        {/* Results */}
        <div className="lg:sticky lg:top-20 order-first lg:order-none">
          <CostBreakdown
            result={result}
            onSave={handleSave}
            canSave={result.totalCost > 0 && !saved}
            saved={saved}
            currentInputs={{
              itemName: name.trim() || "Unnamed Job",
              filamentType,
              quality,
              infillPercent: num(infillPercent),
              printMinutes: num(printHours) * 60 + num(printMins),
              weightGrams: num(weightGrams),
              sellingPrice: result.sellingPrice,
            } satisfies QuotationItemDraft}
          />
        </div>
      </div>
    </div>
  );
}
