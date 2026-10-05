# Patel & Sons — business operating system (frontend)

Sourcing and price comparison, purchasing, inventory, sales, collection of debt, CRM,
loyalty, coupons, simulated pricing and gift-selection tools, and management reports —
in one connected application. The app currently runs entirely on generated demo data.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
```

Set `DUMMY_LATENCY_MS=600` to add artificial latency and see the loading states.

> **Note:** `/dummy-data` is git-ignored by design. A fresh clone needs that folder (or a
> real data provider) before it will build.

## Architecture

```
app/          routes (server components)        components/  design system + shell
features/     module tables, dialogs, actions   lib/         formatting, dates, periods
data-access/  repositories, view models, business calculations, simulated engines
dummy-data/   generated demo data (replaceable)
```

The UI only talks to `@/data-access`. To move to a real backend, implement the
repository interfaces in `data-access/contracts.ts`, switch the provider in
`data-access/index.ts`, and delete `/dummy-data`.

Figures are labelled as **recorded**, **calculated** or **simulated**. The pricing, gift
selection and keep/replace/eliminate suggestions come from transparent rule-based
heuristics, not trained AI models. Every unconfirmed business threshold is in
`data-access/rules/assumptions.ts`.
