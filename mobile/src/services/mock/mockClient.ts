/**
 * Drop-in replacement for the real `APIClient` that resolves against the
 * in-memory mock DB. Method names / return shapes match `services/api.ts`
 * (`{ data }`, axios-style) so screens and redux thunks are unchanged.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getDb,
  persist,
  resetDb,
  nextId,
  MockUser,
  MockVisitor,
  MockDB,
  MockSociety,
} from './db';

const ok = <T>(data: T) => Promise.resolve({ data, status: 200 });
const delay = (ms = 260) => new Promise((r) => setTimeout(r, ms));

class ApiError extends Error {
  response: { status: number; data: { detail: string } };
  constructor(status: number, detail: string) {
    super(detail);
    this.response = { status, data: { detail } };
  }
}

const tokenFor = (userId: number) => `mock-access-${userId}`;
const refreshFor = (userId: number) => `mock-refresh-${userId}`;

async function currentUser(): Promise<MockUser | null> {
  const token = await AsyncStorage.getItem('access_token');
  if (!token || !token.startsWith('mock-access-')) return null;
  const id = Number(token.replace('mock-access-', ''));
  const db = await getDb();
  return db.users.find((u) => u.id === id) ?? null;
}

const publicUser = (u: MockUser) => {
  const { password, ...rest } = u;
  return rest;
};

class MockAPIClient {
  // ---- Auth ---------------------------------------------------------------
  async requestOTP(phone: string) {
    await delay();
    if (!/^\d{10}$/.test(phone)) throw new ApiError(400, 'Enter a valid 10-digit phone number.');
    // Any code works, but 123456 is the documented demo code.
    return ok({ detail: 'OTP sent', demo_code: '123456' });
  }

  async verifyOTP(
    phone: string,
    code: string,
    firstName?: string,
    lastName?: string,
    role?: string
  ) {
    await delay();
    if (code !== '123456') throw new ApiError(400, 'Invalid OTP. Use 123456 in demo mode.');
    const db = await getDb();
    let user = db.users.find((u) => u.phone === phone);
    if (!user) {
      const newRole: MockUser['role'] =
        role === 'guard'
          ? 'guard'
          : role === 'society_admin' || role === 'admin'
          ? 'society_admin'
          : 'resident';
      user = {
        id: nextId(db),
        phone,
        password: 'password',
        first_name: firstName || 'New',
        last_name: lastName || (newRole === 'guard' ? 'Guard' : 'Resident'),
        email: `${phone}@demo.in`,
        role: newRole,
        is_phone_verified: true,
        ...(newRole === 'guard'
          ? { gate: 'Main Gate', shift: 'Day Shift', on_duty: false, duty_shift: 'day' as const }
          : {}),
      };
      db.users.push(user);
      await persist();
    }
    return ok({
      access: tokenFor(user.id),
      refresh: refreshFor(user.id),
      user: publicUser(user),
    });
  }

  async login(phone: string, password: string) {
    await delay();
    const db = await getDb();
    const user = db.users.find((u) => u.phone === phone);
    if (!user || user.password !== password) {
      throw new ApiError(401, 'Invalid phone or password.');
    }
    return ok({
      access: tokenFor(user.id),
      refresh: refreshFor(user.id),
      user: publicUser(user),
    });
  }

  // ---- Users ------------------------------------------------------------
  async getMe() {
    await delay(120);
    const user = await currentUser();
    if (!user) throw new ApiError(401, 'Not authenticated');
    return ok(publicUser(user));
  }

  async updateProfile(data: any) {
    await delay();
    const db = await getDb();
    const me = await currentUser();
    if (!me) throw new ApiError(401, 'Not authenticated');
    const idx = db.users.findIndex((u) => u.id === me.id);
    db.users[idx] = { ...db.users[idx], ...data };
    await persist();
    return ok(publicUser(db.users[idx]));
  }

  // ---- Visitors -------------------------------------------------------
  async createVisitor(visitorData: any) {
    await delay();
    const db = await getDb();
    const me = await currentUser();
    const now = new Date().toISOString();
    const name = visitorData.name || visitorData.visitor_name || 'Visitor';
    const createdByResident = me?.role === 'resident' || me?.role === 'staff';

    // Resolve the addressed resident: either an explicit resident_id (guard flow)
    // or, when a resident registers their own expected guest, themselves.
    const targetResident =
      (visitorData.resident_id &&
        db.users.find((u) => u.id === Number(visitorData.resident_id))) ||
      (createdByResident ? me : undefined);

    const visitor: MockVisitor = {
      id: nextId(db),
      name,
      visitor_name: name,
      phone: visitorData.phone || '',
      purpose: visitorData.purpose || 'Visit',
      type: visitorData.type || 'guest',
      status: createdByResident ? 'approved' : 'waiting',
      approval_status: createdByResident ? 'approved' : 'pending',
      flat: visitorData.flat || targetResident?.flat || me?.flat || '',
      resident_name: targetResident
        ? `${targetResident.first_name} ${targetResident.last_name}`
        : visitorData.resident_name || '',
      resident_phone: targetResident?.phone,
      resident_id: targetResident?.id,
      society_id: visitorData.society_id
        ? Number(visitorData.society_id)
        : me?.society_id ?? targetResident?.society_id,
      society_name: (() => {
        const sid = visitorData.society_id
          ? Number(visitorData.society_id)
          : me?.society_id ?? targetResident?.society_id;
        return db.societies.find((s) => s.id === sid)?.name;
      })(),
      vehicle_number: visitorData.vehicle_number || undefined,
      photo: visitorData.photo || null,
      requested_at: now,
      entry_time: null,
      exit_time: null,
      created_by: me?.id,
      created_by_name:
        me && !createdByResident ? `${me.first_name} ${me.last_name}` : undefined,
      requested_by: createdByResident ? me?.id : undefined,
    };
    db.visitors.unshift(visitor);
    db.notifications.unshift({
      id: nextId(db),
      title: createdByResident ? 'Visitor pre-approved' : 'Approval needed',
      message: createdByResident
        ? `${name} is expected at ${visitor.flat}.`
        : `${name} is at the gate to meet ${visitor.resident_name || visitor.flat}. Approve or deny?`,
      type: 'visitor_request',
      is_read: false,
      created_at: now,
      data: { visitorId: visitor.id, residentId: visitor.resident_id },
    });
    await persist();
    return ok(visitor);
  }

  /** Registered residents (used by the guard's "who is this visitor for?" picker
   *  and by the admin residents directory). */
  async getResidents() {
    await delay(140);
    const db = await getDb();
    const me = await currentUser();
    return ok(
      db.users
        .filter(
          (u) =>
            (u.role === 'resident' || u.role === 'staff') &&
            (!me?.society_id || u.society_id === me.society_id)
        )
        .map((u) => ({
          id: u.id,
          name: `${u.first_name} ${u.last_name}`.trim(),
          first_name: u.first_name,
          last_name: u.last_name,
          phone: u.phone,
          email: u.email,
          flat: u.flat || '',
          society_id: u.society_id,
          role: u.role,
        }))
    );
  }

  async getVisitors(filters: any = {}) {
    await delay(160);
    const db = await getDb();
    const me = await currentUser();
    let list = [...db.visitors];

    if (me?.role === 'resident' || me?.role === 'staff') {
      list = list.filter(
        (v) =>
          v.resident_id === me.id ||
          v.requested_by === me.id ||
          (!!me.flat && v.flat === me.flat)
      );
    } else if (me && this.isGuard(me) && me.society_id) {
      // A guard only sees their own society (untagged legacy rows still show).
      list = list.filter((v) => v.society_id == null || v.society_id === me.society_id);
    }
    if (filters.status) list = list.filter((v) => v.status === filters.status);
    if (filters.approval_status) {
      list = list.filter((v) => v.approval_status === filters.approval_status);
    }
    if (filters.type) list = list.filter((v) => v.type === filters.type);
    if (filters.flat) list = list.filter((v) => v.flat === filters.flat);
    if (filters.search) {
      const q = String(filters.search).toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.flat.toLowerCase().includes(q) ||
          v.phone.includes(q)
      );
    }
    list.sort((a, b) => +new Date(b.requested_at) - +new Date(a.requested_at));
    return ok(list);
  }

  async getVisitor(id: number) {
    await delay(120);
    const db = await getDb();
    const visitor = db.visitors.find((v) => v.id === Number(id));
    if (!visitor) throw new ApiError(404, 'Visitor not found');
    return ok(visitor);
  }

  async updateVisitor(id: number, data: any) {
    await delay();
    const db = await getDb();
    const idx = db.visitors.findIndex((v) => v.id === Number(id));
    if (idx === -1) throw new ApiError(404, 'Visitor not found');
    db.visitors[idx] = { ...db.visitors[idx], ...data };
    if (data.name) db.visitors[idx].visitor_name = data.name;
    await persist();
    return ok(db.visitors[idx]);
  }

  async uploadVisitorPhoto(visitorId: number, photoUri: string, _photoType: string) {
    await delay();
    const db = await getDb();
    const idx = db.visitors.findIndex((v) => v.id === Number(visitorId));
    if (idx === -1) throw new ApiError(404, 'Visitor not found');
    db.visitors[idx].photo = photoUri;
    await persist();
    return ok({ id: nextId(db), visitor: visitorId, photo: photoUri });
  }

  private async setVisitorState(
    visitorId: number,
    patch: Partial<MockVisitor>,
    note?: { title: string; message: string; type: string }
  ) {
    const db = await getDb();
    const idx = db.visitors.findIndex((v) => v.id === Number(visitorId));
    if (idx === -1) throw new ApiError(404, 'Visitor not found');
    db.visitors[idx] = { ...db.visitors[idx], ...patch };
    if (note) {
      db.notifications.unshift({
        id: nextId(db),
        title: note.title,
        message: note.message,
        type: note.type,
        is_read: false,
        created_at: new Date().toISOString(),
        data: { visitorId },
      });
    }
    await persist();
    return db.visitors[idx];
  }

  async approveVisitor(visitorId: number, remarks?: string) {
    await delay();
    const me = await currentUser();
    const who = me ? `${me.first_name} ${me.last_name}` : 'Resident';
    const v = await this.setVisitorState(
      visitorId,
      {
        approval_status: 'approved',
        status: 'approved',
        remarks,
        approved_by: me?.id,
        approved_by_name: who,
      },
      { title: 'Visitor approved', message: `Entry approved by ${who}.`, type: 'visitor_approved' }
    );
    return ok(v);
  }

  async denyVisitor(visitorId: number, remarks?: string) {
    await delay();
    const me = await currentUser();
    const who = me ? `${me.first_name} ${me.last_name}` : 'Resident';
    const v = await this.setVisitorState(
      visitorId,
      {
        approval_status: 'denied',
        status: 'denied',
        remarks,
        approved_by: me?.id,
        approved_by_name: who,
      },
      { title: 'Visitor denied', message: `Entry denied by ${who}.`, type: 'visitor_denied' }
    );
    return ok(v);
  }

  async markVisitorEntered(visitorId: number) {
    await delay();
    const v = await this.setVisitorState(visitorId, {
      status: 'entered',
      entry_time: new Date().toISOString(),
    });
    return ok(v);
  }

  async markVisitorExited(visitorId: number) {
    await delay();
    const v = await this.setVisitorState(visitorId, {
      status: 'exited',
      exit_time: new Date().toISOString(),
    });
    // Free up the linked pre-approved pass so it can be admitted again later.
    const db = await getDb();
    const pa = db.preApproved.find((p) => p.admitted_visit_id === Number(visitorId));
    if (pa) {
      pa.admitted = false;
      pa.admitted_visit_id = undefined;
      await persist();
    }
    return ok(v);
  }

  // ---- Pre-approved -------------------------------------------------
  async createPreApprovedVisitor(data: any) {
    await delay();
    const db = await getDb();
    const me = await currentUser();
    const validFrom = data.valid_from || new Date().toISOString();
    const validTo =
      data.valid_to || new Date(Date.now() + 86_400_000).toISOString();
    const days =
      Number(data.days) ||
      Math.max(
        1,
        Math.round(
          (+new Date(validTo) - +new Date(validFrom)) / 86_400_000
        )
      );
    const entry = {
      id: nextId(db),
      name: data.name || 'Guest',
      phone: data.phone || '',
      purpose: data.purpose || 'Visit',
      valid_from: validFrom,
      valid_to: validTo,
      days,
      flat: data.flat || me?.flat || '',
      resident_name: me ? `${me.first_name} ${me.last_name}` : '',
      society_id: data.society_id ? Number(data.society_id) : me?.society_id,
      created_by: me?.id ?? 0,
      status: 'active' as const,
    };
    db.preApproved.unshift(entry);
    db.notifications.unshift({
      id: nextId(db),
      title: 'Pre-approved visitor added',
      message: `${entry.name} for ${entry.flat} — valid ${days} day${
        days === 1 ? '' : 's'
      }.`,
      type: 'pre_approved',
      is_read: false,
      created_at: new Date().toISOString(),
      data: { preApprovedId: entry.id },
    });
    await persist();
    return ok(entry);
  }

  /** Recompute active/expired against the clock (leaves a cancelled pass alone). */
  private withLiveStatus<T extends { valid_to: string; status?: string }>(p: T) {
    if (p.status === 'cancelled') return { ...p, status: 'cancelled' as const };
    const status: 'active' | 'expired' =
      new Date() > new Date(p.valid_to) ? 'expired' : 'active';
    return { ...p, status };
  }

  async getPreApprovedVisitors() {
    await delay(140);
    const db = await getDb();
    const me = await currentUser();
    let list = db.preApproved.map((p) => this.withLiveStatus(p));
    if (me?.role === 'resident' || me?.role === 'staff') {
      // Residents see only their own, and a pass they removed is gone for them.
      list = list.filter((p) => p.created_by === me.id && p.status !== 'cancelled');
    } else if (me && this.isGuard(me) && me.society_id) {
      list = list.filter(
        (p) => p.society_id == null || p.society_id === me.society_id
      );
    }
    // Guards & admins keep cancelled passes for the record.
    const rank = (s: string) => (s === 'active' ? 0 : s === 'expired' ? 1 : 2);
    list.sort(
      (a, b) =>
        rank(a.status) - rank(b.status) ||
        +new Date(b.valid_from) - +new Date(a.valid_from)
    );
    return ok(list);
  }

  /** Resident removes a pre-approved pass ("visitor not coming"). It is kept as
   *  a cancelled record so guards can see why it disappeared. */
  async deletePreApproved(preApprovedId: number, reason?: string) {
    await delay();
    const db = await getDb();
    const p = db.preApproved.find((x) => x.id === Number(preApprovedId));
    if (!p) throw new ApiError(404, 'Pre-approved pass not found');
    const me = await currentUser();
    p.status = 'cancelled';
    p.cancelled_at = new Date().toISOString();
    p.cancelled_reason =
      (reason && reason.trim()) || 'Resident removed the pre-approved request';
    db.notifications.unshift({
      id: nextId(db),
      title: 'Pre-approved visitor removed',
      message: `${p.name} for ${p.flat}: ${p.cancelled_reason}`,
      type: 'pre_approved_cancelled',
      is_read: false,
      created_at: p.cancelled_at,
      data: { preApprovedId: p.id, by: me?.id },
    });
    await persist();
    return ok(this.withLiveStatus(p));
  }

  /** Guard logs entry for a resident's standing pre-approved visitor. */
  async admitPreApproved(preApprovedId: number) {
    await delay();
    const db = await getDb();
    const p = db.preApproved.find((x) => x.id === Number(preApprovedId));
    if (!p) throw new ApiError(404, 'Pre-approved pass not found');
    if (p.status === 'cancelled') {
      throw new ApiError(400, 'This pre-approved pass was removed by the resident.');
    }
    if (new Date() > new Date(p.valid_to)) {
      throw new ApiError(400, 'This pre-approved pass has expired.');
    }
    if (p.admitted) throw new ApiError(400, 'This visitor is already inside.');
    const me = await currentUser();
    const resident = db.users.find(
      (u) => u.flat === p.flat && (u.role === 'resident' || u.role === 'staff')
    );
    const now = new Date().toISOString();
    const visitor: MockVisitor = {
      id: nextId(db),
      name: p.name,
      visitor_name: p.name,
      phone: p.phone,
      purpose: p.purpose,
      type: 'guest',
      status: 'entered',
      approval_status: 'approved',
      flat: p.flat,
      resident_name: p.resident_name,
      resident_id: resident?.id,
      society_id: p.society_id ?? me?.society_id,
      society_name: db.societies.find((s) => s.id === (p.society_id ?? me?.society_id))
        ?.name,
      photo: null,
      requested_at: now,
      entry_time: now,
      exit_time: null,
      created_by: me?.id,
      created_by_name: me ? `${me.first_name} ${me.last_name}` : undefined,
      approved_by_name: 'Pre-approved pass',
    };
    db.visitors.unshift(visitor);
    p.admitted = true;
    p.admitted_visit_id = visitor.id;
    await persist();
    return ok(visitor);
  }

  // ---- QR passes --------------------------------------------------
  async createQRPass(data: any) {
    await delay();
    const db = await getDb();
    const me = await currentUser();
    const token = `SP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const pass = {
      token,
      visitor_name: data.visitor_name || data.name || 'Guest',
      phone: data.phone || '',
      purpose: data.purpose || 'Visit',
      flat: data.flat || me?.flat || '',
      valid_from: data.valid_from || new Date().toISOString(),
      valid_to:
        data.valid_to || new Date(Date.now() + 6 * 3600_000).toISOString(),
      society_id: data.society_id ? Number(data.society_id) : me?.society_id,
      created_by: me?.id ?? 0,
      created_at: new Date().toISOString(),
      used: false,
    };
    db.qrPasses.unshift(pass);
    await persist();
    return ok(pass);
  }

  async getQRPass(token: string) {
    await delay(120);
    const db = await getDb();
    const pass = db.qrPasses.find((p) => p.token === token);
    if (!pass) throw new ApiError(404, 'Pass not found');
    return ok(pass);
  }

  // ---- Notifications --------------------------------------------
  async getNotifications(limit = 20) {
    await delay(120);
    const db = await getDb();
    return ok(db.notifications.slice(0, limit));
  }

  async markNotificationRead(notificationId: number) {
    await delay(80);
    const db = await getDb();
    const idx = db.notifications.findIndex((n) => n.id === Number(notificationId));
    if (idx === -1) throw new ApiError(404, 'Notification not found');
    db.notifications[idx].is_read = true;
    await persist();
    return ok(db.notifications[idx]);
  }

  // ---- Calls (stubbed) ----------------------------------------
  async initiateCall(receiverId: number, callType: 'voice' | 'video') {
    await delay();
    return ok({
      id: Math.floor(Math.random() * 100000),
      receiver: receiverId,
      call_type: callType,
      status: 'ringing',
      started_at: new Date().toISOString(),
    });
  }

  async endCall(callId: number, durationSeconds: number) {
    await delay();
    return ok({ id: callId, status: 'ended', duration_seconds: durationSeconds });
  }

  // ---- Admin CRUD ------------------------------------------
  private assertAdmin(me: MockUser | null) {
    if (!me || (me.role !== 'society_admin' && me.role !== 'super_admin')) {
      throw new ApiError(403, 'Admin access required.');
    }
  }

  async adminCreateUser(data: any) {
    await delay();
    const db = await getDb();
    const admin = await currentUser();
    this.assertAdmin(admin);
    const phone = String(data.phone || '').replace(/\D/g, '');
    if (phone.length !== 10) throw new ApiError(400, 'Enter a 10-digit phone number.');
    if (db.users.some((u) => u.phone === phone)) {
      throw new ApiError(400, 'That phone number is already registered.');
    }
    const role: MockUser['role'] =
      data.role === 'guard'
        ? 'guard'
        : data.role === 'society_admin'
        ? 'society_admin'
        : 'resident';
    const user: MockUser = {
      id: nextId(db),
      phone,
      password: data.password || 'password',
      first_name: (data.first_name || '').trim(),
      last_name: (data.last_name || '').trim(),
      email: data.email || `${phone}@societypass.app`,
      role,
      is_phone_verified: true,
      society_id: data.society_id ? Number(data.society_id) : admin?.society_id,
      ...(data.flat ? { flat: String(data.flat).trim().toUpperCase() } : {}),
      ...(role === 'guard'
        ? {
            gate: data.gate || 'Main Gate',
            shift: data.duty_shift === 'night' ? 'Night Shift' : 'Day Shift',
            on_duty: data.on_duty === true || data.on_duty === 'true',
            duty_shift: data.duty_shift === 'night' ? 'night' : 'day',
          }
        : {}),
    };
    db.users.push(user);
    await persist();
    return ok(publicUser(user));
  }

  async adminUpdateUser(id: number, patch: any) {
    await delay();
    const db = await getDb();
    this.assertAdmin(await currentUser());
    const idx = db.users.findIndex((u) => u.id === Number(id));
    if (idx === -1) throw new ApiError(404, 'User not found.');
    const next = { ...patch };
    if (next.phone !== undefined) {
      next.phone = String(next.phone).replace(/\D/g, '');
      if (next.phone.length !== 10) throw new ApiError(400, 'Enter a 10-digit phone number.');
      if (db.users.some((u) => u.phone === next.phone && u.id !== Number(id))) {
        throw new ApiError(400, 'That phone number is already registered.');
      }
    }
    if (next.flat !== undefined) next.flat = String(next.flat).trim().toUpperCase();
    if (next.duty_shift) {
      next.duty_shift = next.duty_shift === 'night' ? 'night' : 'day';
      next.shift = next.duty_shift === 'night' ? 'Night Shift' : 'Day Shift';
    }
    delete next.id;
    delete next.role; // role changes are out of scope
    db.users[idx] = { ...db.users[idx], ...next };
    await persist();
    return ok(publicUser(db.users[idx]));
  }

  async adminDeleteUser(id: number) {
    await delay();
    const db = await getDb();
    const me = await currentUser();
    this.assertAdmin(me);
    const idx = db.users.findIndex((u) => u.id === Number(id));
    if (idx === -1) throw new ApiError(404, 'User not found.');
    const target = db.users[idx];
    if (target.id === me!.id) throw new ApiError(400, 'You cannot delete your own account.');
    if (
      (target.role === 'society_admin' || target.role === 'super_admin') &&
      db.users.filter((u) => u.role === 'society_admin' || u.role === 'super_admin').length <= 1
    ) {
      throw new ApiError(400, 'Cannot delete the last admin account.');
    }
    db.users.splice(idx, 1);
    await persist();
    return ok({ detail: 'User deleted', id: Number(id) });
  }

  async adminCreateVisitor(data: any) {
    await delay();
    const db = await getDb();
    const admin = await currentUser();
    this.assertAdmin(admin);
    const now = new Date().toISOString();
    const resident =
      (data.resident_id && db.users.find((u) => u.id === Number(data.resident_id))) ||
      db.users.find(
        (u) => (u.role === 'resident' || u.role === 'staff') && u.flat === data.flat
      );
    const name = data.name || 'Visitor';
    const approvalStatus =
      data.approval_status || (data.status === 'approved' || data.status === 'entered' ? 'approved' : 'pending');
    const visitor: MockVisitor = {
      id: nextId(db),
      name,
      visitor_name: name,
      phone: data.phone || '',
      purpose: data.purpose || 'Visit',
      type: data.type || 'guest',
      status: data.status || 'waiting',
      approval_status: approvalStatus,
      flat: (data.flat || resident?.flat || '').toUpperCase(),
      resident_name: resident
        ? `${resident.first_name} ${resident.last_name}`
        : data.resident_name || '',
      resident_phone: resident?.phone,
      resident_id: resident?.id,
      society_id: data.society_id
        ? Number(data.society_id)
        : resident?.society_id ?? admin?.society_id,
      society_name: db.societies.find(
        (s) =>
          s.id ===
          (data.society_id
            ? Number(data.society_id)
            : resident?.society_id ?? admin?.society_id)
      )?.name,
      vehicle_number: data.vehicle_number || undefined,
      photo: null,
      requested_at: data.requested_at || now,
      entry_time: data.status === 'entered' ? now : null,
      exit_time: data.status === 'exited' ? now : null,
    };
    db.visitors.unshift(visitor);
    await persist();
    return ok(visitor);
  }

  async adminUpdateVisitor(id: number, patch: any) {
    await delay();
    const db = await getDb();
    this.assertAdmin(await currentUser());
    const idx = db.visitors.findIndex((v) => v.id === Number(id));
    if (idx === -1) throw new ApiError(404, 'Visitor not found.');
    const next = { ...patch };
    delete next.id;
    if (next.flat) next.flat = String(next.flat).toUpperCase();
    db.visitors[idx] = { ...db.visitors[idx], ...next };
    if (next.name) db.visitors[idx].visitor_name = next.name;
    await persist();
    return ok(db.visitors[idx]);
  }

  async adminDeleteVisitor(id: number) {
    await delay();
    const db = await getDb();
    this.assertAdmin(await currentUser());
    const idx = db.visitors.findIndex((v) => v.id === Number(id));
    if (idx === -1) throw new ApiError(404, 'Visitor not found.');
    db.visitors.splice(idx, 1);
    const pa = db.preApproved.find((p) => p.admitted_visit_id === Number(id));
    if (pa) {
      pa.admitted = false;
      pa.admitted_visit_id = undefined;
    }
    await persist();
    return ok({ detail: 'Visitor deleted', id: Number(id) });
  }

  // ---- Societies / buildings -------------------------------
  private isResident = (u: MockUser) => u.role === 'resident' || u.role === 'staff';
  private isGuard = (u: MockUser) =>
    u.role === 'guard' || u.role === 'security_supervisor';

  /** Flats derived from residents with a house number, optionally one society. */
  private flatList(db: MockDB, societyId?: number) {
    return db.users
      .filter(
        (u) =>
          this.isResident(u) &&
          u.flat &&
          (societyId == null || u.society_id === societyId)
      )
      .map((u) => ({
        id: u.id,
        number: u.flat as string,
        tower: String(u.flat).split('-')[0].replace(/[^A-Za-z]/g, '') || '—',
        resident_name: `${u.first_name} ${u.last_name}`.trim(),
        resident_phone: u.phone,
        members: 1,
      }))
      .sort((a, b) => a.number.localeCompare(b.number));
  }

  private societyCard(db: MockDB, s: MockSociety) {
    const flats = this.flatList(db, s.id);
    return {
      ...s,
      total_flats: flats.length,
      total_residents: db.users.filter(
        (u) => this.isResident(u) && u.society_id === s.id
      ).length,
      total_guards: db.users.filter(
        (u) => this.isGuard(u) && u.society_id === s.id
      ).length,
      towers: [...new Set(flats.map((f) => f.tower))]
        .filter((t) => t && t !== '—')
        .sort(),
    };
  }

  /** Guards & residents get every society (to pick one); an admin gets only the
   *  societies they created. */
  async getSocieties() {
    await delay(120);
    const db = await getDb();
    const me = await currentUser();
    const isAdmin = me?.role === 'society_admin' || me?.role === 'super_admin';
    return ok(
      db.societies
        .filter((s) => !isAdmin || s.created_by === me!.id)
        .map((s) => this.societyCard(db, s))
    );
  }

  async getSociety(societyId: number) {
    await delay(120);
    const db = await getDb();
    const me = await currentUser();
    const id = Number(societyId) || me?.society_id || db.societies[0]?.id;
    const s = db.societies.find((x) => x.id === id) || db.societies[0];
    if (!s) throw new ApiError(404, 'No society found.');
    return ok(this.societyCard(db, s));
  }

  async getSocietyFlats(societyId: number) {
    await delay(140);
    const db = await getDb();
    const me = await currentUser();
    const id = Number(societyId) || me?.society_id || undefined;
    return ok(this.flatList(db, id));
  }

  async searchFlat(societyId: number, query: string) {
    await delay(120);
    const db = await getDb();
    const me = await currentUser();
    const id = Number(societyId) || me?.society_id || undefined;
    const q = (query || '').toLowerCase();
    return ok(
      this.flatList(db, id).filter(
        (f) =>
          f.number.toLowerCase().includes(q) ||
          f.resident_name.toLowerCase().includes(q)
      )
    );
  }

  /** Any signed-in user picks which society/building they operate in (sticky). */
  async setMySociety(societyId: number | null) {
    await delay(120);
    const db = await getDb();
    const me = await currentUser();
    if (!me) throw new ApiError(401, 'Not authenticated');
    if (societyId != null && !db.societies.find((s) => s.id === Number(societyId))) {
      throw new ApiError(404, 'Society not found.');
    }
    const idx = db.users.findIndex((u) => u.id === me.id);
    db.users[idx].society_id = societyId == null ? undefined : Number(societyId);
    await persist();
    return ok(publicUser(db.users[idx]));
  }

  async adminCreateSociety(data: any) {
    await delay();
    const db = await getDb();
    const me = await currentUser();
    this.assertAdmin(me);
    const s: MockSociety = {
      id: nextId(db),
      name: String(data.name || '').trim() || 'Untitled',
      type: data.type === 'building' ? 'building' : 'society',
      city: String(data.city || '').trim(),
      address: String(data.address || '').trim(),
      pincode: String(data.pincode || '').trim(),
      created_by: me!.id,
      created_at: new Date().toISOString(),
    };
    db.societies.push(s);
    // Stick the first society they create to their own account.
    const meIdx = db.users.findIndex((u) => u.id === me!.id);
    if (db.users[meIdx].society_id == null) db.users[meIdx].society_id = s.id;
    await persist();
    return ok(this.societyCard(db, s));
  }

  async adminUpdateSociety(id: number, patch: any) {
    await delay();
    const db = await getDb();
    this.assertAdmin(await currentUser());
    const idx = db.societies.findIndex((s) => s.id === Number(id));
    if (idx === -1) throw new ApiError(404, 'Society not found.');
    const next = { ...patch };
    delete next.id;
    if (next.type) next.type = next.type === 'building' ? 'building' : 'society';
    db.societies[idx] = { ...db.societies[idx], ...next };
    await persist();
    return ok(this.societyCard(db, db.societies[idx]));
  }

  async adminDeleteSociety(id: number) {
    await delay();
    const db = await getDb();
    this.assertAdmin(await currentUser());
    const sid = Number(id);
    const idx = db.societies.findIndex((s) => s.id === sid);
    if (idx === -1) throw new ApiError(404, 'Society not found.');
    const members = db.users.filter((u) => u.society_id === sid).length;
    if (members > 0) {
      throw new ApiError(
        400,
        `Reassign or remove its ${members} member(s) before deleting this society.`
      );
    }
    db.societies.splice(idx, 1);
    await persist();
    return ok({ detail: 'Society deleted', id: sid });
  }

  // ---- Guard -------------------------------------------------
  async getGuardStats() {
    await delay(120);
    const db = await getDb();
    const me = await currentUser();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const inScope = (v: MockVisitor) =>
      !me?.society_id || v.society_id == null || v.society_id === me.society_id;
    const list = db.visitors.filter(inScope);
    return ok({
      todayVisitors: list.filter((v) => new Date(v.requested_at) >= startOfDay).length,
      currentlyInside: list.filter((v) => v.status === 'entered').length,
      pendingApprovals: list.filter(
        (v) => v.status === 'waiting' && v.approval_status === 'pending'
      ).length,
    });
  }

  async recordGuardCheckIn() {
    return this.setMyDuty(true);
  }

  async recordGuardCheckOut() {
    return this.setMyDuty(false);
  }

  // ---- Duty & guard directory ------------------------------------
  private guardCard(u: MockUser) {
    const dutyShift: 'day' | 'night' = u.duty_shift === 'night' ? 'night' : 'day';
    const shiftLabel = u.on_duty
      ? dutyShift === 'night'
        ? 'Night Shift'
        : 'Day Shift'
      : u.shift || 'Off shift';
    return {
      id: u.id,
      name: `${u.first_name} ${u.last_name}`.trim(),
      first_name: u.first_name,
      last_name: u.last_name,
      phone: u.phone,
      gate: u.gate || 'Main Gate',
      shift: shiftLabel,
      duty_shift: dutyShift,
      on_duty: !!u.on_duty,
    };
  }

  async getGuards() {
    await delay(140);
    const db = await getDb();
    const me = await currentUser();
    return ok(
      db.users
        .filter(
          (u) =>
            this.isGuard(u) && (!me?.society_id || u.society_id === me.society_id)
        )
        .map((u) => ({ ...this.guardCard(u), society_id: u.society_id }))
    );
  }

  /** Guards currently on duty — visible to residents and admins in the society. */
  async getOnDutyGuards() {
    await delay(120);
    const db = await getDb();
    const me = await currentUser();
    return ok(
      db.users
        .filter(
          (u) =>
            this.isGuard(u) &&
            u.on_duty &&
            (!me?.society_id || u.society_id === me.society_id)
        )
        .map((u) => this.guardCard(u))
    );
  }

  /** The signed-in guard sets their own duty status and day/night shift. */
  async setMyDuty(onDuty: boolean, dutyShift?: 'day' | 'night') {
    await delay(150);
    const db = await getDb();
    const me = await currentUser();
    if (!me) throw new ApiError(401, 'Not authenticated');
    const idx = db.users.findIndex((u) => u.id === me.id);
    db.users[idx].on_duty = onDuty;
    if (dutyShift) db.users[idx].duty_shift = dutyShift;
    await persist();
    return ok(this.guardCard(db.users[idx]));
  }

  /** Admin toggles a specific guard's duty status. */
  async setGuardDuty(guardId: number, onDuty: boolean) {
    await delay(150);
    const db = await getDb();
    const idx = db.users.findIndex((u) => u.id === Number(guardId));
    if (idx === -1) throw new ApiError(404, 'Guard not found');
    db.users[idx].on_duty = onDuty;
    await persist();
    return ok(this.guardCard(db.users[idx]));
  }

  /** The signed-in guard's own record: requests they opened or decided. */
  async getMyGuardRecords() {
    await delay(160);
    const db = await getDb();
    const me = await currentUser();
    if (!me) throw new ApiError(401, 'Not authenticated');
    const mine = db.visitors
      .filter((v) => v.created_by === me.id || v.approved_by === me.id)
      .map((v) => ({
        ...v,
        my_role:
          v.approved_by === me.id
            ? v.approval_status === 'denied'
              ? 'denied'
              : 'approved'
            : 'created',
      }));
    mine.sort((a, b) => +new Date(b.requested_at) - +new Date(a.requested_at));
    return ok(mine);
  }

  // ---- Misc ------------------------------------------------
  async resetData() {
    await resetDb();
    return ok({ detail: 'Mock data reset' });
  }

  getErrorMessage(error: any): string {
    if (error?.response?.data?.detail) return error.response.data.detail;
    if (error?.response?.data?.error) return error.response.data.error;
    if (error?.message) return error.message;
    return 'An error occurred';
  }
}

export default new MockAPIClient();
