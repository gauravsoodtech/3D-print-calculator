import { describe, it, expect } from "vitest";
import { calculateJob } from "./calculations";

// Helper: round to 2 decimal places for comparison
const r2 = (n: number) => Math.round(n * 100) / 100;

// Base inputs used across tests (all costs zero except the one under test)
const base = {
  name: "Test",
  filamentType: "PLA",
  weightGrams: 0,
  filamentPricePerKg: 0,
  printMinutes: 0,
  printerWatts: 0,
  electricityRatePerKwh: 0,
  laborMinutes: 0,
  laborRatePerHour: 0,
  postProcessingCost: 0,
  packagingPercent: 0,
  markupPercent: 0,
};

// ─── Material Cost ────────────────────────────────────────────────────────────

describe("materialCost", () => {
  it("100g at ₹1000/kg = ₹100", () => {
    const r = calculateJob({ ...base, weightGrams: 100, filamentPricePerKg: 1000 });
    expect(r.materialCost).toBe(100);
  });

  it("50g at ₹1200/kg = ₹60", () => {
    const r = calculateJob({ ...base, weightGrams: 50, filamentPricePerKg: 1200 });
    expect(r.materialCost).toBe(60);
  });

  it("250g at ₹1400/kg (PETG) = ₹350", () => {
    const r = calculateJob({ ...base, weightGrams: 250, filamentPricePerKg: 1400 });
    expect(r.materialCost).toBe(350);
  });

  it("0g = ₹0", () => {
    const r = calculateJob({ ...base, weightGrams: 0, filamentPricePerKg: 1000 });
    expect(r.materialCost).toBe(0);
  });
});

// ─── Labor Cost ───────────────────────────────────────────────────────────────

describe("laborCost", () => {
  it("60 min at ₹200/hr = ₹200", () => {
    const r = calculateJob({ ...base, laborMinutes: 60, laborRatePerHour: 200 });
    expect(r.laborCost).toBe(200);
  });

  it("30 min at ₹200/hr = ₹100", () => {
    const r = calculateJob({ ...base, laborMinutes: 30, laborRatePerHour: 200 });
    expect(r.laborCost).toBe(100);
  });

  it("90 min at ₹300/hr = ₹450", () => {
    const r = calculateJob({ ...base, laborMinutes: 90, laborRatePerHour: 300 });
    expect(r.laborCost).toBe(450);
  });

  it("0 min = ₹0", () => {
    const r = calculateJob({ ...base, laborMinutes: 0, laborRatePerHour: 200 });
    expect(r.laborCost).toBe(0);
  });
});

// ─── Electricity Cost ─────────────────────────────────────────────────────────
// Formula: (W / 1000) × (minutes / 60) × ₹/kWh

describe("electricityCost", () => {
  it("200W for 60 min at ₹6.5/kWh = ₹1.30", () => {
    // 0.2kW × 1h × 6.5 = 1.30
    const r = calculateJob({ ...base, printerWatts: 200, printMinutes: 60, electricityRatePerKwh: 6.5 });
    expect(r2(r.electricityCost)).toBe(1.30);
  });

  it("200W for 240 min (4h) at ₹6.5/kWh = ₹5.20", () => {
    // 0.2 × 4 × 6.5 = 5.20
    const r = calculateJob({ ...base, printerWatts: 200, printMinutes: 240, electricityRatePerKwh: 6.5 });
    expect(r2(r.electricityCost)).toBe(5.20);
  });

  it("1000W for 120 min (2h) at ₹7/kWh = ₹14", () => {
    // 1 × 2 × 7 = 14
    const r = calculateJob({ ...base, printerWatts: 1000, printMinutes: 120, electricityRatePerKwh: 7 });
    expect(r.electricityCost).toBe(14);
  });

  it("0W = ₹0", () => {
    const r = calculateJob({ ...base, printerWatts: 0, printMinutes: 120, electricityRatePerKwh: 6.5 });
    expect(r.electricityCost).toBe(0);
  });

  it("0 min = ₹0", () => {
    const r = calculateJob({ ...base, printerWatts: 200, printMinutes: 0, electricityRatePerKwh: 6.5 });
    expect(r.electricityCost).toBe(0);
  });
});

// ─── Packaging Cost ───────────────────────────────────────────────────────────
// Packaging % applies on subtotal (material + labor + electricity + postProcessing)

describe("packagingCost", () => {
  it("20% packaging on ₹100 subtotal = ₹20", () => {
    const r = calculateJob({ ...base, weightGrams: 100, filamentPricePerKg: 1000, packagingPercent: 20 });
    // material=100, subtotal=100, packaging=20
    expect(r.packagingCost).toBe(20);
  });

  it("20% packaging on ₹200 subtotal = ₹40", () => {
    // 100g @₹1000 + 60min @₹200/hr = 100 + 200 = 300, 20% = 60
    const r = calculateJob({
      ...base,
      weightGrams: 100, filamentPricePerKg: 1000,
      laborMinutes: 60, laborRatePerHour: 200,
      packagingPercent: 20,
    });
    expect(r.packagingCost).toBe(60);
  });

  it("0% packaging = ₹0", () => {
    const r = calculateJob({ ...base, weightGrams: 100, filamentPricePerKg: 1000, packagingPercent: 0 });
    expect(r.packagingCost).toBe(0);
  });
});

