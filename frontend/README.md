# Frontend Documentation

This folder contains the React and Vite client for the Smart Blood Bank application. It provides the user interface for donor management, inventory handling, emergency workflows, analytics, and more.

## Overview

The frontend is a single-page application built with:

- React 19
- Vite
- React Router
- Tailwind CSS
- Recharts for charts and metrics
- Axios for API communication

## Main areas of the app

The user interface includes screens for:

- authentication and protected routes
- donor records and donor detail views
- inventory and blood stock management
- blood request and emergency request flows
- analytics, crisis prediction, and broadcast views
- admin and role-based landing pages

## Project structure

```text
frontend/
├── public/           # Static assets and service worker
├── src/
│   ├── api/          # API connection setup
│   ├── components/   # Reusable UI components
│   ├── context/      # Auth context and shared state
│   ├── pages/        # Route-level screens
│   ├── utils/        # Helper utilities and constants
│   ├── App.jsx       # Main app shell
│   └── main.jsx      # Application entry point
└── package.json      # Scripts and dependencies
```

## Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The default API base URL is set in [.env.example](.env.example) and points to http://localhost:5000/api.

## Available scripts

```bash
npm run dev      # start the development server
npm run build    # create a production build
npm run lint     # run ESLint checks
npm run preview  # preview the production build locally
```

## Environment variables

The frontend depends on:

- VITE_API_URL: the backend API origin used by Axios

For local development, the app uses `frontend/.env` and defaults to `http://localhost:5000/api` if the variable is missing.

When deploying to Vercel, set `VITE_API_URL` in the Vercel project settings to your Render backend origin.

## Notes

- Authentication tokens are stored in local storage and attached automatically to API requests.
- The app uses protected routes and role-based access checks in the UI.
- The PWA service worker and install prompt are available in the public assets folder.

