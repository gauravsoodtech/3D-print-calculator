# 3D Print Cost Calculator

A cost calculator for FDM 3D printing — built for sellers who want to price their prints accurately, track profitability over time, and share professional quotations with clients.

**Live:** [minory3d.vercel.app](https://minory3d.vercel.app)

---

## What it does

Fill in details about a print job — filament used, print time, labor, post-processing — and the calculator instantly shows you:

- Breakdown of every cost component
- Total cost of the job
- Suggested selling price based on your markup %
- Profit and margin percentage
- Rounded price suggestions (nearest ₹10 / ₹50 / ₹100)

All jobs can be saved locally and viewed in a history table. Quotations can be created and shared with clients via a public link — no account needed on the client side.

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

### Client Quotations
- Create multi-line quotations from the admin panel
- Attach STL files to individual line items (stored in Cloudflare R2)
- Clients can view their quotation — including a 3D STL preview — via a shareable public link (`/q/<token>`)
- No login required for client-facing quotation links

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
| Database | Neon Postgres (via Prisma) — quotation storage |
| File storage | Cloudflare R2 — STL files |
| Auth | JWT cookie (`admin_session`) — all pages protected |
| Client storage | Browser localStorage + sessionStorage |
| Testing | Vitest (26 unit tests) |
| Deployment | Vercel (auto-deploy on push to main) |

---

## Access

All pages (calculator, history, settings, admin) require login. The only public routes are:

- `/login` — login page
- `/q/<shareToken>` — client-facing quotation view

---

## Project structure

```
src/
├── proxy.ts                     # Edge middleware — auth gate for all pages
├── app/
│   ├── layout.tsx               # Root layout with navigation bar
│   ├── page.tsx                 # Calculator (main page)
│   ├── history/page.tsx         # Saved job history
│   ├── settings/page.tsx        # Default values configuration
│   ├── login/page.tsx           # Login page
│   ├── q/[shareToken]/page.tsx  # Public client quotation view
│   ├── admin/                   # Admin quotation management
│   └── api/                     # Auth + quotation REST endpoints
├── components/
│   ├── Calculator.tsx           # Main calculator form + form draft logic
│   ├── CostBreakdown.tsx        # Live result card with cost bar
│   ├── JobHistory.tsx           # History table with stats and CSV export
│   ├── NavBar.tsx               # Sticky nav with active route highlighting
│   ├── SettingsForm.tsx         # Settings form
│   ├── AddToQuotationModal.tsx  # Add calc result to a quotation
│   ├── QuotationItemForm.tsx    # Quotation line item form
│   ├── STLViewer.tsx            # Three.js 3D STL renderer
│   └── MainWrapper.tsx          # Root layout wrapper
└── lib/
    ├── calculations.ts          # Pure cost calculation functions
    ├── calculations.test.ts     # Vitest unit tests (26 tests)
    ├── storage.ts               # localStorage/sessionStorage helpers + CSV export
    ├── types.ts                 # Shared TypeScript types
    ├── auth.ts                  # JWT session helpers
    ├── db.ts                    # Prisma client
    └── r2.ts                    # Cloudflare R2 client
```

---

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Requires a `.env.local` with:
```
DATABASE_URL=          # Neon Postgres connection string
JWT_SECRET=            # Secret for signing admin_session JWTs
ADMIN_PASSWORD=        # Password for the /login page
R2_ACCOUNT_ID=         # Cloudflare R2 account
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=         # Public base URL for R2 bucket
```

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Production build
npm run build
```
