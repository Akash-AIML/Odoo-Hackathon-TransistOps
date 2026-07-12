// src/app/api/docs/route.ts - Interactive API Documentation

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TransitOps API Reference</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0f19;
            --sidebar-bg: #111827;
            --accent-color: #6366f1;
            --text-color: #f3f4f6;
            --text-muted: #9ca3af;
            --border-color: #1f2937;
            --card-bg: #1f2937;
            --get-color: #10b981;
            --post-color: #3b82f6;
            --patch-color: #d97706;
            --delete-color: #ef4444;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.5;
            display: flex;
        }

        /* Sidebar Styling */
        .sidebar {
            width: 320px;
            background-color: var(--sidebar-bg);
            height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            border-right: 1px solid var(--border-color);
            overflow-y: auto;
            padding: 2rem 1.5rem;
        }

        .logo-area {
            margin-bottom: 2.5rem;
        }

        .logo-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #fff;
            letter-spacing: -0.5px;
        }

        .logo-subtitle {
            font-size: 0.8rem;
            color: var(--accent-color);
            font-weight: 600;
            text-transform: uppercase;
        }

        .nav-section {
            margin-bottom: 2rem;
        }

        .nav-section-title {
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 0.75rem;
            letter-spacing: 0.5px;
        }

        .nav-item {
            display: block;
            color: var(--text-muted);
            text-decoration: none;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
            transition: all 0.2s ease;
        }

        .nav-item:hover, .nav-item.active {
            color: #fff;
            background-color: rgba(99, 102, 241, 0.15);
            border-left: 3px solid var(--accent-color);
        }

        /* Main Content Styling */
        .content {
            margin-left: 320px;
            padding: 3rem 4rem;
            width: calc(100% - 320px);
            max-width: 1200px;
        }

        header {
            margin-bottom: 4rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 2rem;
        }

        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            letter-spacing: -1px;
            margin-bottom: 0.5rem;
        }

        header p {
            color: var(--text-muted);
            font-size: 1.1rem;
        }

        .endpoint-card {
            background-color: var(--sidebar-bg);
            border-radius: 12px;
            border: 1px solid var(--border-color);
            padding: 2rem;
            margin-bottom: 3rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        }

        .endpoint-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
            gap: 1rem;
        }

        .method {
            padding: 0.25rem 0.75rem;
            border-radius: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
        }

        .method.get { background-color: rgba(16, 185, 129, 0.2); color: var(--get-color); }
        .method.post { background-color: rgba(59, 130, 246, 0.2); color: var(--post-color); }
        .method.patch { background-color: rgba(217, 119, 6, 0.2); color: var(--patch-color); }
        .method.delete { background-color: rgba(239, 68, 68, 0.2); color: var(--delete-color); }

        .path {
            font-family: 'JetBrains Mono', monospace;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .role-badge {
            margin-left: auto;
            background-color: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.3);
            color: var(--text-color);
            padding: 0.2rem 0.5rem;
            font-size: 0.8rem;
            border-radius: 4px;
        }

        .endpoint-desc {
            margin-bottom: 1.5rem;
            color: var(--text-muted);
        }

        .section-title {
            font-size: 0.9rem;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--accent-color);
            margin-bottom: 0.5rem;
            margin-top: 1.5rem;
        }

        .param-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
        }

        .param-table th, .param-table td {
            text-align: left;
            padding: 0.75rem;
            border-bottom: 1px solid var(--border-color);
        }

        .param-table th {
            color: var(--text-muted);
            font-weight: 600;
        }

        .param-name {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 600;
        }

        .param-type {
            color: var(--text-muted);
            font-style: italic;
        }

        pre {
            background-color: var(--bg-color);
            padding: 1.25rem;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid var(--border-color);
            margin-bottom: 1.5rem;
        }

        code {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            color: #e5e7eb;
        }
    </style>
