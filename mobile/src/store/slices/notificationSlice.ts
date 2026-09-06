import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (limit = 20, { rejectWithValue }) => {
    try {
      const response = await api.getNotifications(limit);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(api.getErrorMessage(error));
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notification/markRead',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      const response = await api.markNotificationRead(notificationId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(api.getErrorMessage(error));
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.is_read) {
        state.unreadCount += 1;
      }
    },
    clearAll: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n: Notification) => !n.is_read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notificationIndex = state.notifications.findIndex((n) => n.id === action.payload.id);
        if (notificationIndex !== -1) {
          state.notifications[notificationIndex].is_read = true;
          if (state.unreadCount > 0) {
            state.unreadCount -= 1;
          }
        }
      });
  },
});

export const { addNotification, clearAll } = notificationSlice.actions;
export default notificationSlice.reducer;
