/**
 * Local database for the app.
 *
 * With no remote API configured the whole app runs against this store: it is
 * seeded once, then every write (sign-ups, visitors, duty status, pre-approved
 * passes, preferences, …) is persisted through AsyncStorage — `localStorage` /
 * IndexedDB in the browser, SQLite on native — so data survives reloads and app
 * restarts on that device.
 *
 * The store is versioned. On load, an older payload is *migrated forward* (never
 * discarded), and payloads written under the old `mock_db_v*` keys are imported
 * once. The storage key never changes again — schema changes ship as migrations
 * in `MIGRATIONS` below. Call `resetDb()` to wipe back to the seed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Stable key — do not change. Evolve the schema via MIGRATIONS instead. */
const STORAGE_KEY = 'societypass_db';
/** Older keys imported once if the stable key is empty (newest first). */
const LEGACY_KEYS = ['mock_db_v4', 'mock_db_v3', 'mock_db_v2', 'mock_db_v1'];
/** Bump when adding a migration. */
const SCHEMA_VERSION = 4;

export interface MockUser {
  id: number;
  phone: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  role:
    | 'super_admin'
    | 'society_admin'
    | 'security_supervisor'
    | 'guard'
    | 'resident'
    | 'staff';
  profile_photo?: string;
  is_phone_verified: boolean;
  flat?: string;
  gate?: string;
  shift?: string;
  /** Guards only: whether this guard is currently on duty. */
  on_duty?: boolean;
  /** Guards only: which shift the guard is signed on for. */
  duty_shift?: 'day' | 'night';
  /** Per-user UI preference. */
  theme?: 'light' | 'dark';
  /** The society / building this user currently operates in (sticky). */
  society_id?: number;
}

export interface MockVisitor {
  id: number;
  name: string;
  visitor_name: string;
  phone: string;
  purpose: string;
  type: 'guest' | 'delivery' | 'staff' | 'cab';
  status: 'waiting' | 'approved' | 'denied' | 'entered' | 'exited';
  approval_status: 'pending' | 'approved' | 'denied';
  flat: string;
  resident_name: string;
  /** Registered phone of the addressed resident (for WhatsApp alerts). */
  resident_phone?: string;
  society_id?: number;
  society_name?: string;
  vehicle_number?: string;
  photo?: string | null;
  remarks?: string;
  requested_at: string;
  entry_time?: string | null;
  exit_time?: string | null;
  created_by?: number;
  /** Name of the guard who opened the request (shown to the resident). */
  created_by_name?: string;
  requested_by?: number;
  /** Registered resident (user id) this visitor request is addressed to. */
  resident_id?: number;
  /** Who approved/denied it, and their display name. */
  approved_by?: number;
  approved_by_name?: string;
}

export interface MockNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

export interface MockPreApproved {
  id: number;
  name: string;
  phone: string;
  purpose: string;
  valid_from: string;
  valid_to: string;
  /** Number of days the pass was granted for. */
  days: number;
  flat: string;
  resident_name: string;
  society_id?: number;
  created_by: number;
  status: 'active' | 'expired' | 'cancelled';
  /** True while a guard has admitted this pass and the visitor is inside. */
  admitted?: boolean;
  admitted_visit_id?: number;
  /** Set when the resident removes the pass (e.g. "visitor not coming"). */
  cancelled_reason?: string;
  cancelled_at?: string;
}

export interface MockQRPass {
  token: string;
  visitor_name: string;
  phone: string;
  purpose: string;
  flat: string;
  valid_from: string;
  valid_to: string;
  society_id?: number;
  created_by: number;
  created_at: string;
  used: boolean;
}

export interface MockSociety {
  id: number;
  /** "Green Valley Residency", "Tower B", … */
  name: string;
  type: 'society' | 'building';
  city: string;
  address: string;
  pincode: string;
  created_by: number;
  created_at: string;
}

export interface MockFlat {
  id: number;
  number: string;
  tower: string;
  resident_name: string;
  resident_phone: string;
  members: number;
}

export interface MockDB {
  schema_version: number;
  seq: number;
  users: MockUser[];
  visitors: MockVisitor[];
  notifications: MockNotification[];
  preApproved: MockPreApproved[];
  qrPasses: MockQRPass[];
  flats: MockFlat[];
  societies: MockSociety[];
}

function seed(): MockDB {
  // Nothing is seeded. The first owner signs up as admin and creates their
  // society / building; guards and residents sign up after that.
  return {
    schema_version: SCHEMA_VERSION,
    seq: 100,
    users: [],
    visitors: [],
    notifications: [],
    preApproved: [],
    qrPasses: [],
    flats: [],
    societies: [],
  };
}

/**
 * Ordered, numbered schema migrations. Index i upgrades a payload from
 * version i -> i+1. Append only; never edit a shipped migration.
 */
