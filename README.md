# Smart Blood Bank

Smart Blood Bank is a full-stack web application for managing donors, blood inventory, emergency requests, and hospital coordination. It combines a Node.js and Express backend with a React and Vite frontend to support real-world blood bank workflows in a single dashboard.

## What this project does

The platform is designed to help a blood bank or emergency response team:

- manage donor records and donation history
- track blood inventory by blood group and expiry date
- process normal and emergency blood requests
- support hospital and donation workflows
- surface analytics, crisis insights, and inventory alerts
- provide a simulated broadcast system for emergency communication

## Main features

- Donor management and smart donor lookup
- Blood inventory tracking and low-stock alerts
- Emergency request handling with priority-based processing
- Compatibility and eligibility checks
- Analytics dashboard and crisis prediction views
- Security features such as JWT authentication, rate limiting, password reset, and invite-based admin onboarding
- Custom data structures implemented in the backend for core operations

## Tech stack

- Frontend: React, Vite, React Router, Tailwind CSS, Recharts, Axios
- Backend: Node.js, Express, MongoDB with Mongoose
- Authentication: JWT and bcrypt-based security flows
- Other libraries: nodemailer, qrcode, helmet, express-rate-limit, and more

## Project structure

```text
bloodbank/
├── backend/           # Express API and business logic
├── frontend/          # React/Vite client application
├── README.md          # Main documentation
└── vercel.json        # Deployment config
```

## Quick start

### 1. Prerequisites

- Node.js 18 or newer
- npm
- MongoDB running locally or a MongoDB Atlas connection string

### 2. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API will run on http://localhost:5000 by default.

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend will run on http://localhost:5173 by default.

### 4. Optional demo data

```bash
cd backend
npm run seed
```

To remove demo or seed data that was previously inserted:

```bash
cd backend
npm run purge:seed
```
## Deployment

This project is configured for a split deployment:

- Backend: deploy to Render as a Node/Express service.
- Frontend: deploy to Vercel as a static Vite app.

For local development, keep `frontend/.env` set to `VITE_API_URL=http://localhost:5000/api`.

When deploying on Vercel, set the frontend environment variable `VITE_API_URL` to your Render backend origin, for example:

```text
https://<your-render-service>.onrender.com
```

If you provide the backend origin without `/api`, the frontend will automatically append `/api` at runtime.

On Render, configure the backend environment variables including `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, and `FRONTEND_URL`.
`CORS_ORIGIN` should include your Vercel app URL, for example `https://<your-vercel-app>.vercel.app`.
## Environment configuration

Key backend environment variables are defined in [backend/.env.example](backend/.env.example), and the frontend uses [frontend/.env.example](frontend/.env.example).

Important settings include:

- MONGO_URI for the MongoDB connection
- JWT_SECRET for signing authentication tokens
- CORS_ORIGIN for allowed frontend origins
- SMTP_* settings for password reset and email delivery
- ADMIN_BOOTSTRAP_CODE for first-admin setup

## Development commands

### Backend

```bash
cd backend
npm start
npm run dev
npm run test:ds
npm run generate-secret
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run preview
```

## Documentation

- Backend guide: [backend/README.md](backend/README.md)
- Frontend guide: [frontend/README.md](frontend/README.md)

## Notes

This project includes a custom in-memory data structure layer in the backend to support fast lookup and workflow logic while still keeping MongoDB as the source of truth. The analytics and crisis pages are intentionally presented as simulation-based views rather than production-grade ML predictions.

