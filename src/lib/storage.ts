export interface Settings {
  filamentPricePerKg: number;
  laborRatePerHour: number;
  markupPercent: number;
  defaultPackagingPercent: number;
}

export interface PrintJob {
  id: string;
  name: string;
  filamentType: string;
  date: string;
  materialCost: number;
  laborCost: number;
  postProcessingCost: number;
  packagingCost: number;
  totalCost: number;
  sellingPrice: number;
  profit: number;
  markupPercent: number;
}

const SETTINGS_KEY = "print_calc_settings";
const JOBS_KEY = "print_calc_jobs";

export const DEFAULT_SETTINGS: Settings = {
  filamentPricePerKg: 1200,
  laborRatePerHour: 200,
  markupPercent: 40,
  defaultPackagingPercent: 20,
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadJobs(): PrintJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveJob(job: PrintJob): void {
  const jobs = loadJobs();
  jobs.unshift(job);
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export function deleteJob(id: string): void {
  const jobs = loadJobs().filter((j) => j.id !== id);
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export function exportJobsCSV(jobs: PrintJob[]): void {
  const headers = [
    "Job Name",
    "Filament Type",
    "Date",
    "Material Cost (₹)",
    "Labor Cost (₹)",
    "Post-processing (₹)",
    "Packaging (₹)",
    "Total Cost (₹)",
    "Markup (%)",
    "Selling Price (₹)",
    "Profit (₹)",
  ];
  const rows = jobs.map((j) => [
    j.name,
    j.filamentType,
    new Date(j.date).toLocaleDateString("en-IN"),
    j.materialCost.toFixed(2),
    j.laborCost.toFixed(2),
    j.postProcessingCost.toFixed(2),
    j.packagingCost.toFixed(2),
    j.totalCost.toFixed(2),
    j.markupPercent.toFixed(1),
    j.sellingPrice.toFixed(2),
    j.profit.toFixed(2),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "print-jobs.csv";
  a.click();
  URL.revokeObjectURL(url);
}
