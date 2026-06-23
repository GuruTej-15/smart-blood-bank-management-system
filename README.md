# Smart Blood Bank Management & Emergency Response System

A full-stack MERN application implementing the project spec: donor management,
blood inventory, request/emergency handling, expiry tracking, smart donor
matching, crisis prediction, donor rewards, and a simulated emergency
broadcast system — all built on top of six hand-implemented data structures.

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 19 (Vite), React Router, Tailwind CSS, Recharts, Axios, lucide-react |
| Backend  | Node.js, Express |
| Database | MongoDB (via Mongoose) |
| Auth     | JWT + bcrypt |
| Extras   | `qrcode` (digital donor card) |

---

## Folder Structure

```
bloodbank/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── dataStructures/           # The 6 core data structures (see below)
│   ├── models/                   # Mongoose schemas
│   ├── controllers/              # Route handlers / business logic
│   ├── routes/                   # Express routers
│   ├── middleware/                # auth, role guard, error handler
│   ├── utils/                    # store.js (DS<->DB sync), eligibility,
│   │                              # compatibility, fulfillment, broadcast
│   ├── scripts/                  # seed.js, testDataStructures.js
│   ├── app.js / server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/                # One file per screen
    │   ├── components/           # Shared UI (Sidebar, PulseBar, Modal...)
    │   ├── context/AuthContext.jsx
    │   ├── api/axios.js
    │   └── utils/constants.js
    └── .env.example
```

---

## 1. Prerequisites

- **Node.js 18+** and npm
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a free
  [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

If you don't have MongoDB installed locally:
- macOS: `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`
- Windows/Linux: see https://www.mongodb.com/docs/manual/installation/
- Or skip local install entirely and paste an Atlas URI into `MONGO_URI`

---

## 2. Backend Setup

```bash
cd backend
cp .env.example .env       # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run test:ds            # optional: verifies all 6 data structures, no DB needed
npm run seed                # populates sample donors, inventory, requests, hospitals
npm run dev                  # starts the API on http://localhost:5000
```

Seeded login accounts (also printed at the end of `npm run seed`):

| Role     | Email                     | Password   |
|----------|---------------------------|------------|
| Admin    | admin@bloodbank.test      | admin123   |
| Hospital | hospital@bloodbank.test   | hospital123|

## 3. Frontend Setup

```bash
cd frontend
cp .env.example .env       # defaults to http://localhost:5000/api, edit if needed
npm install
npm run dev                  # starts the UI on http://localhost:5173
```

Open `http://localhost:5173`, log in with the seeded admin account above.

---

## Data Structures → Feature Mapping

| Data Structure | File | Used For |
|---|---|---|
| **Hash Table** | `dataStructures/HashTable.js` | Blood Group Lookup — O(1) average lookup of available units per group |
| **Linked List** | `dataStructures/LinkedList.js` | Donor Records — insertion/search/traversal for the donor module & Smart Donor Finder |
| **Queue** | `dataStructures/Queue.js` | Normal blood requests — strict First-Come-First-Served processing |
| **Priority Queue (Max Heap)** | `dataStructures/PriorityQueue.js` | Emergency requests — Critical > High > Medium > Normal, FIFO tie-break |
| **Min Heap** | `dataStructures/MinHeap.js` | Blood expiry tracking — cheapest "what expires soonest?" query, drives FEFO fulfillment |
| **Max Heap** | `dataStructures/MaxHeap.js` | Top Donor Ranking — leaderboard / reward system |

All six are custom implementations (not just wrapped JS objects/arrays) and
are unit-tested independently in `backend/scripts/testDataStructures.js`
(`npm run test:ds`, no database required).

`backend/utils/store.js` is the glue: MongoDB is the durable source of
truth, and this module keeps the six structures live in memory, kept in
sync on every create/update/delete so day-to-day reads/writes operate
against fast in-memory structures instead of re-querying Mongo every time.

---

## Feature Checklist (per the project spec)

**Core:** Donor management · Blood inventory management · Blood request
management · Emergency request handling · Dashboard

**Advanced:** Blood expiry management · Smart Donor Finder · Donation
eligibility checker · Blood compatibility checker · Analytics dashboard

**Unique:** Blood Crisis Predictor · Donor Reward System (Bronze/Silver/
Gold/Platinum) · Emergency Broadcast System (simulated) · Digital Donor
Card (QR code) · AI-Based Demand Insights (explicitly labelled simulation —
a moving-average projection, not a trained model)

---

## Key Assumptions (documented, configurable via `.env`)

- Donation eligibility: **90 days** between donations (`DONATION_ELIGIBILITY_DAYS`)
- Whole blood shelf life: **42 days** from collection (standard for whole blood)
- Low stock threshold: **10 units** (`LOW_STOCK_THRESHOLD`)
- Expiry alert window: **7 days** (`EXPIRY_ALERT_DAYS`)
- Fulfillment uses **FEFO** (First-Expiring-First-Out) to minimise wastage

---

## API Reference (all under `/api`, JWT bearer auth except `/auth/*`)

| Resource | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Donors | `GET/POST /donors`, `GET/PUT/DELETE /donors/:id`, `GET /donors/search?q=`, `GET /donors/smart-finder?bloodGroup=`, `GET /donors/leaderboard`, `GET /donors/:id/eligibility`, `GET /donors/:id/reward`, `GET /donors/:id/card` |
| Inventory | `GET/POST /inventory`, `PUT/DELETE /inventory/:id`, `GET /inventory/snapshot`, `GET /inventory/group/:bloodGroup`, `GET /inventory/expiring?days=`, `GET /inventory/expired`, `POST /inventory/sweep-expired` |
| Requests | `GET/POST /requests`, `GET /requests/:id`, `GET /requests/queue`, `POST /requests/process-next`, `POST /requests/:id/approve`, `POST /requests/:id/reject` |
| Emergency | `GET/POST /emergency`, `GET /emergency/queue`, `POST /emergency/process-next` |
| Hospitals | `GET/POST /hospitals`, `GET/PUT/DELETE /hospitals/:id` |
| Donations | `GET/POST /donations` |
| Analytics | `GET /analytics/dashboard`, `/most-demanded`, `/monthly-donations`, `/monthly-requests`, `/stock-trend`, `/demand-insights` |
| Crisis | `GET /crisis/predict?weeks=` |
| Compatibility | `GET /compatibility/chart`, `GET /compatibility/:bloodGroup` |
| Broadcast | `POST /broadcast/trigger`, `POST /broadcast/auto-check`, `GET /broadcast/history` |

---

## Suggested Viva Talking Points

1. Walk through `utils/store.js` — explain why an in-memory structure is
   layered on top of MongoDB, and how each mutation stays in sync.
2. Run `npm run test:ds` live to demonstrate each data structure in
   isolation.
3. Trigger an emergency request with insufficient stock from the UI and
   show the Emergency Broadcast firing in `/broadcast`.
4. Open the Crisis Predictor and Analytics pages to show the
   moving-average projections are clearly labelled as simulations, not
   real ML — an honest, defensible scope boundary for a viva question.

---

## Future Scope (as in the original spec, not implemented here)

Mobile app · direct hospital system integration · GPS-based donor search ·
real SMS/email delivery for broadcasts · trained ML demand forecasting ·
government blood bank integration.
