# Backend — Smart Blood Bank

This folder contains the Node.js + Express API powering the Smart Blood Bank application. The backend handles authentication, donor and inventory management, request handling (normal and emergency), analytics endpoints, and supporting utilities.

## Quick summary

- Language: JavaScript (Node.js)
- Framework: Express
- Database: MongoDB (Mongoose ODM)
- Auth: JWT with role-based access and invite bootstrap for admins

## Folder layout

```text
backend/
├── app.js          # Express app configuration (middleware, routes)
├── server.js       # DB connection and server start
├── controllers/    # Route handlers and business logic
├── routes/         # Express route definitions (grouped by feature)
├── models/         # Mongoose schemas
├── middleware/     # Auth, validation, sanitization, error handling
├── utils/          # Helpers: eligibility, compatibility, fulfillment, broadcast
├── dataStructures/ # Custom in-memory data structures used for fast lookup
├── scripts/        # Seed, purge, and test helpers
└── tests/          # Unit/integration tests
```

## Setup (local development)

1. Copy environment variables and install packages:

```bash
cd backend
cp .env.example .env
npm install
```

2. Start the dev server:

```bash
npm run dev
```

Default base URL: `http://localhost:5000` with API routes under `/api`.

## Useful scripts

- `npm run dev` — start development server with nodemon
- `npm start` — start in production mode
- `npm run seed` — insert demo data
- `npm run purge:seed` — remove seeded demo data
- `npm run test:ds` — run data-structure tests
- `npm run generate-secret` — print a new random secret for `JWT_SECRET`

## Environment variables

Configure values in `.env` (see `.env.example`). Key variables:

- `PORT` — server port (default 5000)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing tokens
- `CORS_ORIGIN` — comma-separated list of allowed origins (frontend URLs)
- `FRONTEND_URL` — public frontend url used in emails/links
- `ADMIN_BOOTSTRAP_CODE` — bootstrap code to create the initial admin

## API overview

All endpoints are mounted under `/api`. Main route groups:

- `/api/auth` — login, register, Google auth, token refresh
- `/api/donors` — donor CRUD, QR code generation
- `/api/inventory` — inventory listing, stock adjustments, expiries
- `/api/requests` — general request creation and fulfillment
- `/api/emergency` — emergency requests and priority processing
- `/api/analytics` — simulated analytics and crisis data

Inspect the route files in [backend/routes](./routes) for parameter details and example payloads.

## Deployment notes

