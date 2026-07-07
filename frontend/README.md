# Frontend — Smart Blood Bank

This folder contains the React + Vite single-page application used by Smart Blood Bank. It implements the UI for donors, inventory, requests, emergency flows, and analytics.

## Tech summary

- React 19, Vite, React Router
- Styling: Tailwind CSS
- Charts: Recharts
- API: Axios

## Project structure

```text
frontend/
├── public/        # Static assets, manifest, service worker
├── src/
│   ├── api/       # Axios instance and API helpers
│   ├── components/# Reusable UI components
│   ├── context/   # Auth/context providers
│   ├── pages/     # Route-level screens
│   ├── utils/     # Helpers and constants
│   ├── App.jsx    # Main app shell
│   └── main.jsx   # Application entry point
└── package.json
```

## Local setup

1. Create `.env` and install dependencies:

```bash
cd frontend
cp .env.example .env
npm install
```

2. Start dev server:

```bash
npm run dev
```

Default dev URL: `http://localhost:5173`

## Environment variables

- `VITE_API_URL` — backend API origin (example: `http://localhost:5000/api`)

When deploying to Vercel set `VITE_API_URL` in the project environment variables to point to your deployed backend origin.

## Scripts

- `npm run dev` — run development server
- `npm run build` — create production build
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint

## Notes for developers

- Auth tokens are stored in `localStorage` and automatically attached to API requests by the Axios instance in `src/api/axios.js`.
- Protected routes and role checks are implemented using `ProtectedRoute` and `RoleRoute` components in `src/components`.
- The app includes a PWA service worker (`public/sw.js`) and an install prompt component.

If you want, I can add a short developer guide that documents component structure and how to add new pages or routes.

