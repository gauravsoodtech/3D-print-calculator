"use client";

import { useEffect, useState } from "react";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "@/lib/storage";

function SettingField({
  label,
  description,
  value,
  onChange,
  prefix,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  prefix: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-zinc-800/60 last:border-0">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <div className="relative shrink-0 w-36">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none select-none">
          {prefix}
        </span>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 pl-10 pr-3 py-2.5
            focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 transition-all text-right"
        />
      </div>
    </div>
  );
}

export default function SettingsForm() {
  const [filamentPrice, setFilamentPrice] = useState("");
  const [laborRate, setLaborRate] = useState("");
  const [markup, setMarkup] = useState("");
  const [packaging, setPackaging] = useState("");
  const [printerWatts, setPrinterWatts] = useState("");
  const [electricityRate, setElectricityRate] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setFilamentPrice(String(s.filamentPricePerKg));
    setLaborRate(String(s.laborRatePerHour));
    setMarkup(String(s.markupPercent));
    setPackaging(String(s.defaultPackagingPercent));
    setPrinterWatts(String(s.printerWatts));
    setElectricityRate(String(s.electricityRatePerKwh));
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveSettings({
      filamentPricePerKg: parseFloat(filamentPrice) || DEFAULT_SETTINGS.filamentPricePerKg,
      laborRatePerHour: parseFloat(laborRate) || DEFAULT_SETTINGS.laborRatePerHour,
      markupPercent: parseFloat(markup) || DEFAULT_SETTINGS.markupPercent,
      defaultPackagingPercent: parseFloat(packaging) || DEFAULT_SETTINGS.defaultPackagingPercent,
      printerWatts: parseFloat(printerWatts) || DEFAULT_SETTINGS.printerWatts,
      electricityRatePerKwh: parseFloat(electricityRate) || DEFAULT_SETTINGS.electricityRatePerKwh,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleChange(setter: (v: string) => void) {
    return (v: string) => {
      setter(v);
      setSaved(false);
    };
  }

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-6">
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl px-5">
        <SettingField
          label="Filament Price"
          description="Default ₹ per kg — pre-fills the calculator"
          value={filamentPrice}
          onChange={handleChange(setFilamentPrice)}
          prefix="₹/kg"
        />
        <SettingField
          label="Labor Rate"
          description="Your hourly rate for active work time"
          value={laborRate}
          onChange={handleChange(setLaborRate)}
          prefix="₹/hr"
        />
        <SettingField
          label="Default Markup"
          description="Profit percentage added on top of cost"
          value={markup}
          onChange={handleChange(setMarkup)}
          prefix="%"
        />
        <SettingField
          label="Default Packaging"
          description="% of subtotal (material + labor + post-processing)"
          value={packaging}
          onChange={handleChange(setPackaging)}
          prefix="%"
        />
        <SettingField
          label="Printer Power"
          description="Bambu P2S: ~200W during PLA printing, peak 1200W"
          value={printerWatts}
          onChange={handleChange(setPrinterWatts)}
          prefix="W"
        />
        <SettingField
          label="Electricity Rate"
          description="Delhi domestic: ₹6.50/kWh (401–800 units slab)"
          value={electricityRate}
          onChange={handleChange(setElectricityRate)}
          prefix="₹/kWh"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
            saved
              ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
              : "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20"
          }`}
        >
          {saved ? "✓ Saved" : "Save Settings"}
        </button>
        {!saved && (
          <p className="text-xs text-zinc-600">Changes apply to new jobs on the Calculator</p>
        )}
      </div>
    </form>
  );
}