- Use `npm start` in production. Ensure environment variables are set securely in your hosting platform.
- For Render or similar services set `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, and `FRONTEND_URL`.

## Notes on architecture

The backend stores persistent records in MongoDB but also maintains some custom in-memory data structures (in `dataStructures/` and `utils/store.js`) to optimize matching and fulfillment logic during request processing. These structures are rebuilt on server start and kept in sync with DB changes where possible.

## API reference (summary)

All endpoints are prefixed with `/api`. Use the `Authorization: Bearer <token>` header for protected routes and JSON bodies for POST/PUT operations.

Auth
- POST `/api/auth/register` — register a new user (body: `name`, `email`, `password`, `role`)
- POST `/api/auth/login` — login (body: `email`, `password`) — rate-limited
- POST `/api/auth/logout` — logout (protected)
- GET `/api/auth/me` — current user (protected)
- POST `/api/auth/admin-invites` — create invite (protected, role: `admin`)
- GET `/api/auth/admin-invites` — list invites (protected, role: `admin`)
- POST `/api/auth/admin-invites/:id/revoke` — revoke invite (protected, role: `admin`)

Donors
- GET `/api/donors/me` — donor profile (protected, role: `donor`)
- GET `/api/donors/leaderboard` — donors leaderboard (protected)
- GET `/api/donors/search` — search donors (protected, roles: `admin`, `hospital`)
- GET `/api/donors/smart-finder` — smart donor finder (protected, roles: `admin`, `hospital`)
- GET `/api/donors/:id/eligibility` — eligibility check (protected, roles: `admin`, `hospital`)
- GET `/api/donors/:id/reward` — donor reward info (protected, roles: `admin`, `hospital`)
- GET `/api/donors/:id/card` — donor QR/card (protected, roles: `admin`, `hospital`)
- POST `/api/donors` — create donor (protected, roles: `admin`, `hospital`)
- GET `/api/donors` — list donors (protected, roles: `admin`, `hospital`)
- GET `/api/donors/:id` — get donor (protected, roles: `admin`, `hospital`)
- PUT `/api/donors/:id` — update donor (protected, role: `admin`)
- DELETE `/api/donors/:id` — delete donor (protected, role: `admin`)

Donations
- POST `/api/donations` — record a donation (protected, roles: `admin`, `hospital`)
- GET `/api/donations` — list donations (protected, roles: `admin`, `hospital`)

Inventory
- GET `/api/inventory/snapshot` — current stock snapshot (protected, roles: `admin`, `hospital`)
- GET `/api/inventory/expiring` — units expiring soon (protected, roles: `admin`, `hospital`)
- GET `/api/inventory/expired` — expired units (protected, roles: `admin`, `hospital`)
- POST `/api/inventory/sweep-expired` — sweep expired units (protected, role: `admin`)
- GET `/api/inventory/group/:bloodGroup` — stock by blood group (protected, roles: `admin`, `hospital`)
- POST `/api/inventory` — add batch (protected, role: `admin`)
- GET `/api/inventory` — list batches (protected, roles: `admin`, `hospital`)
- PUT `/api/inventory/:id` — update batch (protected, role: `admin`)
- DELETE `/api/inventory/:id` — delete batch (protected, role: `admin`)

Requests
- GET `/api/requests/queue` — admin queue view (protected, role: `admin`)
- POST `/api/requests/process-next` — process next queued request (protected, role: `admin`)
- POST `/api/requests` — create a general request (protected, role: `hospital`)
- GET `/api/requests` — list requests (protected, roles: `admin`, `hospital`)
- GET `/api/requests/:id` — get request (protected, roles: `admin`, `hospital`)
- POST `/api/requests/:id/approve` — approve and fulfill (protected, role: `admin`)
- POST `/api/requests/:id/fulfill` — fulfill approved request (protected, role: `admin`)
- POST `/api/requests/:id/reject` — reject request (protected, role: `admin`)

Emergency
- GET `/api/emergency/queue` — emergency queue (protected, roles: `admin`, `hospital`)
- POST `/api/emergency/process-next` — process next emergency (protected, role: `admin`)
- POST `/api/emergency` — create emergency request (protected, role: `hospital`)

Compatibility
- GET `/api/compatibility/chart` — full compatibility chart (protected)
- GET `/api/compatibility/:bloodGroup` — check compatibility for a blood group (protected)

Broadcast
- POST `/api/broadcast/trigger` — manual broadcast trigger (protected, role: `admin`)
- POST `/api/broadcast/auto-check` — auto low-stock check trigger (protected, role: `admin`)
- GET `/api/broadcast/history` — broadcast history (protected, roles: `admin`, `hospital`)

Hospitals
- POST `/api/hospitals` — create hospital (protected, role: `admin`)
- GET `/api/hospitals` — list hospitals (protected, roles: `admin`, `hospital`)
- GET `/api/hospitals/:id` — get hospital (protected, roles: `admin`, `hospital`)
- PUT `/api/hospitals/:id` — update hospital (protected, role: `admin`)
- DELETE `/api/hospitals/:id` — delete hospital (protected, role: `admin`)

Analytics
- GET `/api/analytics/dashboard` — dashboard summary (protected, roles: `admin`, `hospital`)
- GET `/api/analytics/most-demanded` — most demanded groups (protected, roles: `admin`, `hospital`)
- GET `/api/analytics/monthly-donations` — monthly donation counts (protected, roles: `admin`, `hospital`)
- GET `/api/analytics/monthly-requests` — monthly request counts (protected, roles: `admin`, `hospital`)
- GET `/api/analytics/stock-trend` — stock trend (protected, roles: `admin`, `hospital`)
- GET `/api/analytics/demand-insights` — demand insights (protected, roles: `admin`, `hospital`)

Crisis
- GET `/api/crisis/predict` — crisis prediction/simulation (protected)

---

## Development, testing, and deployment (expanded)

Development
- Install and run the dev server:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

- Seed demo data for manual testing:

```bash
npm run seed
```

Testing
- Run the data-structure tests:

```bash
npm run test:ds
```

- Add unit tests under `tests/` and run them with your preferred test runner (project currently includes focused DS tests).

Deployment
- Production command: `npm start` (ensure `NODE_ENV=production` and environment variables are set).
- Example Render setup:
	- Set `Build Command` to `npm install && npm run build` (if applicable) or just `npm install`.
	- Set `Start Command` to `npm start`.
	- Add environment variables: `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`, `ADMIN_BOOTSTRAP_CODE`.

- Frontend (Vercel): set `VITE_API_URL` to your backend origin (for example `https://<your-backend>.onrender.com/api`).

If you want, I can automatically generate a markdown table with example request/response schemas for each endpoint and add it to this README.
