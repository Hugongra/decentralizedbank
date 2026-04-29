# Statistics backend

Spring Boot service for the **Decentralized Bank** monorepo: persists and exposes **banks, assets, deposits, borrows, transactions, and logs**, and runs scheduled jobs to **fetch token prices** (CoinMarketCap) and resolve SPL token metadata (Solana token list).

Maven artifact: `com.freedomfinance:bank` (`0.0.1-GetBankStatistics`). Main class: `com.freedomfinance.bank.BankApplication`.

## Stack

| Piece | Version / notes |
|--------|------------------|
| Java | **21** (`pom.xml`) |
| Spring Boot | **3.4.1** |
| Persistence | Spring Data JPA, **PostgreSQL** |
| API | Spring Web, Validation |
| Security | Spring Security (stateless), custom `XAuthenticationFilter` |
| Other | Lombok, scheduled tasks (`@EnableScheduling`) |

## Modules (package layout)

Bounded contexts under `src/main/java/com/freedomfinance/bank/`:

| Area | Role |
|------|------|
| `bank/` | Banks, assets, token price history |
| `deposit/` | Deposit records |
| `borrow/` | Borrow records |
| `transaction/` | Transaction listing / filters |
| `token/` | Tokens, CoinMarketCap client, SPL token list client, **price scheduler** (every 5 minutes) |
| `log/` | Smart-contract log ingestion (admin) |
| `customer/` | Customer domain (paths/constants; extend as needed) |
| `common/`, `security/` | Shared DTOs, errors, auth filter, CORS |

HTTP route prefixes (each combined with `/admin`, `/public`, or `/private` segments on controllers):

- `/bank` — create bank/assets, list assets, token price records
- `/deposit`, `/borrow`, `/transaction`, `/log`, `/token`

Spring Security permits all requests matching `/bank`, `/borrow`, `/deposit`, `/log`, and `/transaction` (see `SecurityConfig`); other routes require authentication per the filter. CORS origins come from configuration (`allowed.cors`).

## Prerequisites

- **JDK 21**
- **PostgreSQL** reachable with credentials you supply to the app
- **CoinMarketCap API key** if you want scheduled USD prices (`TokenPriceSchedule`)

This tree does not ship `src/main/resources/application*.yml`; use your own config (e.g. `config/` on the classpath, `SPRING_CONFIG_LOCATION`, or environment variables) so Spring can bind **JPA datasource** settings and the properties below.

## Configuration (environment / properties)

Properties read in code (non-exhaustive; add standard `spring.datasource.*` and JPA settings as needed):

| Property | Used for |
|----------|-----------|
| `allowed.cors` | Comma-separated allowed origins (CORS) |
| `admin.password` | `token` header check for admin-style calls in `XAuthenticationFilter` (localhost-only for that branch; see filter for details) |
| `coinmarketcap.api-key` | `X-CMC_PRO_API_KEY` for quotes API |
| `environment` | `dev` vs other (SPL token service behavior) |
| `USDC_MINT_ADDRESS`, `BTC_MINT_ADDRESS`, `ETH_MINT_ADDRESS`, `USDT_MINT_ADDRESS`, `XRP_MINT_ADDRESS`, `ADA_MINT_ADDRESS` | Mint addresses for SPL token bootstrap |

## Build and test

From this directory:

```bash
./mvnw clean install
```

Run tests (includes `BankApplicationTests` context load):

```bash
./mvnw test
```

Skip tests (as in `scripts/build.sh`):

```bash
./mvnw clean install -Dmaven.test.skip=true
```

## Run locally

After a successful build:

```bash
./mvnw spring-boot:run
```

Or run the packaged JAR from `target/` (adjust profile if you use `application-prod.yml` etc.):

```bash
java -jar -Dspring.profiles.active=prod target/bank-0.0.1-GetBankStatistics.jar
```

## Scripts (`scripts/`)

Shell helpers assume they are executed **from inside `scripts/`** (they `cd ..` to the module root):

| Script | Behavior |
|--------|----------|
| `build.sh` | Stops running JAR (if any), then `mvn clean install -Dmaven.test.skip=true` |
| `run.sh` | Stops old process, `cd` to `target/`, starts `nohup java -jar ... -Dspring.profiles.active=prod` |
| `stop.sh` | Kills process matching `bank-0.0.1-GetBankStatistics.jar` |

## Related repo docs

For the full stack (Solana program, frontend), see the [root README](../README.md). For on-chain behavior, see [`smart-contract/README.md`](../smart-contract/README.md).
