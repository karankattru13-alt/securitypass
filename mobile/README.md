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

## Starting accounts

Only two operational accounts are seeded — everything else (residents, extra
guards, visitors, pre-approved passes, flats) comes from real use.

| Role  | Phone        | Password   | Notes                    |
|-------|--------------|------------|--------------------------|
| Guard | `9000000001` | `password` | Ravi Kumar · Main Gate   |
| Admin | `9000000003` | `password` | Anil Mehta               |

**Everyone else signs up** from the login screen (OTP flow, demo code
**`123456`**) — Resident, Guard, or **Owner / Admin**. A new owner creates their
account, then adds one or more **societies / buildings** (name, type, city,
address, pincode) under the admin **Places** tab.

Every guard and resident picks their **society / building** — in Profile, or from
the selector shown on the create screens. The choice is **sticky** (saved to the
account) and scopes what they see: a guard only sees their society's gate
activity, residents and pre-approved passes. An admin manages only the societies
they created. A new resident also sets their house number in **Profile → House /
Flat number** before they show up in directories and the guard's visitor picker.

## What works

- **Auth**: password login, OTP login, resident self-registration, persisted
  session (AsyncStorage), token refresh path.
- **Guard**: live gate dashboard; a **Duty** tab to turn their own on-duty status
  on/off (and see who else is on duty); a **Records** tab logging every request
  they opened or decided, plus the whole society's pre-approved visitors with
  validity in days and an Active/Expired badge. When someone arrives the guard
  opens **New Visitor**, *searches and picks the resident being visited*, enters
  the visitor's name / phone / purpose, and sends an entry request. After the
  resident responds the guard captures a photo and marks entry / exit.
- **Resident**: set their **house / flat number** (Profile); see which guard is
  on duty right now; approve or deny the guard's incoming entry requests — each
  shows **which guard opened it**; pre-clear expected guests; manage recurring
  pre-approved visitors (validity in days, auto-expires); generate shareable
  **QR gate passes**.
- **Admin**: society dashboard with an **On duty now** guard list; full
  **create / edit / delete** over residents, guards and visitor records
  (Residents, Security Staff and the new Visitors screen — tap a row to edit,
  "+" to add). Guards on-duty toggles and derived society/flats views too.
- **CSV export**: guard History & Records and the admin Residents / Society /
  Staff screens each have an **Export CSV** button (real file download on web;
  share sheet on native).
- **WhatsApp alerts**: when a guard raises a request the resident's registered
  number is messaged with the visitor details and an approve / deny link. See
  **WhatsApp delivery** below — automatic sending needs the WhatsApp Business
  Cloud API; without it the app opens wa.me for a manual send.
- **Shared**: notifications centre (polled), profile, settings, light/dark
  preference, one-tap **reset demo data**.

## Architecture

```
mobile/
  App.tsx                     navigation tree (role-based stacks + tabs)
  src/
    services/
      api.ts                  real axios client + mock switch
      mock/db.ts              local versioned DB (AsyncStorage) + forward migrations
      mock/mockClient.ts      mock implementation of every API method
    store/                    Redux Toolkit slices: auth, visitor, notification, gui
    hooks/                    useAuth, useNotifications
    components/               Screen, AppHeader, VisitorCard, StatusPill, QRView, ...
    screens/                  auth / guard / resident / admin / common
    theme.ts, utils/format.ts
```

### Data persistence

Every write — sign-ups, visitors, guard duty status, pre-approved passes, theme
preference — is saved to a local database through AsyncStorage (`localStorage` /
IndexedDB in the browser, SQLite on native). It survives reloads and restarts on
that device.

The store is versioned (`schema_version`) under the stable key `societypass_db`.
On load, older payloads are **migrated forward** (never wiped), and data from the
earlier `mock_db_v*` keys is imported once. New schema changes ship as entries in
`MIGRATIONS` in [src/services/mock/db.ts](src/services/mock/db.ts) — the key
never changes again, so updates no longer clear your data. "Reset demo data" in
Settings wipes back to the seed.

Note: this is per-device local storage, not a shared server. For multi-device /
shared data, point the app at a real backend:

```
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_API_URL=https://your-api.example.com/api
```

`services/api.ts` then uses the real axios `APIClient`. The mock client mirrors
its method surface, so screens don't change.

### WhatsApp delivery

A browser / mobile app **cannot silently send a WhatsApp message** — WhatsApp
only allows opening a pre-filled `wa.me` page that the sender confirms. Real
automatic delivery to the resident's number needs the **WhatsApp Business Cloud
API** (a business number + token). Because that token must never ship in a
public bundle, the app calls a small relay you host.

`utils/whatsapp.ts` picks a delivery mode from env (see [.env.example](.env.example)):

1. **`EXPO_PUBLIC_WA_PROXY_URL`** — your endpoint. It gets `POST { to, message }`
   and forwards to the Cloud API. Minimal Node example:

   ```js
   app.post('/whatsapp/send', async (req, res) => {
     const { to, message } = req.body;
     const r = await fetch(
       `https://graph.facebook.com/v21.0/${process.env.WA_PHONE_ID}/messages`,
       { method: 'POST',
         headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`,
                    'Content-Type': 'application/json' },
         body: JSON.stringify({ messaging_product: 'whatsapp', to,
                                type: 'text', text: { body: message } }) });
     res.sendStatus(r.ok ? 200 : 502);
   });
   ```

   > Cloud API free-form text only reaches users inside a 24-hour session
   > window; for cold notifications send an approved **template** message and
   > adapt the relay accordingly.

2. **`EXPO_PUBLIC_WA_TOKEN` + `EXPO_PUBLIC_WA_PHONE_ID`** — direct Cloud API call
   from the client. Works for dev / private native builds; the token is exposed.

3. Neither — the app opens `wa.me`; the guard taps **send** in WhatsApp.

The approve / deny link in the message is `societypass://request/<id>` (opens the
installed app) or `${EXPO_PUBLIC_APP_URL}/request/<id>` when you host the web
build; React Navigation routes it to the resident's approve/deny screen.
