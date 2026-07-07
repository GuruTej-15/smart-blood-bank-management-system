# Smart Blood Bank

Smart Blood Bank is a full-stack web application for managing donors, blood inventory, hospital requests, and emergency workflows. It pairs a Node.js + Express REST API with a React + Vite frontend and includes utilities for analytics, broadcasts, and priority-based request handling.

## Project overview

- Purpose: provide an end-to-end tool for blood bank operations, including donor management, inventory tracking, emergency fulfillment, and analytics.
- Audience: developers, hospital administrators, and volunteer coordinators who want a self-hosted blood-management dashboard or a reference implementation.

## Key features

- Donor management and donation history
- Inventory tracking with expiry and low-stock alerts
- Normal and emergency blood request processing with prioritization
- Compatibility and eligibility checks
- Analytics and crisis-simulation dashboards
- Broadcast messaging pipeline for emergency notifications
- JWT-based authentication, role-based access, and admin invite bootstrap

## Tech stack

- Frontend: React, Vite, React Router, Tailwind CSS, Recharts, Axios
- Backend: Node.js, Express, MongoDB (Mongoose)
- Auth & Security: JWT, bcrypt, helmet, express-rate-limit

## Repository layout

```text
bloodbank/
├── backend/        # Express API, controllers, models, scripts
├── frontend/       # React client (Vite)
├── README.md       # This file (overview + quick start)
└── vercel.json     # Frontend deployment config
```

## Quick start

Prerequisites:

- Node.js 18+ and npm
- MongoDB local instance or MongoDB Atlas connection string

1) Start the backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Default API URL: http://localhost:5000 (routes served under `/api`)

2) Start the frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend default: http://localhost:5173

3) (Optional) Seed demo data

```bash
cd backend
npm run seed
```

Remove seeded data:

```bash
cd backend
npm run purge:seed
```

## Environment variables

See [backend/.env.example](backend/.env.example) and [frontend/.env.example](frontend/.env.example).

Important keys:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret used to sign auth tokens
- `CORS_ORIGIN` — allowed origins for requests
- `VITE_API_URL` — frontend setting pointing to backend API origin
- `ADMIN_BOOTSTRAP_CODE` — initial admin invite code (backend)

## Development scripts

Backend (run from `backend/`):

- `npm run dev` — start server with nodemon
- `npm start` — production start
- `npm run seed` — insert demo data
- `npm run purge:seed` — remove demo data
- `npm run test:ds` — run data-structure tests

Frontend (run from `frontend/`):

- `npm run dev` — start Vite dev server
- `npm run build` — build production bundle
- `npm run lint` — run ESLint
- `npm run preview` — preview production build

## API documentation

High-level API groups (all under `/api`):

- `auth` — login, register, Google auth, invite-based admin flow
- `donors` — CRUD donor records and donor QR generation
- `inventory` — blood stock, grouping, expiry management
- `requests` — create and manage normal requests
- `emergency` — create and process emergency requests
- `analytics` — simulated analytics and crisis endpoints

For endpoint details see the route files in [backend/routes](backend/routes).

## Deployment notes

- Frontend: optimized for Vercel (see `vercel.json`). Set `VITE_API_URL` to the backend origin in Vercel environment variables.
- Backend: suitable for Render or any Node-hosting provider. Ensure `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, and `FRONTEND_URL` are set.

## Contributing

- Fork the repo and open a pull request with clear change descriptions.
- Add tests for backend logic where applicable (especially for data structures and request processing).

## Where to look next

- Backend docs: [backend/README.md](backend/README.md)
- Frontend docs: [frontend/README.md](frontend/README.md)

If you'd like, I can also generate a short API reference extracted from the route files.

