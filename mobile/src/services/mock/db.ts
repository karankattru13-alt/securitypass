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
const SCHEMA_VERSION = 1;

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
  created_by: number;
  status: 'active' | 'expired';
  /** True while a guard has admitted this pass and the visitor is inside. */
  admitted?: boolean;
  admitted_visit_id?: number;
}

export interface MockQRPass {
  token: string;
  visitor_name: string;
  phone: string;
  purpose: string;
  flat: string;
  valid_from: string;
  valid_to: string;
  created_by: number;
  created_at: string;
  used: boolean;
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
  society: {
    id: number;
    name: string;
    address: string;
    city: string;
    total_flats: number;
    total_residents: number;
    total_guards: number;
    towers: string[];
  };
}

const iso = (offsetMinutes: number) =>
  new Date(Date.now() + offsetMinutes * 60_000).toISOString();

function seed(): MockDB {
  const flats: MockFlat[] = [];
  const towers = ['A', 'B', 'C'];
  let flatId = 1;
  towers.forEach((tower) => {
    for (let floor = 1; floor <= 4; floor++) {
      for (let unit = 1; unit <= 3; unit++) {
        const number = `${tower}-${floor}0${unit}`;
        flats.push({
          id: flatId++,
          number,
          tower,
          resident_name: `Resident ${number}`,
          resident_phone: `98${String(10000000 + flatId).slice(0, 8)}`,
          members: 2 + (flatId % 3),
        });
      }
    }
  });

  return {
    schema_version: SCHEMA_VERSION,
    seq: 100,
    users: [
      {
        id: 1,
        phone: '9000000001',
        password: 'password',
        first_name: 'Ravi',
        last_name: 'Kumar',
        email: 'guard@demo.in',
        role: 'guard',
        is_phone_verified: true,
        gate: 'Main Gate',
        shift: 'Day Shift',
        on_duty: true,
        duty_shift: 'day',
      },
      {
        id: 2,
        phone: '9000000002',
        password: 'password',
        first_name: 'Priya',
        last_name: 'Sharma',
        email: 'resident@demo.in',
        role: 'resident',
        is_phone_verified: true,
        flat: 'A-1203',
      },
      {
        id: 3,
        phone: '9000000003',
        password: 'password',
        first_name: 'Anil',
        last_name: 'Mehta',
        email: 'admin@demo.in',
        role: 'society_admin',
        is_phone_verified: true,
      },
      {
        id: 4,
        phone: '9000000004',
        password: 'password',
        first_name: 'Amit',
        last_name: 'Patel',
        email: 'amit@demo.in',
        role: 'resident',
        is_phone_verified: true,
        flat: 'B-101',
      },
      {
        id: 5,
        phone: '9000000005',
        password: 'password',
        first_name: 'Sneha',
        last_name: 'Nair',
        email: 'sneha@demo.in',
        role: 'resident',
        is_phone_verified: true,
        flat: 'C-202',
      },
      {
        id: 6,
        phone: '9000000006',
        password: 'password',
        first_name: 'Sunil',
        last_name: 'Yadav',
        email: 'guard2@demo.in',
        role: 'guard',
        is_phone_verified: true,
        gate: 'Service Gate',
        shift: 'Night Shift',
        on_duty: false,
        duty_shift: 'night',
      },
    ],
    visitors: [
      {
        id: 11,
        name: 'Suresh Delivery',
        visitor_name: 'Suresh Delivery',
        phone: '9812345670',
        purpose: 'Amazon package',
        type: 'delivery',
        status: 'waiting',
        approval_status: 'pending',
        flat: 'A-1203',
        resident_name: 'Priya Sharma',
        resident_id: 2,
        requested_at: iso(-4),
        photo: null,
        created_by: 1,
        created_by_name: 'Ravi Kumar',
      },
      {
        id: 12,
        name: 'Meena Iyer',
        visitor_name: 'Meena Iyer',
        phone: '9898989898',
        purpose: 'Family visit',
        type: 'guest',
        status: 'waiting',
        approval_status: 'pending',
        flat: 'B-202',
        resident_name: 'Resident B-202',
        requested_at: iso(-12),
        vehicle_number: 'MH12AB1234',
        photo: null,
        created_by: 1,
        created_by_name: 'Ravi Kumar',
      },
      {
        id: 13,
        name: 'Ola Cab',
        visitor_name: 'Ola Cab',
        phone: '9700000000',
        purpose: 'Pickup',
        type: 'cab',
        status: 'entered',
        approval_status: 'approved',
        flat: 'A-1203',
        resident_name: 'Priya Sharma',
        resident_id: 2,
        requested_at: iso(-55),
        entry_time: iso(-45),
        vehicle_number: 'KA01CD4567',
        photo: null,
        created_by: 1,
      },
      {
        id: 14,
        name: 'Ramesh Plumber',
        visitor_name: 'Ramesh Plumber',
        phone: '9611111111',
        purpose: 'Maintenance',
        type: 'staff',
        status: 'entered',
        approval_status: 'approved',
        flat: 'C-301',
        resident_name: 'Resident C-301',
        requested_at: iso(-120),
        entry_time: iso(-90),
        photo: null,
        created_by: 1,
      },
      {
        id: 15,
        name: 'Rahul Verma',
        visitor_name: 'Rahul Verma',
        phone: '9500000001',
        purpose: 'Guest',
        type: 'guest',
        status: 'exited',
        approval_status: 'approved',
        flat: 'A-1203',
        resident_name: 'Priya Sharma',
        resident_id: 2,
        requested_at: iso(-360),
        entry_time: iso(-330),
        exit_time: iso(-180),
        photo: null,
        created_by: 1,
        requested_by: 2,
      },
      {
        id: 16,
        name: 'Zomato Delivery',
        visitor_name: 'Zomato Delivery',
        phone: '9400000002',
        purpose: 'Food delivery',
        type: 'delivery',
        status: 'exited',
        approval_status: 'approved',
        flat: 'B-101',
        resident_name: 'Resident B-101',
        requested_at: iso(-500),
        entry_time: iso(-480),
        exit_time: iso(-465),
        photo: null,
        created_by: 1,
      },
      {
        id: 17,
        name: 'Unknown Salesman',
        visitor_name: 'Unknown Salesman',
        phone: '9300000003',
        purpose: 'Product demo',
        type: 'guest',
        status: 'denied',
        approval_status: 'denied',
        flat: 'C-102',
        resident_name: 'Resident C-102',
        requested_at: iso(-600),
        remarks: 'Resident declined',
        photo: null,
        created_by: 1,
      },
    ],
    notifications: [
      {
        id: 51,
        title: 'Visitor waiting',
        message: 'Suresh Delivery is at the gate for A-1203.',
        type: 'visitor_request',
        is_read: false,
        created_at: iso(-4),
      },
      {
        id: 52,
        title: 'Visitor approved',
        message: 'You approved Ola Cab for entry.',
        type: 'visitor_approved',
        is_read: false,
        created_at: iso(-45),
      },
      {
        id: 53,
        title: 'Pre-approved guest expiring',
        message: 'The pass for Grandparents expires today.',
        type: 'system',
        is_read: true,
        created_at: iso(-240),
      },
      {
        id: 54,
        title: 'Society notice',
        message: 'Water supply maintenance on Sunday 7-9 AM.',
        type: 'announcement',
        is_read: true,
        created_at: iso(-1440),
      },
    ],
    preApproved: [
      {
        id: 71,
        name: 'Grandparents',
        phone: '9822000001',
        purpose: 'Family stay',
        valid_from: iso(-1440),
        valid_to: iso(1440),
        days: 2,
        flat: 'A-1203',
        resident_name: 'Priya Sharma',
        created_by: 2,
        status: 'active',
      },
      {
        id: 72,
        name: 'House Help - Laxmi',
        phone: '9822000002',
        purpose: 'Daily help',
        valid_from: iso(-10080),
        valid_to: iso(43200),
        days: 30,
        flat: 'A-1203',
        resident_name: 'Priya Sharma',
        created_by: 2,
        status: 'active',
      },
      {
        id: 73,
        name: 'Carpenter - Iqbal',
        phone: '9822000003',
        purpose: 'Furniture work',
        valid_from: iso(-4320),
        valid_to: iso(-60),
        days: 3,
        flat: 'B-101',
        resident_name: 'Amit Patel',
        created_by: 4,
        status: 'expired',
      },
    ],
    qrPasses: [],
    flats,
    society: {
      id: 1,
      name: 'Green Valley Residency',
      address: 'Baner Road, Baner',
      city: 'Pune',
      total_flats: flats.length,
      total_residents: flats.reduce((s, f) => s + f.members, 0),
      total_guards: 8,
      towers,
    },
  };
}

/**
 * Ordered, numbered schema migrations. Index i upgrades a payload from
 * version i -> i+1. Append only; never edit a shipped migration.
 */
const MIGRATIONS: Array<(db: any) => void> = [
  // (none yet — v1 is the first stable schema)
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
  if (!Array.isArray(db.flats) || db.flats.length === 0 || !db.society) {
    const fresh = seed();
    if (!Array.isArray(db.flats) || db.flats.length === 0) db.flats = fresh.flats;
    if (!db.society) db.society = fresh.society;
  }
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
