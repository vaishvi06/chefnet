# ChiefNet Frontend Web Application

ChiefNet is a **hyperlocal homemade-food subscription platform** connecting customers to verified home chefs within a strict **1 km walking radius**. Customers subscribe to weekly or monthly home-cooked meal plans and collect their meals daily via **self-pickup** using high-contrast QR passes. ChiefNet operates on a 100% direct peer-to-peer model with **offline payments** (Cash/UPI arranged directly with chefs) and zero aggregator commissions.

This frontend application is built with **React 18, Vite, React Router v6, Tailwind CSS, TanStack Query, and Socket.io**, matching the ChiefNet backend REST API (`/api/v1`) and real-time WebSocket events.

---

## Tech Stack & Libraries

- **Framework & Build:** React 18 + Vite (Plain JSX, no TypeScript)
- **Styling & Design System:** Tailwind CSS with warm neighbourhood palette (Warm cream `#FAF7F2`, Deep forest green `#2F4858`, Saffron turmeric `#E07A5F`, Terracotta `#D9534F`)
- **Routing & Guards:** React Router v6 (`BrowserRouter`, nested layouts, role-based `ProtectedRoute`)
- **State & Data Fetching:** TanStack Query v5 (automatic caching, background refetching, mutation invalidation)
- **HTTP Client & Security:** Axios with request/response interceptors, **in-memory access token** storage (never stored in `localStorage` or `sessionStorage`), automatic refresh token rotation via `httpOnly` secure cookies
- **Real-time Communication:** Socket.io Client (JWT socket authentication, live notifications, real-time kitchen queue updates, two-way direct chat)
- **Maps & Geofencing:** Leaflet + React-Leaflet with OpenStreetMap tiles, interactive pin placement, and 1 km radius geofence visualizer
- **QR Code Engine:** `qrcode.react` (SVG high-contrast customer pickup pass) & `html5-qrcode` (device camera QR barcode scanner with manual 6-character token fallback)
- **Data Visualization & Analytics:** Recharts (responsive revenue trends, meal popularity, reservation volume, occupancy rate)
- **Icons & UI Feedback:** Lucide React icons, `react-hot-toast` notifications, accessible loading skeletons, and interactive dialogs
- **Form Management & Validation:** React Hook Form + Zod (mirroring backend validation rules)
- **Date & Currency Formatting:** `date-fns` & `Intl.NumberFormat` in `Asia/Kolkata` timezone and Indian Rupee (`₹` INR)

---

## Directory Structure

```
frontend/
├── package.json
├── vite.config.js          # Proxies /api, /socket.io, and /uploads to port 5000
├── tailwind.config.js      # ChiefNet warm cream and earth tones theme
├── postcss.config.js
├── .env.example
├── .env                    # Local environment variables
├── index.html              # HTML shell with Google Fonts (Playfair & Inter) & Leaflet CSS
├── README.md
└── src/
    ├── main.jsx            # React root mount
    ├── App.jsx             # App providers (QueryClient, Router, Auth, Socket, Toaster)
    ├── index.css           # Tailwind directives, Leaflet container rules & scrollbars
    ├── api/                # Axios resource modules
    │   ├── client.js       # Axios instance with 401 retry & token interceptor
    │   ├── authApi.js
    │   ├── userApi.js
    │   ├── discoveryApi.js
    │   ├── customerApi.js
    │   ├── chefApi.js
    │   ├── mealApi.js
    │   ├── dailyMenuApi.js
    │   ├── subscriptionApi.js
    │   ├── reservationApi.js
    │   ├── reviewApi.js
    │   ├── complaintApi.js
    │   ├── notificationApi.js
    │   ├── supportApi.js
    │   ├── chatApi.js
    │   └── adminApi.js
    ├── context/
    │   ├── AuthContext.jsx   # Session bootstrap (/auth/refresh -> /auth/me), in-memory token
    │   └── SocketContext.jsx # Authenticated WebSocket with toast notifications & chat
    ├── hooks/
    │   ├── useCountdown.js   # Live countdown timer to reservation cutoff time
    │   └── useGeoLocation.js # Browser GPS locator with permission fallback
    ├── utils/
    │   ├── tokenStorage.js   # Secure in-memory token storage
    │   ├── constants.js      # Categories, meal types, plans, statuses
    │   └── formatters.js     # INR currency, IST date/time, distance in meters/km
    ├── components/
    │   ├── ui/               # Reusable atomic UI (Button, Input, Select, Modal, etc.)
    │   ├── shared/           # QrPass, QrScanner, MapPicker, AreaStatusBanner, etc.
    │   └── layout/           # CustomerLayout, ChefLayout, AdminLayout, PublicLayout
    ├── pages/
    │   ├── public/           # Landing, Login, Register, Password Recovery, 403, 404
    │   ├── customer/         # Onboarding, Discover, ChefProfile, Subscriptions, etc.
    │   ├── chef/             # Onboarding, Dashboard, Meals, Menus, Scanner, Queue, etc.
    │   └── admin/            # Overview, Verification, Areas, Complaints, Support, Users
    ├── routes/
    │   ├── AppRoutes.jsx     # Master route map
    │   └── ProtectedRoute.jsx# Role protection & location verification guard
    └── test/                 # Vitest test suites (auth, routes, countdown, subscription)
```

