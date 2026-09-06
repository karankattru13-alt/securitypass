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

| Role     | Phone        | Password   |
|----------|--------------|------------|
| Guard    | `9000000001` | `password` |
| Resident | `9000000002` | `password` |
| Admin    | `9000000003` | `password` |

OTP sign-in / registration also works — the demo code is always **`123456`**.
Tap a role on the login screen to auto-fill it.

## What works

- **Auth**: password login, OTP login, resident self-registration, persisted
  session (AsyncStorage), token refresh path.
- **Guard**: live gate dashboard (stats, pending approvals, who's inside),
  register a visitor → capture photo → record resident approval → mark
  entry/exit, full visitor history with filters & search, emergency button.
- **Resident**: approve/deny visitors at the gate, pre-clear expected guests,
  manage recurring pre-approved visitors, generate shareable **QR gate passes**,
  visitor history.
- **Admin**: society dashboard (residents / flats / guards / live counts),
  society & flat directory by tower, resident directory with search, security
  staff roster with on-duty toggles.
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
