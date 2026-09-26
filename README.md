# Truck Driver Trips Web

Mobile-first Next.js App Router frontend for truck drivers to authenticate and log daily trips against an existing .NET API.

## Stack

- Next.js 16 (App Router)
- React 18 + TypeScript
- NextAuth (credentials provider)
- Axios
- Tailwind CSS

## Prerequisites

- Node.js 18+
- npm 9+
- Running .NET API backend

## Environment variables

Create `.env.local` in the project root from `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Required values:

- `NEXT_PUBLIC_API_URL` - Public base URL for the .NET API, including browser requests (example: `http://localhost:5000`). Aspire injects this value when running the frontend.
- `API_URL` - Optional server-only fallback when `NEXT_PUBLIC_API_URL` is unavailable (example: `http://localhost:5000`)
- `NEXTAUTH_URL` - Frontend URL (example: `http://localhost:3000`)
- `NEXTAUTH_SECRET` - Random long secret used by NextAuth JWT encryption/signing

The API client removes trailing slashes from the configured base URL before making requests.

## Expected .NET API endpoints

This frontend expects these authenticated/unauthenticated endpoints:

- `POST /api/auth/login`
  - Request body: `{ "email": string, "password": string }`
  - Expected response (either shape):
    - `{ "token": string, "user": { "id": string, "email": string, "name": string, "role": "driver" | "admin" } }`
    - or wrapped in `{ "success": true, "data": { ...same payload } }`
- `GET /api/trips`
  - Requires an `Authorization` header using the bearer scheme with the access token returned by login.
  - Optional query parameters: `from`, `to`, `truckId`, `page`, and `pageSize`.
  - Expected response: `Trip[]` (the client also tolerates wrapped responses for compatibility).
- `POST /api/trips`
  - Requires an `Authorization` header using the bearer scheme with the access token returned by login.
  - Request body: `{ date, truckId, startKm, endKm, pickupLocation, dropoffLocation, commissionAmount, bolNumber, fuelCostAmount, waitTimeMinutes, notes }`
  - `commissionAmount`, `fuelCostAmount`, and `waitTimeMinutes` are numeric and use zero when there is no cost or wait. Blank `bolNumber` and `notes` are sent as `null`.
  - Expected response: `Trip` or `{ "success": true, "data": Trip }`
- `PUT /api/trips/{id}`
  - Requires an `Authorization` header and accepts the same request body as `POST /api/trips`.
- `DELETE /api/trips/{id}`
  - Requires an `Authorization` header and returns a successful empty response.
- `GET /api/trips/summary`
  - Requires an `Authorization` header and accepts the same `from`, `to`, and `truckId` filters as `GET /api/trips`.
  - Expected response: `{ "count": number, "totalDistanceKm": number, "totalCommissionAmount": number, "commissionPerKm": number }`, optionally wrapped in `{ "success": true, "data": ... }`.

Trip responses also include the server-owned `id`, `driverId`, calculated `distanceKm`, `truckRegistrationNumber`, `createdAtUtc`, `updatedAtUtc`, and optional `version` fields. `truckId` is the stable truck GUID. Start/end times and client-supplied distance are not part of the frontend contract.

Truck management uses these authenticated endpoints:

- `GET /api/trucks`
  - Drivers receive active trucks. Admins may pass `includeRetired=true` to include retired trucks.
  - Expected response: a raw `TruckResponse[]`.
- `GET /api/trucks/me`
  - Returns the authenticated driver's current `TruckResponse`, or `404` when no truck is assigned.
- `POST /api/trucks`
  - Admin only. Body: `{ "registrationNumber": string, "make": string | null, "model": string | null }`.
- `PUT /api/trucks/{id}`
  - Admin only. Accepts the same body as create.
- `POST /api/trucks/{id}/retire`
  - Admin only. Soft-retires the truck and clears its current assignment while preserving historical trip references.
- `PUT /api/trucks/assignments/{driverId}`
  - Admin only. Body: `{ "truckId": string }` where the value is a truck GUID.
- `DELETE /api/trucks/assignments/{driverId}`
  - Admin only. Clears the driver's current assignment.

The admin UI is available at `/admin/trucks` and is server-protected by the normalized NextAuth `admin` role. It uses a driver account ID for assignment because the API contract does not expose a driver directory endpoint. Drivers do not see the management link and are redirected away from the route. New trips select from active truck GUIDs and preselect `/api/trucks/me`; editing a historical trip keeps its recorded truck selection visible, including when that truck has since been retired.

## Development

```bash
npm install
npm run dev
```

App routes:

- `/` -> redirects to `/dashboard` when logged in, otherwise `/auth/login`
- `/auth/login` -> credentials login
- `/auth/logout` -> sign-out page
- `/dashboard` -> protected trip dashboard
- `/admin/trucks` -> admin-only truck and assignment management

## Validation commands

```bash
npm run type-check
npm run lint
npm run build
# or
npm run check
```

## Security note

Frontend route checks improve UX only. The backend **must** enforce authorization and validate ownership/access for all protected resources.