// ─── Total Cost ───────────────────────────────────────────────────────────────

describe("totalCost", () => {
  it("sum of all components", () => {
    // material=100, labor=100, electricity=1.30, postProc=50, subtotal=251.30
    // packaging 20% = 50.26, total = 301.56
    const r = calculateJob({
      ...base,
      weightGrams: 100, filamentPricePerKg: 1000,   // material = 100
      laborMinutes: 30, laborRatePerHour: 200,        // labor = 100
      printerWatts: 200, printMinutes: 60, electricityRatePerKwh: 6.5, // elec = 1.30
      postProcessingCost: 50,                         // post = 50
      packagingPercent: 20,                           // packaging = 20% of 251.30 = 50.26
    });
    expect(r2(r.materialCost)).toBe(100);
    expect(r2(r.laborCost)).toBe(100);
    expect(r2(r.electricityCost)).toBe(1.30);
    expect(r2(r.postProcessingCost)).toBe(50);
    expect(r2(r.packagingCost)).toBe(50.26);
    expect(r2(r.totalCost)).toBe(301.56);
  });

  it("all zero inputs = ₹0 total", () => {
    const r = calculateJob(base);
    expect(r.totalCost).toBe(0);
  });
});

// ─── Selling Price ────────────────────────────────────────────────────────────

describe("sellingPrice", () => {
  it("40% markup on ₹100 total = ₹140", () => {
    const r = calculateJob({ ...base, weightGrams: 100, filamentPricePerKg: 1000, markupPercent: 40 });
    expect(r.sellingPrice).toBe(140);
  });

  it("0% markup = selling price equals total cost", () => {
    const r = calculateJob({ ...base, weightGrams: 100, filamentPricePerKg: 1000, markupPercent: 0 });
    expect(r.sellingPrice).toBe(r.totalCost);
  });

  it("100% markup doubles the cost", () => {
    const r = calculateJob({ ...base, weightGrams: 100, filamentPricePerKg: 1000, markupPercent: 100 });
    expect(r.sellingPrice).toBe(200);
  });
});

// ─── Profit & Margin ──────────────────────────────────────────────────────────

describe("profit and marginPercent", () => {
  it("40% markup on ₹100: profit = ₹40, margin = 28.57%", () => {
    // selling = 140, profit = 40, margin = 40/140 = 28.571...%
    const r = calculateJob({ ...base, weightGrams: 100, filamentPricePerKg: 1000, markupPercent: 40 });
    expect(r.profit).toBe(40);
    expect(r2(r.marginPercent)).toBe(28.57);
  });

  it("markup % and margin % are different (markup is cost-based, margin is revenue-based)", () => {
    const r = calculateJob({ ...base, weightGrams: 100, filamentPricePerKg: 1000, markupPercent: 40 });
    // 40% markup ≠ 40% margin
    expect(r.marginPercent).not.toBe(40);
    expect(r.marginPercent).toBeCloseTo(28.57, 1);
  });

  it("zero total cost: margin = 0%", () => {
    const r = calculateJob(base);
    expect(r.marginPercent).toBe(0);
  });

  it("0% markup: profit = 0, margin = 0%", () => {
    const r = calculateJob({ ...base, weightGrams: 100, filamentPricePerKg: 1000, markupPercent: 0 });
    expect(r.profit).toBe(0);
    expect(r.marginPercent).toBe(0);
  });
});

// ─── Real-world scenario ──────────────────────────────────────────────────────

describe("real-world print job", () => {
  it("typical small figurine print", () => {
    // 80g PLA @₹1000/kg, 5hr print @200W @₹6.5/kWh
    // 20min labor @₹200/hr, ₹30 post-proc, 20% packaging, 40% markup
    const r = calculateJob({
      name: "Figurine",
      filamentType: "PLA",
      weightGrams: 80,
      filamentPricePerKg: 1000,
      printMinutes: 300,        // 5 hours
      printerWatts: 200,
      electricityRatePerKwh: 6.5,
      laborMinutes: 20,
      laborRatePerHour: 200,
      postProcessingCost: 30,
      packagingPercent: 20,
      markupPercent: 40,
    });

    // material = 80/1000 * 1000 = 80
    expect(r2(r.materialCost)).toBe(80);
    // labor = 20/60 * 200 = 66.67
    expect(r2(r.laborCost)).toBe(66.67);
    // electricity = (200/1000) * (300/60) * 6.5 = 0.2 * 5 * 6.5 = 6.50
    expect(r2(r.electricityCost)).toBe(6.50);
    // postProcessing = 30
    expect(r.postProcessingCost).toBe(30);
    // subtotal = 80 + 66.67 + 6.50 + 30 = 183.17
    // packaging = 183.17 * 0.20 = 36.63
    expect(r2(r.packagingCost)).toBe(36.63);
    // total = 183.17 + 36.63 = 219.80
    expect(r2(r.totalCost)).toBe(219.80);
    // selling = 219.80 * 1.40 = 307.72
    expect(r2(r.sellingPrice)).toBe(307.72);
    // profit = 307.72 - 219.80 = 87.92
    expect(r2(r.profit)).toBe(87.92);
    // margin = 87.92 / 307.72 * 100 = 28.57%
    expect(r.marginPercent).toBeCloseTo(28.57, 1);
  });
});
