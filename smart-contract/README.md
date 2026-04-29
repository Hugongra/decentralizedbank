# Smart contract (Solana / Anchor)

Solana programs for the **Decentralized Bank** lending protocol: pooled deposits, borrows against collateral, interest parameters per asset, and liquidation flows. The on-chain program crate is **`get_bank`** (Anchor).

Declared program id (see `programs/get_bank/src/lib.rs`): `Geh97tZGzncv1soduTSeFcLozkiSTUkbFdLN1gdiuKqJ`.

## Stack

| Piece | Version / notes |
|--------|------------------|
| [Anchor](https://www.anchor-lang.com/) | `0.30.x` (see `programs/get_bank/Cargo.toml`) |
| Rust | 2021 edition |
| Oracles | Pyth Solana receiver SDK (`pyth-solana-receiver-sdk`) |
| SPL | `anchor-spl` |

## Repository layout

| Path | Purpose |
|------|---------|
| `programs/get_bank/` | Anchor program: bank, assets (SOL + SPL), deposits, borrows, liquidation |
| `migrations/` | Anchor deploy hook (`deploy.ts`) |
| `apps/` | pnpm workspace: `liquidator`, `watcher`, and `test` TypeScript clients |
| `docs/` | Extra documentation |
| `scripts/` | Helper scripts |

## Program surface (high level)

Instructions exposed by `get_bank` include, among others:

- **Bank**: `create_bank`, `update_bank`
- **Assets**: `create_sol_asset`, `create_token_asset_vaults`, `create_token_asset`, `update_asset` (utilization, deposit/borrow APR curves, LTV, liquidation fee, oracle, etc.)
- **Deposits**: `create_deposit`, `deposit_sol` / `withdraw_sol`, `deposit_token` / `withdraw_token`
- **Borrows**: `borrow_sol` / `repay_sol`, `borrow_token` / `repay_token`, `mark_to_liquidate`
- **Liquidation**: `liquidate_sol_auto`, `liquidate_token_auto`

See `programs/get_bank/src/lib.rs` for the authoritative instruction list and account wiring.

## Prerequisites

- **Rust** and **Cargo** (stable)
- **Solana CLI** (`solana`, `solana-test-validator`)
- **Anchor CLI** matching the workspace (Anchor `0.30.x`)
- **Node.js** and **pnpm** (for `apps/`)

Install Anchor and Solana using the versions recommended in the [Anchor docs](https://www.anchor-lang.com/docs/installation).

## Build the program

From this directory:

```bash
anchor build
```

Artifacts land under `target/deploy/` (including the `.so` used for deploys).

## Local validator and deploy

1. Start a local ledger (separate terminal):

   ```bash
   solana-test-validator
   ```

2. Point CLI at localnet and ensure a funded keypair (default `~/.config/solana/id.json` matches `Anchor.toml`):

   ```bash
   solana config set --url localhost
   solana airdrop 10
   ```

3. Deploy / upgrade as you normally would with Anchor:

   ```bash
   anchor deploy
   ```

`Anchor.toml` sets `cluster = "Localnet"` and the `[programs.localnet]` entry; adjust for devnet/mainnet when you deploy elsewhere.

## TypeScript apps (`apps/`)

The workspace uses **pnpm**:

```bash
cd apps
pnpm install
pnpm run build:test    # example: build the test package
```

Use each package’s `package.json` for `start:*` / `build:*` scripts (`liquidator`, `watcher`, `test`).

## Anchor `test` script

`Anchor.toml` defines `anchor test` via Yarn and `tests/**/*.ts` at the workspace root. If that path has no tests yet, `anchor test` may fail until tests exist or the script is pointed at your test layout.

## Related repo docs

For how this folder fits the full stack (frontend, statistics backend), see the [root README](../README.md).
