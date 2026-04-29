# Frontend

Two separate **Angular 19** applications for the **Decentralized Bank** monorepo:

| App | Folder | Default dev port | Purpose |
|-----|--------|------------------|---------|
| **Client DApp** | `client/` | **4200** | End-user flows: assets, deposits, borrows, transactions |
| **Admin** | `admin/` | **4201** | Operator flows: auth gate, bank overview, assets |

Both use **TypeScript ~5.6**, **Angular Material**, **Tailwind CSS**, **`@solana/web3.js`**, and a small **custom wallet layer** (browser extension providers; not the npm `@solana/wallet-adapter` stack). The client also uses **CanvasJS** charts and **decimal.js**.

## Prerequisites

- **Node.js** compatible with Angular 19 (use a current **20.x** or **22.x** LTS)
- **npm** (each app ships a `package-lock.json`; use `npm ci` when you want a clean, reproducible install)
- Local **Solana RPC** (default `http://127.0.0.1:8899` in `env.ts`) and optionally the **statistics backend** on **port 8080** for proxied HTTP APIs during `ng serve`

## Install and run (development)

Work inside each app directory; there is **no** root-level workspace `package.json`.

### Client (`client/`)

```bash
cd client
npm ci
npm start
```

`npm start` runs `ng serve` on **port 4200** with `proxy.conf.json` so browser calls under `/api/*` reach the backend (see below).

### Admin (`admin/`)

```bash
cd admin
npm ci
npm start
```

`npm start` runs `ng serve` on **port 4201** with its own `proxy.conf.json`.

## Production build

```bash
cd client   # or admin
npm run build
```

`angular.json` replaces `src/environments/env.ts` with `src/environments/env.prod.ts` for **production** builds. If `env.prod.ts` is missing in your clone, add it (mirror `env.ts` with production RPC, program id, and flags) or production builds will fail.

## Environment (`env.ts`)

Shared shape in both apps today:

- `dev` — logging / dev behavior
- `PROGRAM_ID` — on-chain program id used by the UI
- `BLOCKCHAIN_URL` — Solana JSON-RPC endpoint

The client additionally defines **`BANK_ADDRESS`** (protocol bank pubkey). Keep these values aligned with the cluster and deployment you target.

## Dev proxy → statistics backend

During `ng serve`, **`proxy.conf.json`** forwards to `http://localhost:8080` and rewrites paths so the browser can use a short `/api/...` prefix:

**Client** proxies `/api/bank`, `/api/borrow`, `/api/deposit`, `/api/transaction` to backend routes under `/api/getbank/v1/...` (see `client/proxy.conf.json`).

**Admin** proxies `/api/bank` the same way (`admin/proxy.conf.json`).

Your Spring app must therefore listen on **8080** and expose those rewritten paths (for example via `server.servlet.context-path` and API versioning), or adjust the proxy to match whatever base path your statistics backend actually uses.

## Tests

```bash
npm test
```

Uses **Karma** + **Jasmine** (Chrome launcher). Ensure Chrome/Chromium is available for headful runs.

## Related repo docs

- Monorepo overview: [root README](../README.md)
- On-chain program: [`smart-contract/README.md`](../smart-contract/README.md)
- HTTP API service: [`statistics-backend/README.md`](../statistics-backend/README.md)
