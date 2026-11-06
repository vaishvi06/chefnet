# ChiefNet Functional Requirements Document

ChiefNet is a hyperlocal homemade-food subscription platform connecting neighbourhood customers with verified home chefs within a strict 1 km walking radius. Meals are collected exclusively via daily self-pickup using digital QR passes or manual verification codes, with offline payment arranged directly between customer and chef (zero aggregator commissions).

---

## 1. Customer Requirements

### REQ-CUST-01: Profile & Dietary Preferences
- **Status:** Fixed
- **Description:** Customers can view and update their profile details (name, phone, address, photo upload with preview, dietary preferences: all, veg, jain, vegan, non_veg), change their password, and receive clear visual feedback.
- **Acceptance Criteria:**
  - *Given* an authenticated customer on the Profile page,
  - *When* they modify their name, phone, dietary preferences, or upload a profile picture and save,
  - *Then* `PATCH /api/v1/users/me` persists the changes, the photo is stored in uploads, and the UI immediately updates without page reload.
  - *Given* an authenticated customer,
  - *When* they provide valid current and new password matching security policy,
  - *Then* `PATCH /api/v1/auth/change-password` updates the hashed credential.

### REQ-CUST-02: Multi-Modal GPS & Location Change
- **Status:** Fixed
- **Description:** Customers can set or change their 1 km discovery location using browser GPS geolocation, an OpenStreetMap/Nominatim debounced search proxy, or dragging/clicking a Leaflet map pin.
- **Acceptance Criteria:**
  - *Given* a customer on the profile or discovery page,
  - *When* they search an area or move the map pin and confirm,
  - *Then* `POST /api/v1/users/me/location` verifies the coordinates, maps the nearest area, sets `isLocationVerified: true`, and updates the waiting list if the area is inactive.

### REQ-CUST-03: Localized Kitchen Discovery within 1 km
- **Status:** Fixed
- **Description:** Customers can discover approved, active, non-suspended home kitchens within a strict 1000m radius using both an interactive Leaflet map and list cards.
- **Acceptance Criteria:**
  - *Given* a user with verified or searched coordinates,
  - *When* they open the Discover page,
  - *Then* `GET /api/v1/discovery/chefs` returns only approved, non-suspended kitchens within 1 km using MongoDB `$geoNear`.
  - *Given* the map view,
  - *When* hovering or clicking a kitchen marker,
  - *Then* the corresponding card highlights and popup displays kitchen name, distance in meters, star rating, availability status badge, and "View kitchen" action.

### REQ-CUST-04: Guest Location Browsing
- **Status:** New
- **Description:** Logged-out visitors can select or search a location and browse nearby home kitchens without creating an account immediately.
- **Acceptance Criteria:**
  - *Given* an unauthenticated visitor,
  - *When* they search an address or detect GPS on the landing or discover page,
  - *Then* coordinates are stored in local state, and `GET /api/v1/discovery/chefs?lat=&lng=` returns nearby kitchens with guest access.

### REQ-CUST-05: Favourite Kitchens Management
- **Status:** Fixed
- **Description:** Customers can toggle favourite status on kitchen cards, map popups, and the kitchen profile. Favourites are persisted on the backend and listed on a dedicated Favourites page.
- **Acceptance Criteria:**
  - *Given* an authenticated customer,
  - *When* they tap the heart icon on any kitchen,
  - *Then* `POST` or `DELETE /api/v1/customers/favorites/:chefId` updates the list idempotently and synchronizes the heart state across all screens.
  - *Given* a favourited kitchen that is later suspended or unapproved by an admin,
  - *Then* it is flagged with a clear "Temporarily Unavailable" notice on the Favourites page.

### REQ-CUST-06: Subscription Request Flow & Offline Payment Notice
- **Status:** Done
- **Description:** Customers can request a weekly or monthly subscription for breakfast, lunch, dinner, or full-day meals from kitchens within 1 km.
- **Acceptance Criteria:**
  - *Given* an active home kitchen accepting orders within 1 km,
  - *When* a customer submits a subscription request,
  - *Then* `POST /api/v1/subscriptions` creates a `pending` subscription and clearly communicates that billing is settled offline directly with the chef.

### REQ-CUST-07: Daily Meal Reservations with Cutoff Countdown
- **Status:** Done
- **Description:** Customers reserve meals daily from their chef's published menu, subject to strict cutoff times and available portion quotas.
- **Acceptance Criteria:**
  - *Given* an active subscription,
  - *When* the current time is before the menu cutoff time and portions remain,
  - *Then* the customer can reserve a meal and receive an atomic quantity confirmation.
  - *Given* the cutoff time has passed or inventory is zero,
  - *Then* reservations are disabled with an explicit countdown and explanation.

### REQ-CUST-08: Dual-Token Digital Pickup Pass (QR + Manual Token)
- **Status:** Fixed
- **Description:** Customers receive a high-contrast digital pickup pass displaying an encrypted QR code, a human-readable manual pickup token (format `KITCHENCODE-XXXX`), pickup time window, and kitchen address.
- **Acceptance Criteria:**
  - *Given* a confirmed reservation,
  - *When* viewing the pickup pass,
  - *Then* `GET /api/v1/reservations/:id/qr` returns both the signed QR token and the unique `manualToken`, along with high-brightness instructions.

