# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project overview

A 3D print cost calculator for FDM filament printing. Built for a seller (Bambu Lab P2S printer, based in Delhi, India) who needs to price jobs accurately, track profitability, and share quotations with clients.

- **Live URL:** https://minory3d.vercel.app
- **Repo:** https://github.com/gauravsoodtech/3D-print-calculator
- **Deployment:** Vercel — auto-deploys on push to `main`

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — dark theme (`zinc` palette, orange accents)
- **Vitest** — unit tests for pure calculation functions only
- **Neon Postgres** (via Prisma) — quotation storage
- **Cloudflare R2** — STL file storage for quotation items
- **localStorage** — settings and job history persistence
- **sessionStorage** — form draft (persists across navigation, clears on page refresh)
- **JWT cookie** (`admin_session`) — authentication for all app pages

## Environment

- **OS:** Windows (MSYS/bash shell)
- **Shell:** Use Unix shell syntax (forward slashes, etc.)
- **Currency:** INR (₹) throughout — never change to USD or other currencies

## Authentication

All pages except `/login`, `/q/*`, and `/api/auth/*` are protected by `src/proxy.ts` (Next.js 16 middleware equivalent). Unauthenticated requests are redirected to `/login?next=<original-path>`.

- Login endpoint: `POST /api/auth/login` — sets `admin_session` JWT cookie
- Logout endpoint: `POST /api/auth/logout` — clears cookie
- Session check: `src/lib/auth.ts` → `getSession()` / `requireAdmin()`
- Proxy: `src/proxy.ts` — edge middleware, covers all routes

**Public routes (no auth required):**
- `/login` — login page
- `/q/[shareToken]` — client-facing shareable quotation links
- `/api/auth/*` — login and logout endpoints

## Project structure

```
src/
├── proxy.ts                     # Edge middleware — auth gate for all pages
├── app/
│   ├── layout.tsx               # Root layout — uses NavBar, max-w-5xl container
│   ├── page.tsx                 # / → Calculator
│   ├── history/page.tsx         # /history → JobHistory
│   ├── settings/page.tsx        # /settings → SettingsForm
│   ├── login/page.tsx           # /login → login form
│   ├── q/[shareToken]/page.tsx  # /q/:token → public client quotation view
│   ├── admin/
│   │   ├── layout.tsx           # Admin layout — server-side session check (defence-in-depth)
│   │   ├── page.tsx             # /admin → quotation list
│   │   └── quotations/
│   │       ├── new/page.tsx     # /admin/quotations/new
│   │       └── [id]/page.tsx    # /admin/quotations/:id
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   └── logout/route.ts
│       └── quotations/
│           ├── route.ts                          # GET list, POST create
│           └── [id]/
│               ├── route.ts                      # GET, PATCH, DELETE
│               └── items/
│                   ├── route.ts                  # POST add item
│                   └── [itemId]/
│                       ├── route.ts              # PATCH, DELETE item
│                       ├── stl-upload-url/route.ts
│                       └── stl-confirm/route.ts
├── components/
│   ├── Calculator.tsx           # Main form — all field state, sessionStorage draft, live calc
│   ├── CostBreakdown.tsx        # Result card — cost bar, selling price, save button
│   ├── JobHistory.tsx           # History table — stats, delete, CSV export
│   ├── NavBar.tsx               # Sticky nav — active route via usePathname()
│   ├── SettingsForm.tsx         # Settings form — reads/writes localStorage
│   ├── AddToQuotationModal.tsx  # Modal to add a calc result to a quotation
│   ├── QuotationItemForm.tsx    # Form for individual quotation line items
│   ├── STLUploadButton.tsx      # R2 upload trigger for STL files
│   ├── STLViewer.tsx            # Three.js STL renderer (server wrapper)
│   ├── STLViewerClient.tsx      # Three.js STL renderer (client component)
│   └── MainWrapper.tsx          # Layout wrapper used by root layout
└── lib/
    ├── calculations.ts          # Pure functions: calculateJob, toPrintJob
    ├── calculations.test.ts     # Vitest tests (26 tests — all must stay passing)
    ├── storage.ts               # localStorage/sessionStorage helpers, types, CSV export
    ├── types.ts                 # Shared TypeScript types (Quotation, QuotationItem, etc.)
    ├── auth.ts                  # getSession(), requireAdmin() — JWT helpers
    ├── db.ts                    # Prisma client singleton
    ├── r2.ts                    # Cloudflare R2 client
    └── hooks/
        └── useIsAdmin.ts        # Client hook — reads admin_session cookie presence
```