const MIGRATIONS: Array<(db: any) => void> = [
  // v1 -> v2: drop the old bundled demo data. Real accounts and records get ids
  // from `seq` (>= 101); the seeded demo rows used fixed low ids. Keep only the
  // operational guard (1) and admin (3) — everything the user created stays.
  (db) => {
    const keep = new Set([1, 3]);
    db.users = (db.users || []).filter(
      (u: any) => Number(u.id) > 10 || keep.has(Number(u.id))
    );
    db.visitors = (db.visitors || []).filter((v: any) => Number(v.id) >= 100);
    db.preApproved = (db.preApproved || []).filter((p: any) => Number(p.id) >= 100);
    db.notifications = (db.notifications || []).filter((n: any) => Number(n.id) >= 100);
    db.flats = [];
  },
  // v2 -> v3: single society object becomes a `societies` list; every user and
  // record is pinned to the first society.
  (db) => {
    if (!Array.isArray(db.societies)) {
      const legacy = db.society;
      db.societies = legacy
        ? [
            {
              id: Number(legacy.id) || 1,
              name: legacy.name || 'My Society',
              type: 'society',
              city: legacy.city || '',
              address: legacy.address || '',
              pincode: String(legacy.pincode || ''),
              created_by: 0,
              created_at: new Date().toISOString(),
            },
          ]
        : seed().societies;
    }
    delete db.society;
    const firstId = db.societies[0]?.id;
    for (const u of db.users) if (u.society_id == null) u.society_id = firstId;
    for (const v of db.visitors) if (v.society_id == null) v.society_id = firstId;
    for (const p of db.preApproved) if (p.society_id == null) p.society_id = firstId;
    for (const q of db.qrPasses) if (q.society_id == null) q.society_id = firstId;
  },
  // v3 -> v4: full wipe. Everyone signs up fresh, so clear all seeded/demo and
  // previously-created data back to an empty store.
  (db) => {
    db.users = [];
    db.visitors = [];
    db.notifications = [];
    db.preApproved = [];
    db.qrPasses = [];
    db.flats = [];
    db.societies = [];
    db.seq = 100;
  },
];

/** Bring any stored/legacy payload up to the current schema. Idempotent. */
function migrate(input: any): MockDB {
  const db: any = input && typeof input === 'object' ? input : {};

  // Structural defaults (covers legacy `mock_db_v*` payloads).
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.visitors)) db.visitors = [];
  if (!Array.isArray(db.notifications)) db.notifications = [];
  if (!Array.isArray(db.preApproved)) db.preApproved = [];
  if (!Array.isArray(db.qrPasses)) db.qrPasses = [];
  if (!Array.isArray(db.flats)) db.flats = [];
  if (!Array.isArray(db.societies) && !db.society) db.societies = seed().societies;
  if (typeof db.seq !== 'number') {
    const maxId = [...db.users, ...db.visitors, ...db.notifications, ...db.preApproved]
      .map((r: any) => Number(r?.id) || 0)
      .reduce((a, b) => Math.max(a, b), 100);
    db.seq = maxId + 1;
  }

  // Field-level defaults for records created by older app versions.
  for (const u of db.users) {
    if (u.role === 'guard' || u.role === 'security_supervisor') {
      if (typeof u.on_duty !== 'boolean') u.on_duty = false;
      if (u.duty_shift !== 'day' && u.duty_shift !== 'night') u.duty_shift = 'day';
    }
  }
  for (const p of db.preApproved) {
    if (typeof p.days !== 'number') {
      p.days = Math.max(
        1,
        Math.round((+new Date(p.valid_to) - +new Date(p.valid_from)) / 86_400_000) || 1
      );
    }
    if (typeof p.resident_name !== 'string') p.resident_name = '';
    if (typeof p.admitted !== 'boolean') p.admitted = false;
  }

  // Numbered migrations.
  let v = typeof db.schema_version === 'number' ? db.schema_version : 0;
  while (v < SCHEMA_VERSION && MIGRATIONS[v]) {
    MIGRATIONS[v](db);
    v += 1;
  }
  db.schema_version = SCHEMA_VERSION;
  return db as MockDB;
}

let cache: MockDB | null = null;

export async function getDb(): Promise<MockDB> {
  if (cache) return cache;

  // 1. Current store.
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = migrate(JSON.parse(raw));
      await persist();
      return cache;
    }
  } catch {
    // fall through
  }

  // 2. One-time import from a legacy key (preserves earlier sign-ups).
  for (const key of LEGACY_KEYS) {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        cache = migrate(JSON.parse(raw));
        await persist();
        await AsyncStorage.removeItem(key);
        return cache;
      }
    } catch {
      // try the next key
    }
  }

  // 3. First run.
  cache = seed();
  await persist();
  return cache;
}

export async function persist(): Promise<void> {
  if (!cache) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // best effort
  }
}

export async function resetDb(): Promise<void> {
  cache = seed();
  await persist();
}

export function nextId(db: MockDB): number {
  db.seq += 1;
  return db.seq;
}
