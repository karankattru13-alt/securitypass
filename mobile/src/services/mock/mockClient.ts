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
      const newRole: MockUser['role'] = role === 'guard' ? 'guard' : 'resident';
      user = {
        id: nextId(db),
        phone,
        password: 'password',
        first_name: firstName || 'New',
        last_name: lastName || (newRole === 'guard' ? 'Guard' : 'Resident'),
        email: `${phone}@demo.in`,
        role: newRole,
        is_phone_verified: true,
        ...(newRole === 'guard' ? { gate: 'Main Gate', shift: 'Morning Shift' } : {}),
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
      resident_id: targetResident?.id,
      vehicle_number: visitorData.vehicle_number || undefined,
      photo: visitorData.photo || null,
      requested_at: now,
      entry_time: null,
      exit_time: null,
      created_by: me?.id,
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
    return ok(
      db.users
        .filter((u) => u.role === 'resident' || u.role === 'staff')
        .map((u) => ({
          id: u.id,
          name: `${u.first_name} ${u.last_name}`.trim(),
          first_name: u.first_name,
          last_name: u.last_name,
          phone: u.phone,
          email: u.email,
          flat: u.flat || '',
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
    const v = await this.setVisitorState(
      visitorId,
      { approval_status: 'approved', status: 'approved', remarks },
      { title: 'Visitor approved', message: 'Entry approved by resident.', type: 'visitor_approved' }
    );
    return ok(v);
  }

  async denyVisitor(visitorId: number, remarks?: string) {
    await delay();
    const v = await this.setVisitorState(
      visitorId,
      { approval_status: 'denied', status: 'denied', remarks },
      { title: 'Visitor denied', message: 'Entry denied by resident.', type: 'visitor_denied' }
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
    return ok(v);
  }

  // ---- Pre-approved -------------------------------------------------
  async createPreApprovedVisitor(data: any) {
    await delay();
    const db = await getDb();
    const me = await currentUser();
    const entry = {
      id: nextId(db),
      name: data.name || 'Guest',
      phone: data.phone || '',
      purpose: data.purpose || 'Visit',
      valid_from: data.valid_from || new Date().toISOString(),
      valid_to:
        data.valid_to || new Date(Date.now() + 86_400_000).toISOString(),
      flat: data.flat || me?.flat || '',
      created_by: me?.id ?? 0,
      status: 'active' as const,
    };
    db.preApproved.unshift(entry);
    await persist();
    return ok(entry);
  }

  async getPreApprovedVisitors() {
    await delay(140);
    const db = await getDb();
    const me = await currentUser();
    let list = [...db.preApproved];
    if (me?.role === 'resident') list = list.filter((p) => p.created_by === me.id);
    return ok(list);
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

  // ---- Society / flats ---------------------------------------
  async getSociety(_societyId: number) {
    await delay(140);
    const db = await getDb();
    return ok(db.society);
  }

  async getSocietyFlats(_societyId: number) {
    await delay(160);
    const db = await getDb();
    return ok(db.flats);
  }

  async searchFlat(_societyId: number, query: string) {
    await delay(120);
    const db = await getDb();
    const q = (query || '').toLowerCase();
    return ok(
      db.flats.filter(
        (f) =>
          f.number.toLowerCase().includes(q) ||
          f.resident_name.toLowerCase().includes(q)
      )
    );
  }

  // ---- Guard -------------------------------------------------
  async getGuardStats() {
    await delay(120);
    const db = await getDb();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayVisitors = db.visitors.filter(
      (v) => new Date(v.requested_at) >= startOfDay
    ).length;
    const currentlyInside = db.visitors.filter((v) => v.status === 'entered').length;
    const pendingApprovals = db.visitors.filter(
      (v) => v.status === 'waiting' && v.approval_status === 'pending'
    ).length;
    return ok({ todayVisitors, currentlyInside, pendingApprovals });
  }

  async recordGuardCheckIn() {
    await delay();
    return ok({ detail: 'Checked in', at: new Date().toISOString() });
  }

  async recordGuardCheckOut() {
    await delay();
    return ok({ detail: 'Checked out', at: new Date().toISOString() });
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