### REQ-CUST-09: Real-time Chat with Subscribed Chef
- **Status:** Done
- **Description:** After a subscription is accepted, real-time messaging is unlocked over Socket.io, revealing the chef's direct contact phone number.
- **Acceptance Criteria:**
  - *Given* an accepted or active subscription,
  - *When* entering the chat page,
  - *Then* customers exchange instant messages with the chef, with message timestamps and read indicators.

### REQ-CUST-10: Multi-Attribute Review & Complaint Filing
- **Status:** Fixed
- **Description:** After meal collection, customers can submit reviews across four criteria (quality, quantity, hygiene, overall) and file formal complaints.
- **Acceptance Criteria:**
  - *Given* a picked-up reservation,
  - *When* the customer submits a review or complaint (`POST /api/v1/complaints`),
  - *Then* the complaint is tracked with `reporterRole: 'customer'`, linked to the chef and reservation, and displayed under My Complaints in the user Helpdesk.

---

## 2. Home Chef Requirements

### REQ-CHEF-01: Kitchen Onboarding & Re-Verification Rules
- **Status:** Fixed
- **Description:** Home chefs register kitchen details (kitchen name, description, operating hours, daily portion capacity, max active subscribers) and verify GPS location. Changing location or address automatically triggers admin re-verification.
- **Acceptance Criteria:**
  - *Given* a newly registered chef,
  - *When* kitchen details and coordinates are saved,
  - *Then* `verificationStatus` is set to `'pending'` and meal listing is gated until admin approval.
  - *Given* an approved chef who updates their physical address,
  - *Then* `isLocationVerified` resets to `false` and status returns to `'pending'`.

### REQ-CHEF-02: Unique & Changeable Kitchen Pickup Code
- **Status:** New
- **Description:** Each kitchen receives a unique, readable identifier (format `CHF-XXXX`). Chefs can view this code on their dashboard and regenerate or change it at any time.
- **Acceptance Criteria:**
  - *Given* an approved chef on the dashboard,
  - *When* they regenerate or change their kitchen code via `PATCH /api/v1/chefs/me/kitchen-code`,
  - *Then* the system verifies uniqueness, updates all unpicked reservations with new manual tokens (`NEWCODE-XXXX`) and refreshed QR tokens inside a transaction, and notifies affected subscribers.

### REQ-CHEF-03: Real-Time Kitchen Preparation Queue (Kanban Board)
- **Status:** Fixed
- **Description:** Chefs track today's orders across four progressive columns: Reserved → Preparing → Ready for Pickup → Picked Up, with one-tap status advancement and order counters.
- **Acceptance Criteria:**
  - *Given* today's reservations list (`GET /api/v1/chefs/queue` or `/chefs/reservations`),
  - *When* a chef clicks "Start Preparing" or "Mark Ready",
  - *Then* `PATCH /api/v1/reservations/:id/status` validates the transition and notifies the customer when ready.

### REQ-CHEF-04: Dual-Method Pickup Verification (Camera Scanner + Manual Token)
- **Status:** Fixed
- **Description:** When a customer arrives, the chef marks the meal picked up by scanning the customer's QR code with the device camera or entering the manual code `KITCHENCODE-XXXX`.
- **Acceptance Criteria:**
  - *Given* a reservation in `ready` status during the pickup window,
  - *When* the chef verifies the QR token or manual token via `POST /api/v1/reservations/verify`,
  - *Then* the reservation is marked `picked_up`, timestamp recorded, customer TrustScore updated, and the queue updates live.
  - *Given* an invalid token, wrong kitchen, unready meal, already picked up meal, or outside pickup window,
  - *Then* the verification endpoint rejects the request with an explicit, human-friendly error message.

### REQ-CHEF-05: Meal Catalog & Menu Scheduling with Safety Locks
- **Status:** Fixed
- **Description:** Chefs manage their dish catalog (create, edit, pause, soft-delete, photo upload) and schedule daily menus with pickup windows and cutoffs.
- **Acceptance Criteria:**
  - *Given* a meal on an upcoming daily menu with active reservations,
  - *When* the chef attempts to delete it,
  - *Then* `DELETE /api/v1/meals/:id` blocks the deletion and prompts the chef to pause the dish instead.

### REQ-CHEF-06: Subscriber Management & Subscriber Removal
- **Status:** Fixed
- **Description:** Chefs can inspect active subscribers, view their contact details, submit punctuality ratings, and remove problematic subscribers with a required reason.
- **Acceptance Criteria:**
  - *Given* an active subscriber on `GET /api/v1/chefs/subscribers`,
  - *When* the chef clicks Remove Subscriber and provides a mandatory reason,
  - *Then* `PATCH /api/v1/chefs/subscribers/:id/remove` sets status to `'cancelled_by_chef'`, cancels future unfulfilled reservations, frees capacity, recalculates availability status, and notifies the customer.