---

## Getting Started

All commands below must be executed from the `ChiefNet/frontend` directory.

### 1. Prerequisites

- **Node.js** v18+ and **npm** v9+
- The **ChiefNet Backend** running locally on `http://localhost:5000` with MongoDB seeded.

### 2. Environment Configuration

Create a `.env` file in the `frontend` root:

```bash
cp .env.example .env
```

Ensure `.env` contains:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Install Dependencies

```bash
cd ChiefNet/frontend
npm install
```

### 4. Running the Development Server

```bash
npm run dev
```

The frontend will start at **`http://localhost:3000`**.
Vite automatically proxies API calls (`/api`), socket traffic (`/socket.io`), and uploaded images (`/uploads`) directly to the backend at `http://localhost:5000`.

### 5. Running Tests

ChiefNet frontend includes unit tests for authentication schemas, in-memory token safety, role-based protected routes, subscription request generation, and reservation cutoff countdown:

```bash
npm test
```

### 6. Building for Production

```bash
npm run build
```

Build artifacts will be compiled into the `frontend/dist` directory.

---

## Running Backend and Frontend Together

To run the complete platform locally:

1. **Start MongoDB:** Ensure MongoDB is running on `mongodb://localhost:27017/chiefnet` (or your configured `MONGO_URI`).
2. **Seed the Backend Database:**
   ```bash
   cd ChiefNet/backend
   npm run seed
   ```
   *(This populates 1 Admin, 6 verified Home Chefs with active daily menus, 5 Customers within walking distance, active areas, subscriptions, and reservations).*
3. **Start the Backend Server:**
   ```bash
   cd ChiefNet/backend
   npm run dev
   ```
   *(Backend starts on `http://localhost:5000`)*
4. **Start the Frontend App:**
   ```bash
   cd ChiefNet/frontend
   npm run dev
   ```
   *(Frontend runs on `http://localhost:3000`)*

---

## Route Map & Role Permissions

| Route | Allowed Roles | Description |
| :--- | :--- | :--- |
| `/` | Public / Guest | Public landing page explaining the 1 km home kitchen concept & CTA |
| `/login` | Public / Guest | Email & password login with in-memory token injection |
| `/register` | Public / Guest | Account registration (Customer or Home Chef role selector) |
| `/forgot-password` | Public / Guest | Password reset link request |
| `/reset-password/:token` | Public / Guest | Password change screen with validation |
| `/verify-email/:token` | Public / Guest | One-click token email verification |
| `/403` | Authenticated | Forbidden page when accessing unauthorized role routes |
| **Customer App** | | |
| `/customer/onboarding` | `customer` | 3-step onboarding: Email check, Profile setup, Browser GPS verification |
| `/customer/discover` | `customer` | 1 km radar discover page (List & Map view, filters, search, distance) |
| `/customer/chefs/:id` | `customer` | Kitchen profile, menus, reviews, ratings, and subscription request modal |
| `/customer/subscriptions` | `customer` | Active, Pending & Past subscriptions (Pause, Resume, Cancel actions) |
| `/customer/reservations` | `customer` | Daily reservations, preparation status stepper & **high-contrast QR pickup pass** |
| `/customer/chat` | `customer` | Real-time Socket.io two-way chat with subscribed home chefs |
| `/customer/favorites` | `customer` | Quick access to saved neighbourhood home kitchens |
| `/customer/history` | `customer` | Past pickup history and missed reservation records |
| `/customer/notifications` | `customer` | Live notification centre with unread counter |
| `/customer/profile` | `customer` | Edit profile, dietary preferences, GPS address, and password change |
| `/customer/support` | `customer` | Support ticket creation and status tracking |
| **Home Chef App** | | |
| `/chef/onboarding` | `chef` | Kitchen registration, operating hours, capacity, and approval status tracker |
| `/chef/dashboard` | `chef` | At-a-glance KPI metrics and Recharts analytics (revenue, reservations, occupancy) |
| `/chef/meals` | `chef` | Manage dishes (add, edit, photo upload preview, pause, veg/jain flags) |
| `/chef/daily-menu` | `chef` | Calendar menu scheduler (breakfast, lunch, dinner, cutoff time, capacity) |
| `/chef/availability` | `chef` | Kitchen availability status (`accepting`, `limited`, `full`, `paused`, vacation) |
| `/chef/subscription-requests` | `chef` | Pending requests with customer trust scores, Accept / Reject actions |
| `/chef/kitchen-queue` | `chef` | Today's orders board (`reserved` -> `preparing` -> `ready_for_pickup` -> `picked_up`) |
| `/chef/scanner` | `chef` | Device camera QR barcode scanner with manual 6-character token fallback |
| `/chef/subscribers` | `chef` | Active subscribers directory, direct phone calls, customer ratings & trust score |
| `/chef/reviews` | `chef` | Ratings received for food quality, quantity, and hygiene |
| **Admin Console** | | |
| `/admin/overview` | `admin` | Real-time platform KPI statistics, demand counters, and visual growth charts |
| `/admin/verification` | `admin` | Queue of pending kitchen registrations (Approve, Reject with reason, Suspend) |
| `/admin/areas` | `admin` | Locality management, demand threshold monitoring, area activation |
| `/admin/complaints` | `admin` | Moderation queue for complaints, administrative warnings & user suspensions |
| `/admin/support` | `admin` | Customer care ticket desk (assign admin, reply, and resolve) |
| `/admin/users` | `admin` | Directory of all users with search, role filters, and one-tap suspend / reinstate |

