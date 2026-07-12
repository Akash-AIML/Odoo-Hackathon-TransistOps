# TransitOps - Smart Transport Operations Platform

**Live Deployment:** [odoo-hackathon-transist-ops.vercel.app](https://odoo-hackathon-transist-ops.vercel.app/login)

TransitOps is a production-grade, full-stack transport Enterprise Resource Planning (ERP) platform designed as a centralized **Fleet & Logistics Control Center**. Built using **Next.js (App Router)**, **React 19**, **Recharts**, **TailwindCSS v4**, **Prisma**, and **PostgreSQL (Neon)**, it coordinates fleet status, driver compliance, Kanban-style trip dispatches, fuel anomaly detection, maintenance scheduling, and per-vehicle ROI ledger analytics.

---

## Key Application Modules

TransitOps provides a comprehensive control panel for logistics coordinators and managers:

1. **Fleet Control Dashboard**
   - High-level KPIs representing Fleet Health, Fleet Utilization, Drivers Available, Maintenance Alerts, and Today's Trips.
   - Interactive data visualizations displaying Vehicle Distribution (Available, On Trip, In Shop, Retired) using Recharts.
   - Live system-wide alerts feed highlighting critical warnings and compliance issues.

2. **Fleet & Vehicle Management**
   - Track vehicle operational status, odometer metrics, capacity limits (kg), expected fuel efficiency, and next service limits.
   - Automated vehicle document expiration tracking (Insurance, RC, Fitness Certificate).

3. **Driver & Compliance Management**
   - Monitor licenses, certifications (LMV, HGV, MCWG), safety scores, and expiration dates.
   - **PII Encryption**: License numbers and contact details are encrypted at rest using AES-256-GCM.

4. **Kanban Trip Dispatcher**
   - Coordinates trip lifecycles (`Draft`, `Ready`, `Dispatched`, `Completed`, `Cancelled`).
   - Validates cargo weight against vehicle capacity.
   - Restricts dispatches to drivers with active, valid, and non-expired licenses.
   - Automatically cascades state changes, setting vehicles and drivers to "On Trip" on dispatch.

5. **Trip Completion & Fuel Refills**
   - Records trip completions and updates vehicle odometer logs.
   - **Fuel Anomaly Detection**: Calculates actual fuel efficiency. Refills that drop efficiency by >18% compared to the vehicle's baseline trigger system-wide red alerts and flag the fuel log as anomalous.

6. **ROI & Financial Ledger**
   - Standardized ledger tracking inflows (trip revenue) and outflows (fuel cost, maintenance services, tolls, other expenses).
   - Helps operations team trace profitability and ROI per vehicle.

---

## Project Structure & Workspaces

The repository is structured as a **Turborepo monorepo** with the main Next.js full-stack application at the root:

```
.
├── .changeset/           # Changeset versioning configuration
├── .husky/              # Git hooks config (pre-commit, pre-push)
├── .vscode/             # VSCode shared workspace configs
├── packages/            # Shared monorepo workspaces (placeholder)
├── tooling/
│   └── typescript/      # Shared TS configurations (tsconfig.base.json)
├── src/
│   ├── app/             # Next.js App Router (Frontend Pages & API routes)
│   │   ├── (app)/       # Main authenticated portal layouts and views
│   │   ├── api/         # Next.js API Routes (JSON endpoints)
│   │   └── login/       # Custom JWT Authentication login view
│   ├── components/      # UI components (StatCards, status badges, charts)
│   ├── lib/             # API client, authorization, constants, and formatting utils
│   ├── middleware/      # Next.js Cookie-based route and API protection middleware
│   ├── tests/           # Integration tests suite (Vitest)
│   └── utils/           # AES-256-GCM encryption helpers for PII data
├── prisma/              # Database Schema, migrations, and seeder
├── .env.example         # Template configuration environment variables
├── biome.json           # Biome linter & formatter configurations
├── turbo.json           # Turborepo task pipeline configs
└── package.json         # Root package manager & scripts
```

---

## Getting Started

### 1. Prerequisite Setup
Clone the repository and set up your local environment file:
```bash
cp .env.example .env.local
```
Open `.env.local` and configure your environment variables:
- **`DATABASE_URL`**: Your PostgreSQL connection string (e.g., Neon).
- **`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`**: Secure keys for JWT authentication.
- **`ENCRYPTION_KEY`**: A secure 32-character key for GCM encryption of PII data.

Install the project dependencies:
```bash
npm install
```

### 2. Database Migration & Seeding
Deploy database schemas and seed the initial dataset (creates seed users with roles, mock vehicles, drivers, expenses, and logs):
```bash
# Push schema to database
npx dotenv-cli -e .env.local -- npx prisma db push

# Seed the database
npx dotenv-cli -e .env.local -- npx prisma db seed
```

### 3. Running the Server (Port 5050)
Start the dev server:
```bash
npx dotenv-cli -e .env.local -- npm run dev
```
Open [http://localhost:5050](http://localhost:5050) in your browser.

### 4. Running Integration Tests
Ensure the local development server is running on port `5050` before executing integration tests.

To run the Vitest suite:
```bash
npx dotenv-cli -e .env.local -- vitest run
```
*Note: Because tests perform actual network calls to the cloud database (e.g. Neon PostgreSQL), some tests may take longer to resolve. If you encounter test timeout errors, run vitest with an extended timeout:*
```bash
npx dotenv-cli -e .env.local -- vitest run --test-timeout=20000
```

---

## Command Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Spins up Next.js dev server on port `5050` |
| `npm run build` | Compiles Next.js for production (including Prisma client generation) |
| `npm run start` | Runs the compiled Next.js production server |
| `npm run lint` | Checks code quality and syntax styles with Biome |
| `npm run format` | Auto-formats code styles inside the `src` folder with Biome |
| `npm run check` | Runs linter, formatter, and imports sorting in write mode |
| `npm run test` | Executes the Vitest integration test suite |

---

## Code Quality & Security Automations

- **Biome & Husky hooks**: Biome (`v2.5.3`) enforces linting rules and code style on all files. An automated pre-push hook prevents pushing changes with style or syntax violations.
- **Custom JWT Auth**: Utilizes secure credential auth. Custom access tokens are returned in responses, and refresh tokens are stored in secure, rotated `HttpOnly` cookies.
- **Role-Based Access Control (RBAC)**: Supports roles (`Admin`, `Fleet Manager`, `Dispatcher`, `Safety Officer`, `Financial Analyst`, `Maintenance Technician`, `Driver`).
- **Demo Role Bypass Switcher**: During local development and testing, you can pass the `X-Demo-Role` header with any API request (e.g., `X-Demo-Role: Dispatcher`) to bypass JWT authentication and run requests under that role.
- **AES-256-GCM Encrypted PII**: Driver contact details and license numbers are encrypted before storing in the database and decrypted on retrieval.