</head>
<body>

    <div class="sidebar">
        <div class="logo-area">
            <div class="logo-title">TransitOps</div>
            <div class="logo-subtitle">API Control Room</div>
        </div>

        <div class="nav-section">
            <div class="nav-section-title">Authentication</div>
            <a href="#auth-register" class="nav-item">Register User</a>
            <a href="#auth-login" class="nav-item">Login User</a>
            <a href="#auth-refresh" class="nav-item">Token Refresh</a>
            <a href="#auth-logout" class="nav-item">Logout Session</a>
        </div>

        <div class="nav-section">
            <div class="nav-section-title">User Management</div>
            <a href="#users-list" class="nav-item">List Users</a>
            <a href="#users-create" class="nav-item">Create User</a>
            <a href="#users-detail" class="nav-item">User Profile CRUD</a>
        </div>

        <div class="nav-section">
            <div class="nav-section-title">Assets & Operations</div>
            <a href="#dashboard" class="nav-item">Dashboard Stats</a>
            <a href="#vehicles-list" class="nav-item">Vehicles Master</a>
            <a href="#drivers-list" class="nav-item">Drivers Registry</a>
            <a href="#trips-dispatch" class="nav-item">Trip Dispatcher</a>
            <a href="#maintenance" class="nav-item">Maintenance Queue</a>
        </div>

        <div class="nav-section">
            <div class="nav-section-title">Finance & Export</div>
            <a href="#fuel-logs" class="nav-item">Fuel Logging</a>
            <a href="#expense-logs" class="nav-item">Expenses Tracking</a>
            <a href="#reports-roi" class="nav-item">ROI Reports</a>
        </div>
    </div>

    <div class="content">
        <header>
            <h1>TransitOps Backend API Documentation</h1>
            <p>Developer Control Room specifications and route payload schemas.</p>
        </header>

        <!-- REGISTER -->
        <div class="endpoint-card" id="auth-register">
            <div class="endpoint-header">
                <span class="method post">POST</span>
                <span class="path">/api/auth/register</span>
                <span class="role-badge">Permitted: Public</span>
            </div>
            <div class="endpoint-desc">Registers a new operations user account directly. Password is encrypted using Bcrypt. Returns the generated JWT access token and logs a refresh token session.</div>
            
            <div class="section-title">Request Body Schema</div>
            <pre><code>{
  "email": "dispatcher@transitops.in",
  "password": "Password123",
  "name": "Raven K.",
  "role": "Dispatcher" // Admin, Fleet Manager, Dispatcher, Safety Officer, Financial Analyst, Driver, Maintenance Technician
}</code></pre>

            <div class="section-title">Response Example (201 Created)</div>
            <pre><code>{
  "message": "User registered successfully.",
  "user": {
    "id": "u-452f-129b-cd",
    "email": "dispatcher@transitops.in",
    "name": "Raven K.",
    "role": "Dispatcher"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}</code></pre>
        </div>

        <!-- LOGIN -->
        <div class="endpoint-card" id="auth-login">
            <div class="endpoint-header">
                <span class="method post">POST</span>
                <span class="path">/api/auth/login</span>
                <span class="role-badge">Permitted: Public</span>
            </div>
            <div class="endpoint-desc">Validates credentials and logs in the user. Returns JWT Access token. Sets refresh token as secure HttpOnly cookie.</div>
            
            <div class="section-title">Request Body Schema</div>
            <pre><code>{
  "email": "manager@transitops.in",
  "password": "Password123"
}</code></pre>

            <div class="section-title">Response Example (200 OK)</div>
            <pre><code>{
  "message": "Login successful.",
  "user": {
    "id": "u-f033-b4",
    "email": "manager@transitops.in",
    "name": "John Doe",
    "role": "Fleet Manager",
    "driverId": null
  },
  "token": "eyJhbGciOiJIUz..."
}</code></pre>
        </div>

        <!-- DASHBOARD -->
        <div class="endpoint-card" id="dashboard">
            <div class="endpoint-header">
                <span class="method get">GET</span>
                <span class="path">/api/dashboard</span>
                <span class="role-badge">Required: Fleet Manager | Dispatcher | Safety Officer | Financial Analyst</span>
            </div>
            <div class="endpoint-desc">Computes fleet health indexes, utilization metrics, notification warnings, and active maintenance queue lists. Supported filters: <code>?type=Van</code>, <code>?status=Available</code>.</div>

            <div class="section-title">Response Example (200 OK)</div>
            <pre><code>{
  "metrics": {
    "fleetHealth": 92,
    "fleetUtilization": 20,
    "driversAvailable": 3,
    "maintenanceAlerts": 2,
    "todayTrips": 4
  },
  "statusCounts": {
    "Available": 3,
    "OnTrip": 1,
    "InShop": 1,
    "Retired": 0
  },
  "alerts": [
    { "type": "Warning", "message": "Driver Alex license expires tomorrow" }
  ],
  "recentTrips": [],
  "maintenanceQueue": []
}</code></pre>
        </div>

        <!-- VEHICLES -->
        <div class="endpoint-card" id="vehicles-list">
            <div class="endpoint-header">
                <span class="method get">GET</span>
                <span class="path">/api/vehicles</span>
                <span class="role-badge">Required: Fleet Manager | Dispatcher | Financial Analyst</span>
            </div>
            <div class="endpoint-desc">Fetches all vehicles master indexes with paginated pagination, name/regNo search and sorting. Computes vehicle health scores dynamically. Supports parameters: <code>?page=1&limit=10&search=VAN-05&status=Available&sortBy=odometer&sortOrder=asc</code>.</div>

            <div class="section-title">Response Example (200 OK)</div>
            <pre><code>{
  "data": [
    {
      "id": "v-1a2b-3c",
      "regNo": "GJ01AW5121",
      "name": "VAN-05",
      "type": "Van",
      "capacity": 500,
      "odometer": 74000,
      "cost": 620000,
      "status": "Available",
      "health": 95,
      "nextServiceOdo": 75000,
      "documents": "[{\\"name\\":\\"Insurance\\",\\"status\\":\\"Valid\\"}]"
    }
  ],
  "pagination": { "total": 5, "page": 1, "limit": 10, "totalPages": 1 }
}</code></pre>
        </div>

        <!-- TRIP DISPATCH -->
        <div class="endpoint-card" id="trips-dispatch">
            <div class="endpoint-header">
                <span class="method post">POST</span>
                <span class="path">/api/trips</span>
                <span class="role-badge">Required: Dispatcher</span>
            </div>
            <div class="endpoint-desc">Dispatches and records a new logistics trip. Automatically changes both assigned driver and vehicle status to "On Trip" upon dispatch, triggering validation errors if cargo weight exceeds capacity, vehicle is in the shop/retired, or driver license is expired.</div>

            <div class="section-title">Request Body Schema</div>
            <pre><code>{
  "id": "TR-998",
  "source": "Sanand Depot",
  "destination": "Ahmedabad Hub",
  "cargoWeight": 450,
  "distance": 35,
  "vehicleId": "v-1a2b-3c",
  "driverId": "d-4e5f-6g",
  "status": "Dispatched",
  "revenue": 4500
}</code></pre>
        </div>

        <!-- TRIP COMPLETE -->
        <div class="endpoint-card">
            <div class="endpoint-header">
                <span class="method post">POST</span>
                <span class="path">/api/trips/[id]/complete</span>
                <span class="role-badge">Required: Dispatcher | Driver (Assigned Only)</span>
            </div>
            <div class="endpoint-desc">Completes an active trip. Performs final odometer validations (cannot decrease), computes fuel efficiency, automatically flags fuel efficiency drops > 18% as anomalies, and creates a ledger inflow for the trip revenue. Returns both driver and vehicle status to "Available".</div>

            <div class="section-title">Request Body Schema</div>
            <pre><code>{
  "finalOdometer": 74200,
  "fuelLiters": 35,
  "fuelCost": 3500
}</code></pre>
        </div>

        <!-- REPORTS ROI -->
        <div class="endpoint-card" id="reports-roi">
            <div class="endpoint-header">
                <span class="method get">GET</span>
                <span class="path">/api/reports/analytics</span>
                <span class="role-badge">Required: Fleet Manager | Financial Analyst</span>
            </div>
            <div class="endpoint-desc">Exposes total fleet revenues, operational costs, net profit margins, and dynamic per-vehicle ROI calculations calculated exactly using: (Revenue - (Maintenance + Fuel + Expenses)) / Acquisition Cost.</div>

            <div class="section-title">Response Example (200 OK)</div>
            <pre><code>{
  "fleetMetrics": {
    "fleetUtilization": 20,
    "totalOperationalCost": 28900,
    "totalRevenue": 12000,
    "netProfitability": -16900,
    "avgFuelEfficiency": 12.0
  },
  "vehicleReports": [
    {
      "regNo": "GJ01AW5121",
      "name": "VAN-05",
      "financials": {
        "revenue": 2500,
        "maintenance": 2500,
        "fuel": 3950,
        "totalExpenses": 6570,
        "netProfit": -4070,
        "roi": -0.0066
      }
    }
  ]
}</code></pre>
        </div>
    </div>

</body>
</html>
    `;

    return new NextResponse(html, {
        headers: {
            'Content-Type': 'text/html',
        },
    });
}
