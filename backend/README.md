# ChiefNet Backend REST API

ChiefNet is a production-grade, hyperlocal homemade-food subscription platform backend. Customers subscribe to verified Home Chefs within a strict 1 km radius and collect meals by self-pickup. There is no delivery and no payment gateway; payment is arranged offline directly between the customer and chef.

---

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Folder Structure](#folder-structure)
3. [Setup & Installation](#setup--installation)
4. [Domain Model Mapping (UML to Mongoose)](#domain-model-mapping-uml-to-mongoose)
5. [Trust Score Formula](#trust-score-formula)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [WebSockets & Real-Time Chat](#websockets--real-time-chat)
8. [Automated Cron Jobs](#automated-cron-jobs)
9. [Running Tests](#running-tests)

---

## Tech Stack
- **Runtime**: Node.js 20+ (CommonJS)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM (GeoJSON 2dsphere indexing & transactions)
- **Authentication**: JWT (15-min access tokens) & HTTP-only, secure, sameSite cookies for rotating refresh tokens (7 days)
- **Password Hashing**: Bcryptjs (Cost 12)
- **Real-Time Communication**: Socket.io (subscription-scoped rooms & user notifications)
- **Scheduling**: node-cron (Timezone: `Asia/Kolkata`)
- **Validation**: Joi
- **QR Pickup Engine**: qrcode & signed HMAC/JWT cryptographic tokens
- **Media Upload**: Multer disk storage behind a pluggable `StorageService` interface (Cloudinary/S3-ready)
- **Security & Optimization**: Helmet, CORS, Express-Rate-Limit, Express-Mongo-Sanitize, Morgan, Compression, Cookie-Parser
- **API Documentation**: Swagger UI Express (`/api/docs`) with OpenAPI 3.0
- **Testing**: Jest, Supertest, and `mongodb-memory-server`

---

## Folder Structure
All backend source files are self-contained inside `ChiefNet/backend`:
```text
backend/
├── .env.example              # Sample environment variables
├── .env                      # Local environment configuration
├── .gitignore                # Ignored paths (node_modules, uploads, coverage)
├── package.json              # Package manifest and NPM scripts
├── README.md                 # System architecture and documentation
├── docs/
│   └── openapi.yaml          # OpenAPI 3.0 specification served at /api/docs
├── scripts/
│   └── seed.js               # Comprehensive database seeder
├── src/
│   ├── app.js                # Express application configuration and middleware stack
│   ├── server.js             # HTTP server, MongoDB connection, Socket.io, & Cron startup
│   ├── config/
│   │   ├── env.js            # Environment validation & default parameters
│   │   └── db.js             # MongoDB connection and graceful termination
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── chefController.js
│   │   ├── complaintController.js
│   │   ├── customerController.js
│   │   ├── discoveryController.js
│   │   ├── mealController.js
│   │   ├── notificationController.js
│   │   ├── reservationController.js
│   │   ├── reviewController.js
│   │   ├── subscriptionController.js
│   │   ├── supportController.js
│   │   └── userController.js
│   ├── jobs/
│   │   └── cronJobs.js       # Asia/Kolkata automated schedulers
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication and RBAC authorization
│   │   ├── errorHandler.js   # Centralized error handler with production stack trace hiding
│   │   ├── rateLimiter.js    # Strict brute-force and DDoS limiters
│   │   ├── upload.js         # Multer image upload filter and sizing
│   │   └── validate.js       # Joi request body, query, and params validator
│   ├── models/
│   │   ├── areaModel.js
│   │   ├── chatMessageModel.js
│   │   ├── complaintModel.js
│   │   ├── dailyMenuModel.js
│   │   ├── mealModel.js
│   │   ├── notificationModel.js
│   │   ├── reservationModel.js
│   │   ├── reviewModel.js
│   │   ├── subscriptionModel.js
│   │   ├── supportTicketModel.js
│   │   ├── userModel.js
│   │   └── waitingListModel.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── chefRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── dailyMenuRoutes.js
│   │   ├── discoveryRoutes.js
│   │   ├── mealRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── reservationRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── subscriptionRoutes.js
│   │   ├── supportRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── areaService.js    # Geospatial calculations & area auto-activation
│   │   ├── emailService.js   # Nodemailer dispatcher with local console printing
│   │   ├── notificationService.js
│   │   ├── qrService.js      # Signed QR token creation & PNG generator
│   │   └── storageService.js # Abstract file storage interface (Local/Cloudinary/S3)
│   ├── sockets/
│   │   └── chatSocket.js     # Authenticated Socket.io chat & real-time events
│   ├── utils/
│   │   ├── appError.js       # Operational AppError class
│   │   ├── asyncHandler.js   # Promise rejection wrapper
│   │   ├── response.js       # Standardized { success, message, data } helper
│   │   ├── token.js          # Cryptographic hashing & token generator
│   │   ├── transaction.js    # MongoDB transaction runner with standalone fallback
│   │   └── trustScore.js     # Mathematical Trust Score calculation engine
│   └── validators/
│       └── authValidator.js
└── tests/
    ├── setup.js              # In-memory MongoDB testing environment
    ├── auth.test.js          # Auth, lockout, token rotation, & password reset tests
    ├── authorization.test.js # Role-based access control tests
    ├── area_and_discovery.test.js # 1 km geoNear discovery & area waiting list tests
    ├── subscription_capacity.test.js # Capacity limit & transactional acceptance tests
    └── reservation_qr.test.js # Cutoffs, status machine, & QR verification tests
```

---

## Setup & Installation

> [!IMPORTANT]
> All commands MUST be executed from the `ChiefNet/backend` directory.

### 1. Navigate to the backend directory
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the example environment configuration:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Verify `.env` values (MongoDB URI, JWT Secrets, Port, Timezone):
```env
PORT=5000
NODE_ENV=development
TZ=Asia/Kolkata
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/chiefnet
JWT_ACCESS_SECRET=chiefnet_super_secret_access_jwt_key_2026_xyz
JWT_REFRESH_SECRET=chiefnet_super_secret_refresh_jwt_key_2026_xyz
QR_SECRET=chiefnet_super_secret_qr_signature_key_2026_xyz
BCRYPT_ROUNDS=12
ADMIN_EMAIL=admin@chiefnet.com
ADMIN_PASSWORD=Admin123#Secure
```

### 4. Seed the Database
Populates the database with an Admin, 2 Areas, 6 Verified Chefs across diverse cuisines, 5 Local Customers, Meals, Daily Menus, active Subscriptions, and sample Reservations with QR codes:
```bash
npm run seed
```

### 5. Run the Server
- **Development mode (with auto-reload via Nodemon):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```

### 6. Interactive Swagger Documentation
Open your browser and navigate to:
```text
http://localhost:5000/api/docs
```

---

## Domain Model Mapping (UML to Mongoose)

| UML Class | Mongoose Model | File Location | Key Attributes & Description |
| :--- | :--- | :--- | :--- |
| **User** | `User` | `src/models/userModel.js` | Single-collection discriminator model. Contains `email`, `passwordHash` (select: false, bcrypt 12), `phone`, `role` (`customer`, `chef`, `admin`), `location` (GeoJSON `Point` with 2dsphere index), `isLocationVerified`, `trustScore`, `missedPickupCount`, `ratingAverage`, `ratingCount`, `customerProfile` (`favorites`, `dietaryPreference`), `chefProfile` (`kitchenName`, `dailyCapacity`, `maxSubscribers`, `availabilityStatus`, `verificationStatus`, `vacationPeriods`). |
| **Area** | `Area` | `src/models/areaModel.js` | Hyperlocal cluster model. Contains `name`, `type` (`society`, `locality`, `sector`, `campus`), `center` (`Point` with 2dsphere index), `radiusInMeters`, `geoFence` (`Polygon`), `isActive`, `demandCount`, and `activationThreshold` (default: 5). |
| **WaitingListEntry** | `WaitingListEntry` | `src/models/waitingListModel.js` | Customer interest in unactivated areas. Contains `customer` (ref: `User`), `area` (ref: `Area`), `joinedAt`. Compound unique index on `{ customer, area }`. |
| **Meal** | `Meal` | `src/models/mealModel.js` | Chef meal catalog. Contains `chef` (ref: `User`), `name`, `description`, `price`, `category` (`gujarati`, `punjabi`, `south_indian`, `jain`, `healthy_diet`, `student_budget`), `mealType` (`breakfast`, `lunch`, `dinner`), `isVeg`, `isJain`, `isPaused`, `isRemoved`. |
| **DailyMenu** | `DailyMenu` | `src/models/dailyMenuModel.js` | Daily kitchen offering. Contains `chef` (ref: `User`), `menuDate`, `mealType`, `meals` (refs: `Meal`), `pickupStart`, `pickupEnd`, `cutoffTime`, and `quantityAvailable`. Unique index on `{ chef, menuDate, mealType }`. |
| **Subscription** | `Subscription` | `src/models/subscriptionModel.js` | Recurring meal plan contract. Contains `customer`, `chef`, `planType` (`weekly`, `monthly`), `mealPlan` (`breakfast`, `lunch`, `dinner`, `full_day`), `status` (`pending`, `accepted`, `rejected`, `active`, `paused`, `cancelled`, `expired`), `startDate`, `endDate`, `pausedPeriods`, `cancelOption`. |
| **Reservation** | `Reservation` | `src/models/reservationModel.js` | Specific meal booking. Contains `subscription`, `customer`, `chef`, `dailyMenu`, `meal`, `reserveDate`, `mealType`, `status` (`reserved`, `preparing`, `ready`, `picked_up`, `missed`, `cancelled`), `qrToken` (signed unique JWT), `isMissed`, `pickedUpAt`, `price`. Compound unique on `{ subscription, reserveDate, mealType }`. |
| **Review** | `Review` | `src/models/reviewModel.js` | Bidirectional review. Contains `reservation`, `author`, `target`, `authorRole`, `ratings` (`foodQuality`, `foodQuantity`, `hygiene`, `overall` for chef; `punctuality`, `communication`, `reliability` for customer), `comment`, `isHidden`. |
| **Complaint** | `Complaint` | `src/models/complaintModel.js` | User grievance mechanism. Contains `raisedBy`, `against`, `reservation`, `category` (`food_quality`, `incorrect_info`, `hygiene`, `misconduct`), `description`, `status` (`open`, `in_review`, `resolved`, `rejected`), `adminNote`, `resolvedBy`, `action` (`none`, `warning`, `suspension`). |
| **ChatMessage** | `ChatMessage` | `src/models/chatMessageModel.js` | Chat persistence. Contains `subscription`, `sender`, `text`, `sentAt`, `readAt`. |
| **Notification** | `Notification` | `src/models/notificationModel.js` | Persistent user alerts. Contains `user`, `type`, `message`, `isRead`, `data`. |
| **SupportTicket** | `SupportTicket` | `src/models/supportTicketModel.js` | Platform support tickets. Contains `user`, `subject`, `message`, `status`, `assignedAdmin`, `resolution`. |

---

## Trust Score Formula

The **Trust Score** is a dynamic rating from `0` to `100` that reflects reliability, punctuality, and community integrity. New users begin with a baseline score of `100`.

### Mathematical Formula:
$$\text{TrustScore} = \text{Fulfillment Score (40\%)} + \text{Timeliness Score (25\%)} + \text{Rating Score (25\%)} + \text{Reliability Score (10\%)}$$

$$\text{TrustScore} = \min\left(100, \max\left(0, \text{Round}\left(S_{\text{fulfillment}} + S_{\text{timeliness}} + S_{\text{rating}} + S_{\text{cancellation}}\right)\right)\right)$$

### Component Breakdown:

1. **Fulfillment Score ($S_{\text{fulfillment}}$) — Weight: 40 points**
   Evaluates successfully completed pickups against total bookings:
   $$R_{\text{completion}} = \frac{N_{\text{pickedUp}}}{\max(1, N_{\text{totalReservations}})}$$
   $$S_{\text{fulfillment}} = R_{\text{completion}} \times 40$$

2. **Timeliness & Punctuality Score ($S_{\text{timeliness}}$) — Weight: 25 points**
   Penalizes missed pickup windows:
   $$R_{\text{timeliness}} = \max\left(0, \frac{N_{\text{pickedUp}} - N_{\text{missedPickup}}}{\max(1, N_{\text{pickedUp}} + N_{\text{missedPickup}})}\right)$$
   $$S_{\text{timeliness}} = R_{\text{timeliness}} \times 25$$

3. **Rating Score ($S_{\text{rating}}$) — Weight: 25 points**
   Reflects feedback from counter-parties:
   $$\text{If } N_{\text{ratings}} = 0 \implies S_{\text{rating}} = 20 \text{ (Neutral baseline)}$$
   $$\text{Else } \implies S_{\text{rating}} = \left(\frac{\min(5, \max(1, \text{RatingAverage}))}{5.0}\right) \times 25$$

4. **Low Cancellation Score ($S_{\text{cancellation}}$) — Weight: 10 points**
   Rewards consistent adherence to reservations without unexpected cancellations:
   $$R_{\text{cancellation}} = \frac{N_{\text{cancelled}}}{\max(1, N_{\text{totalReservations}})}$$
   $$S_{\text{cancellation}} = \max(0, 1 - R_{\text{cancellation}}) \times 10$$

### Automatic Triggers:
- **On Pickup Completion**: When chef scans QR code, the customer's score is immediately recalculated and stored.
- **On Missed Pickup**: When the automated cron job detects an uncollected meal after the pickup window, `missedPickupCount` is incremented and the Trust Score is updated downward.
- **On Review Submission**: Rating averages are updated on the target profile, automatically recalculating the rating score component.

---

## API Endpoints Reference

All API routes are prefixed with `/api/v1`.

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required | Rate Limited |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register customer or chef (duplicate email returns 409) | No | Yes |
| `POST` | `/auth/login` | Login with email/password (lockout after 5 attempts) | No | Yes |
| `POST` | `/auth/refresh` | Refresh JWT with automatic token rotation | Cookie/Body | No |
| `POST` | `/auth/logout` | Revoke session and clear refresh cookie | Yes | No |
| `GET` | `/auth/verify-email/:token` | Verify email address via 24h token | No | No |
| `POST` | `/auth/resend-verification` | Resend verification email | No | No |
| `POST` | `/auth/forgot-password` | Send 1h password reset token email | No | Yes |
| `POST` | `/auth/reset-password/:token`| Reset password (revokes all existing sessions) | No | No |
| `GET` | `/auth/me` | Fetch authenticated user profile | Yes | No |
| `PATCH`| `/auth/change-password` | Change password with current password verification | Yes | No |

### Users & Location (`/api/v1/users`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `PATCH`| `/users/me` | Update name, phone, address, photo, or profiles | Yes |
| `POST` | `/users/me/location` | Verify GPS location and associate/activate Area | Yes |
| `GET` | `/users/:id/public` | Public profile for customer or chef | No |

### Customer Features (`/api/v1/customers`)
| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/customers/favorites` | View list of favorite chefs | `customer` |
| `POST` | `/customers/favorites/:chefId` | Add chef to favorites | `customer` |
| `DELETE`| `/customers/favorites/:chefId` | Remove chef from favorites | `customer` |
| `GET` | `/customers/history` | View customer subscription & reservation history | `customer` |

### Chef Features (`/api/v1/chefs`)
| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/chefs/register-kitchen` | Submit kitchen details for admin approval | `chef` |
| `PATCH`| `/chefs/availability` | Update status (`accepting`, `limited`, `full`, `paused`) | `chef` |
| `POST` | `/chefs/vacation` | Schedule vacation period (`from`, `to`, `reason`) | `chef` |
| `GET` | `/chefs/dashboard/analytics`| Daily/weekly/monthly earnings, occupancy, trends | `chef` |
| `GET` | `/chefs/reservations?date=` | List kitchen reservations for date | `chef` |
| `GET` | `/chefs/:id/reviews` | View public customer reviews for chef | Public |

### Discovery (`/api/v1/discovery`)
| Method | Endpoint | Description | Notes |
| :--- | :--- | :--- | :--- |
| `GET` | `/discovery/chefs` | Discover approved chefs within 1 km radius | Uses `$geoNear` max 1000m. Filters: `category`, `minRating`, `vegOnly`, `jainOnly`, `minPrice`, `maxPrice`, `sortBy`. Area must be active. |
| `GET` | `/discovery/chefs/:id` | Detailed chef profile with active daily menus | Returns distance from customer. |

### Meals & Daily Menus (`/api/v1/meals`, `/api/v1/daily-menus`)
| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/meals` | Create new meal in catalog | `chef`, `admin` |
| `GET` | `/meals` | List meals (filtered by cuisine, chef, veg, etc.) | Public |
| `GET` | `/meals/:id` | Get meal by ID | Public |
| `PATCH`| `/meals/:id` | Update meal details | `chef`, `admin` |
| `PATCH`| `/meals/:id/pause` | Toggle pause status of a meal | `chef`, `admin` |
| `DELETE`| `/meals/:id` | Soft delete meal (`isRemoved = true`) | `chef`, `admin` |
| `POST` | `/daily-menus` | Publish daily menu with cutoff and capacity | `chef`, `admin` |
| `GET` | `/daily-menus` | List daily menus (date, mealType, chef) | Public |
| `GET` | `/daily-menus/:id`| Get daily menu by ID | Public |
| `PATCH`| `/daily-menus/:id`| Update daily menu cutoff or quantity | `chef`, `admin` |
| `DELETE`| `/daily-menus/:id`| Delete daily menu | `chef`, `admin` |

### Subscriptions (`/api/v1/subscriptions`)
| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/subscriptions` | Request subscription with chef within 1 km | `customer` |
| `GET` | `/subscriptions` | List subscriptions (phone numbers masked until accepted) | All |
| `PATCH`| `/subscriptions/:id/accept` | Chef accepts subscription inside transaction | `chef`, `admin` |
| `PATCH`| `/subscriptions/:id/reject` | Chef declines subscription request | `chef`, `admin` |
| `PATCH`| `/subscriptions/:id/pause` | Pause subscription with date range | Owner |
| `PATCH`| `/subscriptions/:id/resume`| Resume paused subscription | Owner |
| `PATCH`| `/subscriptions/:id/cancel`| Schedule cancellation (`immediate`, `after_week`, `after_month`) | Owner |

### Reservations & QR Pickup (`/api/v1/reservations`)
| Method | Endpoint | Description | Notes |
| :--- | :--- | :--- | :--- |
| `POST` | `/reservations` | Book meal before cutoff time | Decrements `quantityAvailable` atomically. Generates signed QR token. |
| `GET` | `/reservations` | List reservations with status filter | Role-aware. |
| `PATCH`| `/reservations/:id/status` | Advance kitchen status (`reserved` $\to$ `preparing` $\to$ `ready`) | Strictly enforced state machine. |
| `GET` | `/reservations/:id/qr` | Get signed QR token & PNG Base64 data URL | For customer display. |
| `POST` | `/reservations/verify-qr` | Chef scans customer QR to complete pickup | Verifies signature, chef ownership, and `ready` status. Sets `pickedUpAt`. |

### Reviews, Complaints, Support & Notifications
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/reviews` | Submit review after pickup; updates rating averages & TrustScore |
| `POST` | `/complaints` | File complaint against user |
| `GET` | `/complaints/mine` | View complaints raised by current user |
| `GET` | `/notifications` | Get persistent alerts (unread count included) |
| `PATCH`| `/notifications/:id/read` | Mark alert as read |
| `POST` | `/support-tickets` | Open support ticket |
| `GET` | `/support-tickets/mine` | View tickets opened by current user |
| `GET` | `/chat/:subscriptionId/messages`| Fetch paginated chat history |
| `POST` | `/chat/:subscriptionId/messages`| Send chat message via REST |

### Administration (`/api/v1/admin`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/chefs/pending` | List unverified kitchens awaiting approval |
| `PATCH`| `/admin/chefs/:id/approve` | Approve kitchen; checks area activation |
| `PATCH`| `/admin/chefs/:id/reject` | Reject kitchen registration |
| `PATCH`| `/admin/chefs/:id/suspend` | Suspend or reinstate user (revokes sessions) |
| `GET` | `/admin/areas` | List areas with verified chefs and demand count |
| `POST` | `/admin/areas` | Create new area cluster with threshold |
| `PATCH`| `/admin/areas/:id/activate` | Manually activate an area |
| `GET` | `/admin/waiting-lists` | View customer demand in inactive areas |
| `GET` | `/admin/complaints` | View all platform complaints |
| `PATCH`| `/admin/complaints/:id/resolve` | Resolve complaint, apply suspension, or hide reviews |
| `GET` | `/admin/support-tickets` | Manage platform support tickets |
| `PATCH`| `/admin/support-tickets/:id`| Update ticket status and resolution |
| `GET` | `/admin/analytics` | High-level metrics: verified households, growth, reservation volume, pickup completion rate, complaints |

---

## WebSockets & Real-Time Chat

ChiefNet includes an integrated Socket.io server with JWT authentication.

### Handshake Authentication:
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
});
```

### Events:
- `join_subscription` (`{ subscriptionId }`): Joins room `subscription:<id>`. Verified to ensure caller is customer or chef of an accepted/active subscription.
- `send_message` (`{ subscriptionId, text }`): Persists message in DB and broadcasts `receive_message` to the room.
- `receive_message`: Emitted to room members with populated sender information.
- `mark_read` (`{ messageId }`): Updates read timestamp and broadcasts `message_read`.
- `notification`: Real-time push dispatched to user's private channel (`user:<id>`) on events like order ready, subscription accepted, and reminders.

---

## Automated Cron Jobs

Configured in `src/jobs/cronJobs.js` using timezone `Asia/Kolkata`:

1. **Mark Missed Pickups (`*/15 * * * *`)**:
   Runs every 15 minutes. Scans reservations with status `ready` where the daily menu's pickup window has closed. Marks them as `missed`, increments customer's `missedPickupCount`, recalculates their Trust Score, and notifies them.
2. **Subscription Expiry Reminders (`0 9 * * *`)**:
   Runs daily at 9:00 AM IST. Identifies active subscriptions expiring in 48 hours and sends an email reminder and in-app notification.
3. **Pickup Deadline Reminders (`*/30 * * * *`)**:
   Runs every 30 minutes. Alerts customers when freshly prepared meals are ready for pickup.
4. **Mark Expired Subscriptions (`0 * * * *`)**:
   Runs hourly. Marks passed subscriptions as `expired` and restores kitchen capacity slots for the home chef.

---

## Running Tests

ChiefNet includes an automated test suite executed with Jest, Supertest, and `mongodb-memory-server`:
```bash
npm test
```

The test suite covers:
- User registration, duplicate email rejection (409), and strict password policy.
- Generic login error responses, account lockout after 5 consecutive failures, and refresh token rotation.
- Role-based authorization across customer, chef, and admin access levels.
- Area activation threshold calculations and automatic customer waiting list enrollment.
- 1 km geospatial discovery via `$geoNear` ensuring out-of-bounds chefs are excluded.
- Subscription capacity control inside transactions with auto-rejection when full.
- Reservation cutoff enforcement and atomic quantity decrements.
- Strict reservation state machine (`reserved` $\to$ `preparing` $\to$ `ready` $\to$ `picked_up`).
- QR token cryptographic verification and self-pickup confirmation.
