# XAVI — Multi-Tenant Incident Management Platform

A full-stack MERN application for engineering teams to manage incidents, collaborate, and track operational activities across multiple organizations.

## 🏗 Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   React + TS    │────▶│  Express + TS    │────▶│  MongoDB     │
│   (Frontend)    │◀────│  (REST API)      │◀────│  (Database)  │
│   TailwindCSS   │     │  Socket.IO       │     │              │
│   Context API   │     │  JWT Auth        │     │  Aggregation │
└─────────────────┘     └──────────────────┘     └──────────────┘
     Port 5173              Port 5000              Atlas / Local
```

### Architecture Decisions

1. **Context API over Redux Toolkit** — For a project of this size, Context API provides clean state management without the boilerplate overhead of Redux. Easier to understand and explain in code reviews.

2. **Membership Model for Multi-Tenancy** — Instead of embedding org data in users, a separate `Membership` collection links users to organizations with roles. This enables:
   - Clean tenant isolation (every query filters by `organization` field)
   - One user belonging to multiple organizations
   - Role per organization (a user can be admin in one org, developer in another)

3. **Zod for Validation** — Chosen over Joi for its TypeScript-first approach and smaller bundle size. Validation schemas are co-located in a single file for easy reference.

4. **x-org-id Header Pattern** — Organization context is passed via request headers rather than URL params. This keeps routes clean and makes the middleware reusable across all endpoints.

5. **Activity-Driven Architecture** — Every mutation (create, update, delete) automatically generates an activity log entry. This provides a full audit trail without additional effort.

6. **Refresh Token Rotation** — Each refresh generates a new refresh token and invalidates the old one, preventing token reuse attacks.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | TailwindCSS v4 |
| State | Context API |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB with Mongoose |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Real-time | Socket.IO |
| Validation | Zod |
| Security | Helmet, express-rate-limit, express-mongo-sanitize |
| File Upload | Multer |

---

## 📁 Folder Structure

```
XAVI/
├── backend/
│   └── src/
│       ├── config/          # DB connection, env config
│       ├── controllers/     # Route handlers (business logic)
│       ├── middleware/       # Auth, RBAC, validation, error handling
│       ├── models/          # Mongoose schemas (7 models)
│       ├── routes/          # Express route definitions
│       ├── socket/          # Socket.IO setup
│       ├── utils/           # JWT helpers, response formatters, mention parser
│       ├── validators/      # Zod validation schemas
│       └── server.ts        # App entry point
│
├── frontend/
│   └── src/
│       ├── components/      # Reusable UI (Layout, Sidebar, ProtectedRoute)
│       ├── context/         # AuthContext, OrgContext, SocketContext
│       ├── hooks/           # useDebounce, useClickOutside
│       ├── pages/           # All page components (8 pages)
│       ├── services/        # Axios instance with interceptors
│       └── types/           # TypeScript interfaces
│
└── README.md
```

---

## 🗄 Database Models

| Model | Purpose |
|-------|---------|
| `User` | Name, email, hashed password |
| `Organization` | Tenant entity with name, slug, owner |
| `Membership` | Links users ↔ orgs with roles (admin/manager/developer) |
| `Incident` | Core entity — title, description, severity, status, tags, assignee, reporter, due date, attachments |
| `Comment` | Comments on incidents with @email mention parsing |
| `Activity` | Audit log — every system action is recorded |
| `RefreshToken` | Stored refresh tokens with TTL auto-cleanup |

**Key Indexes:**
- `Membership`: Compound unique index on `(user, organization)` — prevents duplicate memberships
- `Incident`: Indexes on `(organization, status)`, `(organization, severity)`, `(organization, createdAt)` for fast filtered queries
- `RefreshToken`: TTL index on `expiresAt` — MongoDB auto-removes expired tokens

---

## 🔐 Security Implementation

| Security Measure | Implementation |
|-----------------|----------------|
| Password Hashing | bcryptjs with salt rounds of 10 |
| JWT Strategy | 15-minute access tokens + 7-day refresh tokens with rotation |
| Rate Limiting | 100 req/15min general, 20 req/15min for auth endpoints |
| NoSQL Injection | express-mongo-sanitize strips `$` and `.` from inputs |
| HTTP Headers | Helmet sets security headers (CSP, HSTS, etc.) |
| Input Validation | Zod schemas validate all request bodies and query params |
| RBAC | Middleware enforces role checks before route handlers execute |
| Token Refresh | Automatic refresh flow in Axios interceptor — transparent to user |

---

## 🎭 Role-Based Access Control

| Action          | Admin | Manager | Developer |
|-----------------|:-----:|:-------:|:---------:|
| Create Incident |   ✅   |    ✅    |     ✅     |
| Edit Incident   |   ✅   |    ✅    |     ✅     |
| Delete Incident |   ✅   |    ✅    |     ❌     |
| Invite Users    |   ✅   |    ✅    |     ❌     |
| Change Roles    |   ✅   |    ❌    |     ❌     |
| Remove Members  |   ✅   |    ❌    |     ❌     |
| View Dashboard  |   ✅   |    ✅    |     ✅     |
| Add Comments    |   ✅   |    ✅    |     ✅     |


RBAC is enforced at the **backend middleware level** via `requireRole()`, not just hidden in the UI.

---

## 📊 Dashboard Analytics (Aggregation Pipelines)

The dashboard uses **6 MongoDB aggregation pipelines** running in parallel:

1. **Status Counts** — `$group` by status field
2. **Severity Counts** — `$group` by severity field
3. **Average Resolution Time** — `$match` resolved incidents → `$project` time diff → `$group` average
4. **Most Active Users** — `$group` activities by user → `$sort` → `$limit` 5 → `$lookup` user details
5. **Recent Activity** — Latest 10 activities with populated references
6. **Incident Trend** — `$match` last 30 days → `$group` by date string → `$sort`

---

## ⚡ Real-Time Features

Implemented via **Socket.IO** with organization-scoped rooms:

- When a user selects an org, their socket joins room `orgId`
- Events emitted: `incident:created`, `incident:updated`, `incident:statusChanged`, `incident:assigneeChanged`, `comment:added`
- Frontend listens and auto-refreshes data — no manual polling needed

---

## 📡 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | Login with email/password |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Invalidate refresh token |
| GET | `/me` | Get current user (protected) |

### Organizations (`/api/orgs`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create organization |
| GET | `/` | List user's organizations |
| GET | `/:orgId` | Get org details + members |
| POST | `/:orgId/invite` | Invite user by email |
| PATCH | `/:orgId/members/:id/role` | Update member role |
| DELETE | `/:orgId/members/:id` | Remove member |

### Incidents (`/api/incidents`) — requires `x-org-id` header
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create incident |
| GET | `/` | List with filters, search, pagination |
| GET | `/:id` | Get single incident |
| PATCH | `/:id` | Update incident |
| DELETE | `/:id` | Delete (admin/manager only) |
| POST | `/:id/upload` | Upload file attachments |
| POST | `/:id/comments` | Add comment |
| GET | `/:id/comments` | List comments |
| DELETE | `/:id/comments/:commentId` | Delete comment |

### Dashboard (`/api/dashboard`) — requires `x-org-id` header
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Aggregated analytics |

### Activities (`/api/activities`) — requires `x-org-id` header
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Paginated activity timeline |

**Query Parameters for GET `/api/incidents`:**
- `page`, `limit` — Pagination
- `status` — Filter (supports comma-separated: `open,in_progress`)
- `severity` — Filter (supports comma-separated)
- `assignee` — Filter by user ID or `unassigned`
- `search` — Title search (case-insensitive regex)
- `sortBy`, `sortOrder` — Sorting (`createdAt`, `asc`/`desc`)
- `startDate`, `endDate` — Date range filter

---

## 🖥 Frontend Screens

1. **Login Page** — Split layout with branding panel + form
2. **Signup Page** — Registration with validation
3. **Dashboard** — Analytics cards, severity chart, active users, recent activity
4. **Incident List** — Searchable, filterable table with pagination and real-time updates
5. **Incident Detail** — Full incident view + comments tab + activity timeline tab
6. **Create/Edit Incident** — Form with member dropdown for assignee, tag input
7. **Organization Settings** — 3 tabs: General info, Members management, Create new org
8. **Activity Timeline** — Full page timeline with color-coded action types

---

## 🔧 Edge Cases Handled

- **Deleted assignee** — Assignee is populated with `null` gracefully; UI shows "Unassigned"
- **Expired JWT** — Axios interceptor catches 401, automatically refreshes, retries the original request
- **Duplicate invites** — Unique compound index on `Membership(user, organization)` prevents duplicates with clear error message
- **Unauthorized org access** — `requireOrg` middleware checks active membership before any org-scoped operation
- **Invalid filters** — Zod validation on query params returns structured error messages
- **Concurrent updates** — `findOneAndUpdate` with `__v` optimistic concurrency control ensures safe atomic updates, throwing a 409 Conflict if modified simultaneously
- **Refresh token rotation** — Old refresh token is deleted when a new one is issued

---

## 🚀 Setup Instructions


### 1. Clone the repository
```bash
git clone <repository-url>
cd XAVI
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### Quick Start Flow
1. Sign up → creates your account
2. Create an Organization → you become admin
3. Create Incidents → track issues
4. Invite team members → collaborate
5. Use Dashboard → monitor analytics

---

## 📝 License
