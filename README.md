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

Trip responses also include the server-owned `id`, `driverId`, calculated `distanceKm`, `createdAtUtc`, `updatedAtUtc`, and optional `version` fields. Start/end times and client-supplied distance are not part of the frontend contract.

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
