"use client";

import { useEffect, useState } from "react";
import { loadSettings, saveJob } from "@/lib/storage";
import { calculateJob, toPrintJob, JobCalcResult } from "@/lib/calculations";
import CostBreakdown from "./CostBreakdown";

const ZERO_RESULT: JobCalcResult = {
  materialCost: 0,
  laborCost: 0,
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

const PRESET_LABELS = FILAMENT_PRESETS.map((p) => p.label);

function num(v: string) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// Input with optional left prefix (₹ or %)
function InputField({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  hint,
  type = "number",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm select-none pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          min={type === "number" ? "0" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600
            focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all
            ${prefix ? "pl-7 pr-3 py-2.5" : "px-3 py-2.5"}`}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

// Paired hours + minutes row
function TimeField({
  label,
  hours,
  minutes,
  onHours,
  onMinutes,
}: {
  label: string;
  hours: string;
  minutes: string;
  onHours: (v: string) => void;
  onMinutes: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            min="0"
            value={hours}
            onChange={(e) => onHours(e.target.value)}
            placeholder="0"
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 px-3 py-2.5 pr-10
              focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">hr</span>
        </div>
        <div className="relative flex-1">
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => onMinutes(e.target.value)}
            placeholder="0"
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 px-3 py-2.5 pr-10
              focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all"
          />
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
  const [printMinutes, setPrintMinutes] = useState("");
  const [laborHours, setLaborHours] = useState("");
  const [laborMinutes, setLaborMinutes] = useState("");
  const [laborRate, setLaborRate] = useState("");
  const [postProcessing, setPostProcessing] = useState("");
  const [packaging, setPackaging] = useState("");
  const [markup, setMarkup] = useState("");
  const [result, setResult] = useState<JobCalcResult>(ZERO_RESULT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setFilamentPricePerKg(String(s.filamentPricePerKg));
    setLaborRate(String(s.laborRatePerHour));
    setMarkup(String(s.markupPercent));
    setPackaging(String(s.defaultPackagingPercent));
  }, []);

  useEffect(() => {
    const totalLaborMinutes = num(laborHours) * 60 + num(laborMinutes);
    const r = calculateJob({
      name,
      filamentType,
      weightGrams: num(weightGrams),
      filamentPricePerKg: num(filamentPricePerKg),
      laborMinutes: totalLaborMinutes,
      laborRatePerHour: num(laborRate),
      postProcessingCost: num(postProcessing),
      packagingPercent: num(packaging),
      markupPercent: num(markup),
    });
    setResult(r);
    setSaved(false);
  }, [
    name, filamentType, weightGrams, filamentPricePerKg,
    laborHours, laborMinutes, laborRate, postProcessing, packaging, markup,
  ]);

  function selectPreset(label: string) {
    setFilamentType(label);
    setIsCustom(false);
    // Suggest price only if the field is still at a preset price or empty
    const preset = FILAMENT_PRESETS.find((p) => p.label === label)!;
    const currentIsPresetPrice = FILAMENT_PRESETS.some(
      (p) => String(p.price) === filamentPricePerKg
    );
    if (!filamentPricePerKg || currentIsPresetPrice) {
      setFilamentPricePerKg(String(preset.price));
    }
  }

  function selectCustom() {
    setIsCustom(true);
    setFilamentType(customFilament);
  }

  function handleSave() {
    const totalLaborMinutes = num(laborHours) * 60 + num(laborMinutes);
    const job = toPrintJob(
      {
        name: name.trim() || "Unnamed Job",
        filamentType,
        weightGrams: num(weightGrams),
        filamentPricePerKg: num(filamentPricePerKg),
        laborMinutes: totalLaborMinutes,
        laborRatePerHour: num(laborRate),
        postProcessingCost: num(postProcessing),
        packagingPercent: num(packaging),
        markupPercent: num(markup),
      },
      result
    );
    saveJob(job);
    setSaved(true);
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
      : perGramPrice
      ? `= ${perGramPrice}`
      : undefined;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">New Print Job</h1>
        <p className="text-sm text-zinc-500 mt-1">Fill in the details — cost updates live as you type</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ── Form ── */}
        <div className="space-y-4">

          {/* Job Info */}
          <SectionCard title="Job Info" icon="📋">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <InputField
                  type="text"
                  label="Print Name"
                  value={name}
                  onChange={setName}
                  placeholder="e.g. Dragon figurine"
                />
              </div>

              {/* Filament type pills */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-2">Filament Type</label>
                <div className="flex flex-wrap gap-2">
                  {FILAMENT_PRESETS.map(({ label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => selectPreset(label)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                        filamentType === label && !isCustom
                          ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                          : "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={selectCustom}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                      isCustom
                        ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                        : "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                    }`}
                  >
                    Other
                  </button>
                </div>
                {isCustom && (
                  <input
                    type="text"
                    value={customFilament}
                    onChange={(e) => {
                      setCustomFilament(e.target.value);
                      setFilamentType(e.target.value);
                    }}
                    placeholder="e.g. HIPS, PC, PVA…"
                    autoFocus
                    className="mt-2 w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600
                      px-3 py-2.5 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all max-w-xs"
                  />
                )}
              </div>
            </div>
          </SectionCard>

          {/* Material */}
          <SectionCard title="Material" icon="🧵">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Filament Price"
                value={filamentPricePerKg}
                onChange={setFilamentPricePerKg}
                placeholder="1200"
                prefix="₹/kg"
                hint={priceHint}
              />
              <InputField
                label="Weight Used"
                value={weightGrams}
                onChange={setWeightGrams}
                placeholder="50"
                prefix="g"
              />
            </div>
          </SectionCard>

          {/* Time */}
          <SectionCard title="Time" icon="⏱">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TimeField
                label="Print Time (reference)"
                hours={printHours}
                minutes={printMinutes}
                onHours={setPrintHours}
                onMinutes={setPrintMinutes}
              />
              <TimeField
                label="Active Labor Time"
                hours={laborHours}
                minutes={laborMinutes}
                onHours={setLaborHours}
                onMinutes={setLaborMinutes}
              />
              <InputField
                label="Labor Rate"
                value={laborRate}
                onChange={setLaborRate}
                placeholder="200"
                prefix="₹/hr"
              />
            </div>
          </SectionCard>

          {/* Other Costs */}
          <SectionCard title="Other Costs" icon="📦">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Post-processing"
                value={postProcessing}
                onChange={setPostProcessing}
                placeholder="0"
                prefix="₹"
                hint="Sanding, painting, IPA…"
              />
              <InputField
                label="Packaging"
                value={packaging}
                onChange={setPackaging}
                placeholder="20"
                prefix="%"
                hint="% of material + labor + post-processing"
              />
              <InputField
                label="Markup"
                value={markup}
                onChange={setMarkup}
                placeholder="40"
                prefix="%"
                hint="Profit margin on top of cost"
              />
            </div>
          </SectionCard>
        </div>

        {/* ── Results ── */}
        <div className="sticky top-20">
          <CostBreakdown
            result={result}
            onSave={handleSave}
            canSave={result.totalCost > 0 && !saved}
            saved={saved}
          />
        </div>
      </div>
    </div>
  );
}
