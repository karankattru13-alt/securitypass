import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mockClient from './mock/mockClient';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:8000/api';

/** Default: run against the built-in mock backend so the app works with no server. */
const USE_MOCK = (process.env.EXPO_PUBLIC_USE_MOCK ?? 'true') !== 'false';

class APIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          await this.refreshToken();
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) return;

      const response = await this.client.post('/auth/token/refresh/', {
        refresh: refreshToken,
      });

      await AsyncStorage.setItem('access_token', response.data.access);
      this.token = response.data.access;
    } catch (error) {
      // Refresh failed, user needs to login again
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
    }
  }

  // Auth endpoints
  async requestOTP(phone: string) {
    return this.client.post('/users/auth/request_otp/', { phone });
  }

  async verifyOTP(
    phone: string,
    code: string,
    firstName?: string,
    lastName?: string,
    role?: string
  ) {
    return this.client.post('/users/auth/verify_otp/', {
      phone,
      code,
      first_name: firstName,
      last_name: lastName,
      role,
    });
  }

  async login(phone: string, password: string) {
    return this.client.post('/users/auth/login/', { phone, password });
  }

  // User endpoints
  async getMe() {
    return this.client.get('/users/me/');
  }

  async updateProfile(data: any) {
    return this.client.post('/users/update_profile/', data);
  }

  async getResidents() {
    return this.client.get('/users/residents/');
  }

  // Visitor endpoints
  async createVisitor(visitorData: any) {
    return this.client.post('/visitors/', visitorData);
  }

  async getVisitors(filters?: any) {
    return this.client.get('/visitors/', { params: filters });
  }

  async getVisitor(id: number) {
    return this.client.get(`/visitors/${id}/`);
  }

  async updateVisitor(id: number, data: any) {
    return this.client.patch(`/visitors/${id}/`, data);
  }

  async uploadVisitorPhoto(visitorId: number, photoUri: string, photoType: string) {
    const formData = new FormData();
    formData.append('visitor', String(visitorId));
    formData.append('photo_type', photoType);

    const response = await fetch(photoUri);
    const blob = await response.blob();
    formData.append('photo', blob, 'photo.jpg');

    return this.client.post('/visitors/photos/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async approveVisitor(visitorId: number, remarks?: string) {
    return this.client.post(`/visitors/${visitorId}/approve/`, { remarks });
  }

  async denyVisitor(visitorId: number, remarks?: string) {
    return this.client.post(`/visitors/${visitorId}/deny/`, { remarks });
  }

  async markVisitorEntered(visitorId: number) {
    return this.client.post(`/visitors/${visitorId}/mark_entered/`);
  }

  async markVisitorExited(visitorId: number) {
    return this.client.post(`/visitors/${visitorId}/mark_exited/`);
  }

  // Pre-approved visitors
  async createPreApprovedVisitor(data: any) {
    return this.client.post('/visitors/pre-approved/', data);
  }

  async getPreApprovedVisitors() {
    return this.client.get('/visitors/pre-approved/');
  }

  async admitPreApproved(preApprovedId: number) {
    return this.client.post(`/visitors/pre-approved/${preApprovedId}/admit/`);
  }

  // QR Passes
  async createQRPass(data: any) {
    return this.client.post('/visitors/qr-passes/', data);
  }

  async getQRPass(token: string) {
    return this.client.get(`/visitors/qr-passes/${token}/`);
  }

  // Notifications
  async getNotifications(limit = 20) {
    return this.client.get('/notifications/', { params: { limit } });
  }

  async markNotificationRead(notificationId: number) {
    return this.client.post(`/notifications/${notificationId}/mark_read/`);
  }

  // Calls
  async initiateCall(receiverId: number, callType: 'voice' | 'video') {
    return this.client.post('/calls/', {
      receiver: receiverId,
      call_type: callType,
    });
  }

  async endCall(callId: number, durationSeconds: number) {
    return this.client.patch(`/calls/${callId}/`, {
      status: 'ended',
      duration_seconds: durationSeconds,
    });
  }

  // Society endpoints
  async getSociety(societyId: number) {
    return this.client.get(`/societies/${societyId}/`);
  }

  async getSocietyFlats(societyId: number) {
    return this.client.get(`/societies/${societyId}/flats/`);
  }

  // Flat endpoints
  async searchFlat(societyId: number, query: string) {
    return this.client.get(`/societies/${societyId}/search-flats/`, {
      params: { q: query },
    });
  }

  // Guard endpoints
  async getGuardStats() {
    return this.client.get('/guards/stats/');
  }

  async recordGuardCheckIn() {
    return this.client.post('/guards/check-in/');
  }

  async recordGuardCheckOut() {
    return this.client.post('/guards/check-out/');
  }

  async getGuards() {
    return this.client.get('/guards/');
  }

  async getOnDutyGuards() {
    return this.client.get('/guards/on-duty/');
  }

  async setMyDuty(onDuty: boolean, dutyShift?: 'day' | 'night') {
    return this.client.post('/guards/duty/', {
      on_duty: onDuty,
      duty_shift: dutyShift,
    });
  }

  async setGuardDuty(guardId: number, onDuty: boolean) {
    return this.client.post(`/guards/${guardId}/duty/`, { on_duty: onDuty });
  }

  async getMyGuardRecords() {
    return this.client.get('/guards/my-records/');
  }

  // Generic error handler
  getErrorMessage(error: any): string {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'An error occurred';
  }
}

const apiClient = USE_MOCK
  ? (mockClient as unknown as APIClient)
  : new APIClient();

export default apiClient;