## Key data models

### `Settings` (localStorage key: `print_calc_settings`)
```typescript
interface Settings {
  filamentPricePerKg: number;      // default 1200
  laborRatePerHour: number;        // default 200
  markupPercent: number;           // default 40
  defaultPackagingPercent: number; // default 20
  printerWatts: number;            // default 200 (Bambu P2S avg during PLA)
  electricityRatePerKwh: number;   // default 6.5 (Delhi 401–800 units slab)
}
```

### `PrintJob` (localStorage key: `print_calc_jobs`)
```typescript
interface PrintJob {
  id: string;
  name: string;
  filamentType: string;
  date: string;             // ISO string
  materialCost: number;
  laborCost: number;
  electricityCost: number;
  postProcessingCost: number;
  packagingCost: number;
  totalCost: number;
  sellingPrice: number;
  profit: number;
  markupPercent: number;
}
```

### `JobInputs` / `JobCalcResult` (in `calculations.ts`)
- `JobInputs` — all raw form values passed to `calculateJob()`
- `JobCalcResult` — computed breakdown returned from `calculateJob()`
- `toPrintJob(inputs, result)` — merges both into a `PrintJob` for saving

### Quotation / QuotationItem (Neon Postgres via Prisma — see `src/lib/types.ts`)
- Quotations are created in the admin, can contain multiple line items
- Each item can have an attached STL file stored in R2
- Quotations have a `shareToken` used in the public `/q/[shareToken]` URL

## Calculation formulas

```
materialCost     = (weightGrams / 1000) × filamentPricePerKg
laborCost        = (laborMinutes / 60) × laborRatePerHour
electricityCost  = (printerWatts / 1000) × (printMinutes / 60) × electricityRatePerKwh
subtotal         = materialCost + laborCost + electricityCost + postProcessingCost
packagingCost    = subtotal × (packagingPercent / 100)
totalCost        = subtotal + packagingCost
sellingPrice     = totalCost × (1 + markupPercent / 100)
profit           = sellingPrice − totalCost
marginPercent    = profit / sellingPrice × 100   (0 if sellingPrice = 0)
```

**Markup vs Margin:** These are intentionally different. Markup is cost-based (40% markup on ₹100 = ₹140). Margin is revenue-based (₹40 profit ÷ ₹140 = 28.57%). Do not conflate them.

## Form draft behavior

Form state is saved to `sessionStorage` (key: `print_calc_form_draft`) on every field change.

- **Page refresh** → draft is cleared, form resets to settings defaults
- **Tab switch / navigate away and back** → draft is restored

This is implemented via a `window.__calcFormSession` flag in `Calculator.tsx`. The flag survives React navigation (component unmount/remount) but is wiped on a real page refresh.

## Filament presets

Defined in `Calculator.tsx` as `FILAMENT_PRESETS`:
```
PLA ₹1000, PLA+ ₹1200, PETG ₹1400, ABS ₹1100, ASA ₹1500,
TPU ₹1800, Nylon ₹2500, Silk PLA ₹1400, Carbon ₹4000
```
Selecting a preset auto-fills the filament price only if the current price is empty or was set by another preset. Custom filament name + any price is supported via "Other".

## Commands

```bash
npm run dev          # Dev server at localhost:3000
npm run build        # Production build (must pass before pushing)
npm test             # Run Vitest (26 tests — all must pass)
npm run test:watch   # Vitest watch mode
```

## Important constraints

- **Do not commit** unless explicitly asked
- **Do not add co-author tags** to commit messages
- **All 26 Vitest tests must stay passing** — run `npm test` after any changes to `calculations.ts`
- **Currency is always ₹ (INR)** — do not change labels, defaults, or hints to other currencies
- **Printer model is Bambu Lab P2S** (~200W avg PLA, peak 1200W) — not P1S or any other model
- **Tailwind dark theme** — background `zinc-950`, cards `zinc-900`, borders `zinc-800`, accents `orange-500`
- **Auth middleware is `src/proxy.ts`** — Next.js 16 uses `proxy.ts` instead of `middleware.ts`; do not create a `middleware.ts`
