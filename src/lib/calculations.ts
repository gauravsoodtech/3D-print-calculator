import { PrintJob } from "./storage";

export interface JobInputs {
  name: string;
  filamentType: string;
  weightGrams: number;
  filamentPricePerKg: number;
  laborMinutes: number;
  laborRatePerHour: number;
  postProcessingCost: number;
  packagingPercent: number;
  markupPercent: number;
}

export interface JobCalcResult {
  materialCost: number;
  laborCost: number;
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
  const subtotal = materialCost + laborCost + inputs.postProcessingCost;
  const packagingCost = subtotal * (inputs.packagingPercent / 100);
  const totalCost = subtotal + packagingCost;
  const sellingPrice = totalCost * (1 + inputs.markupPercent / 100);
  const profit = sellingPrice - totalCost;
  const marginPercent = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  return {
    materialCost,
    laborCost,
    postProcessingCost: inputs.postProcessingCost,
    packagingCost,
    totalCost,
    sellingPrice,
    profit,
    marginPercent,
  };
}

export function toPrintJob(
  inputs: JobInputs,
  result: JobCalcResult
): PrintJob {
  return {
    id: crypto.randomUUID(),
    name: inputs.name,
    filamentType: inputs.filamentType,
    date: new Date().toISOString(),
    materialCost: result.materialCost,
    laborCost: result.laborCost,
    postProcessingCost: result.postProcessingCost,
    packagingCost: result.packagingCost,
    totalCost: result.totalCost,
    sellingPrice: result.sellingPrice,
    profit: result.profit,
    markupPercent: inputs.markupPercent,
  };
}
