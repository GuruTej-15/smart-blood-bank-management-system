# Backend Documentation

This folder contains the Node.js and Express backend for the Smart Blood Bank application. It exposes the REST API that powers the donor, inventory, request, analytics, crisis, and emergency modules.

## Overview

The backend provides:

- authentication and authorization flows
- donor and donation management
- inventory and expiry tracking
- blood request and emergency request processing
- analytics and crisis prediction endpoints
- broadcast and compatibility services
- security middleware for validation, sanitization, and rate limiting

## Main technologies

- Node.js
- Express
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- nodemailer for email-based flows
- qrcode for digital donor card generation

## Project structure

```text
backend/
├── app.js              # Express app setup and middleware
├── server.js           # Server bootstrapping and DB connection
├── controllers/        # Request handlers and business logic
├── routes/             # API routes
├── models/             # Mongoose schemas
├── middleware/         # Auth, validation, error handling, sanitization
├── utils/              # Eligibility, compatibility, fulfillment, broadcast helpers
├── dataStructures/     # Custom data structure implementations
├── scripts/            # Seed and utility scripts
└── tests/              # Security and validation tests
```

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API runs on http://localhost:5000 by default.

## Available scripts

```bash
npm start
npm run dev
npm run seed
npm run purge:seed
npm run test:ds
npm run generate-secret
```

## Environment variables

The backend reads configuration from [.env.example](.env.example). Important values include:

- PORT
- MONGO_URI
- JWT_SECRET
- CORS_ORIGIN
- FRONTEND_URL
- SMTP_* settings for mail delivery
- ADMIN_BOOTSTRAP_CODE for initial admin setup
- OTP_* and PASSWORD_RESET_* settings for security flows

### Deploying on Render

When deploying to Render, configure the service environment variables rather than committing them to source control.

- `FRONTEND_URL` should be your Vercel app URL, for example `https://<your-vercel-app>.vercel.app`
- `CORS_ORIGIN` should include your Vercel domain and any local URLs used in development, for example:
  `http://localhost:5173,https://<your-vercel-app>.vercel.app`
- Use `npm start` as the command for production.

## API base path

All API routes are served under:

```text
/api
```

Examples:

- /api/auth
- /api/donors
- /api/inventory
- /api/requests
- /api/emergency
- /api/analytics

## Notes

The backend keeps MongoDB as the durable source of truth while also maintaining several custom in-memory data structures for faster in-process operations. This is handled through the store and data structure utilities in the backend.
