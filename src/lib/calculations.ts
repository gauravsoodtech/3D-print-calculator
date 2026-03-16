import { PrintJob } from "./storage";

export interface JobInputs {
  name: string;
  filamentType: string;
  weightGrams: number;
  filamentPricePerKg: number;
  printMinutes: number;
  printerWatts: number;
  electricityRatePerKwh: number;
  laborMinutes: number;
  laborRatePerHour: number;
  postProcessingCost: number;
  packagingPercent: number;
  markupPercent: number;
}

export interface JobCalcResult {
  materialCost: number;
  laborCost: number;
  electricityCost: number;
  postProcessingCost: number;
  packagingCost: number;
  totalCost: number;
  sellingPrice: number;
  profit: number;
  marginPercent: number;
}

export function calculateJob(inputs: JobInputs): JobCalcResult {
  const materialCost = (inputs.weightGrams / 1000) * inputs.filamentPricePerKg;
  const laborCost = (inputs.laborMinutes / 60) * inputs.laborRatePerHour;
  const electricityCost =
    (inputs.printerWatts / 1000) *
    (inputs.printMinutes / 60) *
    inputs.electricityRatePerKwh;
  const subtotal = materialCost + laborCost + electricityCost + inputs.postProcessingCost;
  const packagingCost = subtotal * (inputs.packagingPercent / 100);
  const totalCost = subtotal + packagingCost;
  const sellingPrice = totalCost * (1 + inputs.markupPercent / 100);
  const profit = sellingPrice - totalCost;
  const marginPercent = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  return {
    materialCost,
    laborCost,
    electricityCost,
    postProcessingCost: inputs.postProcessingCost,
    packagingCost,
    totalCost,
    sellingPrice,
    profit,
    marginPercent,
  };
}

export function toPrintJob(inputs: JobInputs, result: JobCalcResult): PrintJob {
  return {
    id: crypto.randomUUID(),
    name: inputs.name,
    filamentType: inputs.filamentType,
    date: new Date().toISOString(),
    materialCost: result.materialCost,
    laborCost: result.laborCost,
    electricityCost: result.electricityCost,
    postProcessingCost: result.postProcessingCost,
    packagingCost: result.packagingCost,
    totalCost: result.totalCost,
    sellingPrice: result.sellingPrice,
    profit: result.profit,
    markupPercent: inputs.markupPercent,
  };
}