---

## Login credentials for testing

To populate all test accounts, ensure you run `npm run seed` in `ChiefNet/backend` before logging in. All accounts are configured with realistic locations in Bellandur and HSR Layout, Bengaluru, within 1 km pickup ranges.

| Role | Name | Email | Password | Note |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | ChiefNet System Admin | `admin@chiefnet.com` | `Admin123#Secure` | Full administrative access to verify chefs, activate areas, moderate complaints, and manage platform users. |
| **Home Chef** | Smt. Shanti Devi | `shanti.devi@chiefnet.test` | `Password123#Secure` | Kitchen: *Shanti's Traditional Gujarati Rasoi* (Bellandur). 4.9★ rating, Gujarati & Jain thalis, active daily lunch menu. |
| **Home Chef** | Chef Gurpreet Singh | `gurpreet.singh@chiefnet.test` | `Password123#Secure` | Kitchen: *Punjab Di Shaan Home Kitchen* (Bellandur). 4.8★ rating, hearty North Indian meal plans. |
| **Home Chef** | Meenakshi Amma | `meenakshi.amma@chiefnet.test` | `Password123#Secure` | Kitchen: *Dakshin Authentic Homemade Delights* (Bellandur). 5.0★ rating, traditional South Indian meals. |
| **Home Chef** | Kavita Patel | `kavita.patel@chiefnet.test` | `Password123#Secure` | Kitchen: *Kavita's Budget Student Meals & Tiffins* (Bellandur). High daily capacity, budget-friendly meal plans. |
| **Home Chef** | Chef Rajesh Kumar | `rajesh.fit@chiefnet.test` | `Password123#Secure` | Kitchen: *FitBites Healthy Diet & High Protein* (HSR Layout Sector 2). Fitness-oriented homemade diet plans. |
| **Home Chef** | Anita Deshmukh | `anita.deshmukh@chiefnet.test` | `Password123#Secure` | Kitchen: *Annapurna Maharashtrian & North Indian Homestyle* (HSR Layout Sector 2). Homestyle Maharashtrian cuisine. |
| **Customer** | Rohan Sharma | `rohan.customer@chiefnet.test` | `Password123#Secure` | Located in Bellandur (~50m from Shanti Devi). Active weekly subscription, ready QR pass for today's pickup. |
| **Customer** | Aakash Verma | `aakash.verma@chiefnet.test` | `Password123#Secure` | Located in Bellandur (~120m from chefs). Active subscription with Gurpreet Singh. |
| **Customer** | Sneha Iyer | `sneha.iyer@chiefnet.test` | `Password123#Secure` | Located in Bellandur (~150m from chefs). Active subscription with Meenakshi Amma. |
| **Customer** | Vikram Malhotra | `vikram.m@chiefnet.test` | `Password123#Secure` | Located in HSR Layout Sector 2 (~40m from Rajesh Kumar). Active fitness meal subscriber. |
| **Customer** | Pooja Hegde | `pooja.h@chiefnet.test` | `Password123#Secure` | Located in HSR Layout Sector 2 (~30m from Anita Deshmukh). Active subscriber. |