### REQ-CHEF-07: Chef Complaints & Support Inquiries
- **Status:** Fixed
- **Description:** Chefs can report subscriber misconduct, no-shows, or payment disputes to platform administrators.
- **Acceptance Criteria:**
  - *Given* an authenticated chef,
  - *When* they file a complaint via `POST /api/v1/complaints` against a customer or reservation,
  - *Then* it is stored with `reporterRole: 'chef'` and tracked in the admin moderation dashboard.

---

## 3. Admin Requirements

### REQ-ADMIN-01: Household Kitchen Verification Queue
- **Status:** Fixed
- **Description:** Administrators review pending home kitchen applications in a dedicated queue with a detail drawer, inspection map, and Approve / Reject / Suspend controls.
- **Acceptance Criteria:**
  - *Given* an admin accessing `/admin/verification`,
  - *When* `GET /api/v1/admin/chefs/pending` or `GET /api/v1/admin/chefs?status=pending` is called,
  - *Then* all pending kitchens appear with kitchen capacity, operating hours, and 1 km geofence pin.
  - *When* an admin clicks Approve, Reject (with reason), or Suspend,
  - *Then* the status updates, the kitchen is added or removed from discovery, and an audit notification is dispatched.

### REQ-ADMIN-02: Geofence Zones & Live Kitchen Analytics
- **Status:** Fixed
- **Description:** Administrators manage geographic zones with visual circles or polygons on Leaflet, viewing live counts of open kitchens, total approved kitchens, and waiting-list demand.
- **Acceptance Criteria:**
  - *Given* `GET /api/v1/admin/areas`,
  - *When* the admin loads the Geofence page,
  - *Then* open kitchen counts, approved chef counts, and waiting-list foodies are dynamically aggregated from live database records rather than hardcoded metrics.
  - *When* the admin creates, edits, or activates a zone,
  - *Then* the changes persist and update discovery boundaries immediately.

### REQ-ADMIN-03: Centralized Moderation of Customer & Chef Complaints
- **Status:** Fixed
- **Description:** Administrators review all complaints filed across the platform with filters by status, category, and reporter role (`customer` vs `chef`).
- **Acceptance Criteria:**
  - *Given* complaints in the database,
  - *When* an admin views `/admin/complaints`,
  - *Then* `GET /api/v1/admin/complaints` populates reporter role, target entity, reservation, and category.
  - *When* an admin marks in review, resolves with an admin note, issues a warning, suspends a user, or hides an abusive review,
  - *Then* `PATCH /api/v1/admin/complaints/:id` applies the administrative action.

### REQ-ADMIN-04: User Directory & Suspension Enforcement
- **Status:** Done
- **Description:** Administrators can search all customers, chefs, and admins by name/email and toggle account suspension with one click, revoking active sessions.
- **Acceptance Criteria:**
  - *Given* a user in the directory,
  - *When* an admin toggles suspension,
  - *Then* `PATCH /api/v1/admin/users/:id/suspend` sets `isSuspended: true`, clears refresh tokens, and denies subsequent access.

---

## 4. Platform & Cross-Cutting Requirements

### REQ-PLAT-01: Rate-Limited Nominatim Geocoding Proxy
- **Status:** New
- **Description:** The platform provides a secure backend proxy for OpenStreetMap Nominatim geocoding and reverse geocoding with caching, rate-limiting, and identification headers.
- **Acceptance Criteria:**
  - *Given* a search query `q` or coordinates `lat, lng`,
  - *When* `GET /api/v1/geo/search?q=` or `GET /api/v1/geo/reverse?lat=&lng=` is called,
  - *Then* the backend caches responses, enforces max 1 request per second to upstream, sends a valid User-Agent, and prevents frontend IP blocks.

### REQ-PLAT-02: Leaflet Vite Asset Integrity & Map Resizing
- **Status:** Fixed
- **Description:** Leaflet marker assets load reliably in Vite production builds without missing asset errors, and maps automatically adjust to visible containers (`map.invalidateSize()`).
- **Acceptance Criteria:**
  - *Given* a map container switching from hidden to visible,
  - *When* rendered,
  - *Then* tiles and markers render crisply without gray zones or broken image icons.

### REQ-PLAT-03: In-Memory Token Security & Token Rotation
- **Status:** Done
- **Description:** JWT access tokens are maintained strictly in memory; refresh tokens are stored in secure httpOnly cookies rotated on every session extension.
- **Acceptance Criteria:**
  - *Given* an authenticated user,
  - *When* inspecting `localStorage` or `sessionStorage`,
  - *Then* no JWT access tokens or refresh secrets are exposed.

### REQ-PLAT-04: Offline Direct Peer-to-Peer Settlement Model
- **Status:** Done
- **Description:** ChiefNet provides zero aggregator commissions by facilitating direct offline payment between customer and home chef upon subscription confirmation.
- **Acceptance Criteria:**
  - *Given* subscription creation, discovery, and pickup,
  - *Then* all UI states and alerts explicitly clarify that payments are arranged directly with the home chef offline.

