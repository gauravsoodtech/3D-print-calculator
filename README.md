# 3D Print Cost Calculator

A cost calculator for FDM 3D printing — built for sellers who want to price their prints accurately and track profitability over time.

**Live:** [3d-print-calculator-mu.vercel.app](https://3d-print-calculator-mu.vercel.app)

---

## What it does

Fill in details about a print job — filament used, print time, labor, post-processing — and the calculator instantly shows you:

- Breakdown of every cost component
- Total cost of the job
- Suggested selling price based on your markup %
- Profit and margin percentage
- Rounded price suggestions (nearest ₹10 / ₹50 / ₹100)

All jobs can be saved locally and viewed in a history table. No account needed — everything is stored in your browser.

---

## Features

### Calculator
- **Material cost** — filament weight (g) × price per kg
- **Electricity cost** — printer wattage × print time × ₹/kWh (defaults tuned for Bambu Lab P2S on Delhi domestic tariff)
- **Labor cost** — active work time × hourly rate
- **Post-processing cost** — direct ₹ amount (sanding, painting, IPA, etc.)
- **Packaging cost** — percentage of subtotal
- **Markup** — profit percentage on top of total cost
- Live cost breakdown bar showing proportion of each component
- Form draft auto-saves across page navigation; resets on browser refresh

### Filament presets
Quick-select buttons for common filament types (PLA, PLA+, PETG, ABS, ASA, TPU, Nylon, Silk PLA, Carbon) with typical market prices pre-filled. Custom filament name and price also supported.

### Job History
- Table of all saved jobs with date, costs, selling price, and profit
- Stats summary: total jobs, total revenue, total profit, average markup
- Per-job delete with confirmation
- Export all jobs as a CSV file

### Settings
Configure your personal defaults (saved to localStorage, pre-fill the calculator):
- Filament price per kg
- Labor rate per hour
- Default markup %
- Default packaging %
- Printer wattage
- Electricity rate per kWh

---

## Calculation formulas

```
Material cost     = (weight_g / 1000) × filament_price_per_kg
Labor cost        = (labor_minutes / 60) × labor_rate_per_hour
Electricity cost  = (watts / 1000) × (print_minutes / 60) × electricity_rate_per_kwh
Subtotal          = material + labor + electricity + post_processing
Packaging cost    = subtotal × (packaging_percent / 100)
Total cost        = subtotal + packaging
Selling price     = total_cost × (1 + markup_percent / 100)
Profit            = selling_price − total_cost
Margin %          = (profit / selling_price) × 100
```

> **Markup vs Margin:** Markup is calculated on cost (e.g. 40% markup on ₹100 = ₹140 selling price). Margin is calculated on revenue (₹40 profit ÷ ₹140 = 28.57% margin). These are different numbers.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Language | TypeScript |
| Storage | Browser localStorage + sessionStorage |
| Testing | Vitest (26 unit tests) |
| Deployment | Vercel (auto-deploy on push to main) |

No database, no backend, no authentication — fully static and client-side.

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with navigation bar
│   ├── page.tsx             # Calculator (main page)
│   ├── history/page.tsx     # Saved job history
│   └── settings/page.tsx    # Default values configuration
├── components/
│   ├── Calculator.tsx       # Main calculator form + form draft logic
│   ├── CostBreakdown.tsx    # Live result card with cost bar
│   ├── JobHistory.tsx       # History table with stats and CSV export
│   ├── NavBar.tsx           # Sticky nav with active route highlighting
│   └── SettingsForm.tsx     # Settings form
└── lib/
    ├── calculations.ts      # Pure cost calculation functions
    ├── calculations.test.ts # Vitest unit tests (26 tests)
    └── storage.ts           # localStorage/sessionStorage helpers + CSV export
```

---

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Production build
npm run build
```
