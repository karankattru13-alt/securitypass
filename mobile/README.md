# SocietyPass Mobile

Expo / React Native app for gated-community visitor management, with **guard**,
**resident** and **admin** roles. It ships with a built-in in-memory mock backend
so the whole thing runs with **no server**.

## Run it

```bash
cd mobile
npm install
npm run web        # open http://localhost:19006  (also: npm run android / npm run ios)
```

> Requires Node 16.13+ (Node 18+ recommended). If `npm install` complains about
> peer versions on newer setups, run `npx expo install --fix`.

## Demo accounts

| Role     | Phone        | Password   | Notes                    |
|----------|--------------|------------|--------------------------|
| Guard    | `9000000001` | `password` |                          |
| Resident | `9000000002` | `password` | Priya Sharma · flat A-1203 |
| Resident | `9000000004` | `password` | Amit Patel · flat B-101  |
| Resident | `9000000005` | `password` | Sneha Nair · flat C-202  |
| Admin    | `9000000003` | `password` |                          |

New residents who sign up via OTP have **no house number** until they set one in
**Profile → House / Flat number** (until then they show as "pending" in the admin
residents list and cannot pre-clear their own guests).

OTP sign-in / registration also works — the demo code is always **`123456`**.
Tap a role on the login screen to auto-fill it.

## What works

- **Auth**: password login, OTP login, resident self-registration, persisted
  session (AsyncStorage), token refresh path.
- **Guard**: live gate dashboard (stats, awaiting-approval, who's inside).
  When someone arrives the guard opens **New Visitor**, *searches and picks the
  resident being visited*, enters the visitor's name / phone / purpose, and sends
  an entry request. After the resident responds the guard captures a photo and
  marks entry / exit. Full visitor history with filters & search, emergency
  button.
- **Resident**: set their **house / flat number** (Profile), approve or deny the
  guard's incoming entry requests (home screen + detail screen), pre-clear
  expected guests, manage recurring pre-approved visitors, generate shareable
  **QR gate passes**, visitor history.
- **Admin**: society dashboard (residents / flats / guards / live counts),
  society & flat directory by tower, **resident directory** showing each
  registered resident and their house number, security staff roster with
  on-duty toggles.
- **Shared**: notifications centre (polled), profile, settings, light/dark
  preference, one-tap **reset demo data**.

## Architecture

```
mobile/
  App.tsx                     navigation tree (role-based stacks + tabs)
  src/
    services/
      api.ts                  real axios client + mock switch
      mock/db.ts              seeded in-memory DB, persisted to AsyncStorage
      mock/mockClient.ts      mock implementation of every API method
    store/                    Redux Toolkit slices: auth, visitor, notification, gui
    hooks/                    useAuth, useNotifications
    components/               Screen, AppHeader, VisitorCard, StatusPill, QRView, ...
    screens/                  auth / guard / resident / admin / common
    theme.ts, utils/format.ts
```

### Using a real backend

Set env vars (see [.env.example](.env.example)):

```
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_API_URL=https://your-api.example.com/api
```

`services/api.ts` then uses the real axios `APIClient`. The mock client mirrors
its method surface, so screens don't change.
