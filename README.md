# Truck Driver Trips Web

Mobile-first Next.js App Router frontend for truck drivers to authenticate and log daily trips against an existing .NET API.

## Stack

- Next.js 14 (App Router)
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

- `NEXT_PUBLIC_API_URL` - Base URL for the .NET API (example: `http://localhost:5000`)
- `NEXTAUTH_URL` - Frontend URL (example: `http://localhost:3000`)
- `NEXTAUTH_SECRET` - Random long secret used by NextAuth JWT encryption/signing

## Expected .NET API endpoints

This frontend expects these authenticated/unauthenticated endpoints:

- `POST /api/auth/login`
  - Request body: `{ "email": string, "password": string }`
  - Expected response (either shape):
    - `{ "token": string, "user": { "id": string, "email": string, "name": string, "role": "driver" | "admin" } }`
    - or wrapped in `{ "success": true, "data": { ...same payload } }`
- `GET /api/trips`
  - Requires an `Authorization` header using the bearer scheme with the access token returned by login.
  - Expected response: `Trip[]` or `{ "success": true, "data": Trip[] }`
- `POST /api/trips`
  - Requires an `Authorization` header using the bearer scheme with the access token returned by login.
  - Request body: `{ date, startTime, endTime, distance, pickupLocation, dropoffLocation }`
  - Expected response: `Trip` or `{ "success": true, "data": Trip }`

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
