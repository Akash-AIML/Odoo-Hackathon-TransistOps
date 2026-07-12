# TransitOps - Smart Transport Operations Platform

TransitOps is a production-grade transport ERP backend designed as a centralised Fleet & Logistics Control Center. Built with Next.js App Router API Routes, Prisma, SQLite, and Turborepo, it coordinates fleet status, driver compliance, Kanban-style trip dispatches, fuel anomaly detection, maintenance scheduling, and per-vehicle ROI ledger analytics.

---

## 📦 Project Structure & Workspaces

The repository is structured as a **Turborepo monorepo boilerplate** with the Next.js application situated at the root directory:

```
.
├── .changeset/           # Changeset versioning configuration
├── .husky/              # Git hooks config (pre-commit, pre-push)
├── .vscode/             # VSCode shared workspace configs
├── packages/            # Shared workspaces placeholder directory
├── tooling/
│   └── typescript/      # Shared TS configurations (tsconfig.base.json)
├── src/                 # Next.js App Router API handlers & middlewares
├── prisma/              # Database Schema, migrations, and seeder
├── .env.example         # Template configuration environment variables
├── biome.json           # Biome linter & formatter configurations
├── turbo.json           # Turborepo task pipeline configs
└── package.json         # Root package manager (manages dependencies & monorepo scripts)
```

---

## 🚀 Getting Started

### 1. Prerequisite Setup
Clone the repository, create your `.env` file from the template, and install the modules:
```bash
cp .env.example .env
npm install
```

### 2. Database Migration & Seeding
Generate the client, execute SQLite migrations, and populate the database with seed data (hashes user passwords and encrypts driver PII details):
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 3. Running the Server (Port 5050)
Spin up the Next.js API backend in development mode (runs on port `5050`):
```bash
npm run dev
```

### 4. Running Integration Tests
Execute the integration test suite (runs HTTP requests against the port 5050 server):
```bash
npm run test
```

---

## 🛠 Command Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Spins up Next.js dev server on port `5050` |
| `npm run build` | Compiles Next.js for production with type checks |
| `npm run start` | Runs the compiled Next.js production server |
| `npm run lint` | Checks code quality and syntax styles with Biome |
| `npm run format` | Auto-formats code styles inside the `src` folder |
| `npm run check` | Runs linter, formatter, and imports sorting in write mode |
| `npm run test` | Executes the Vitest integration test suite |

---

## 🔒 Code Quality & Security Automations

- **Biome & Husky pre-push hook**: Biome (`v2.5.3`) is configured to enforce strict linting rules (no explicit `any` types or unused variables allowed). An automated Git pre-push hook at `.husky/pre-push` prevents pushing code if there are any style or quality violations.
- **Custom JWT Auth**: Replaced Clerk with secure local JWT credentials auth. Access tokens are returned in responses, and refresh tokens are stored in `HttpOnly` rotated cookies.
- **PII Encryption**: Driver license numbers and contact information are automatically encrypted at rest using AES-256-GCM in the SQLite database.
- **Transaction Ledger**: Logs inflows (trip revenues) and outflows (fuel cost, maintenance services, tolls, other expenses) for auditing and ROI tracking.
