import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export interface User {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'super_admin' | 'society_admin' | 'security_supervisor' | 'guard' | 'resident' | 'staff';
  profile_photo?: string;
  is_phone_verified: boolean;
}

interface AuthState {
  user: User | null;
  tokens: {
    access: string | null;
    refresh: string | null;
  };
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  tokens: {
    access: null,
    refresh: null,
  },
  loading: false,
  error: null,
};

export const requestOTP = createAsyncThunk(
  'auth/requestOTP',
  async (phone: string, { rejectWithValue }) => {
    try {
      const response = await api.requestOTP(phone);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(api.getErrorMessage(error));
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (
    data: { phone: string; code: string; firstName?: string; lastName?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.verifyOTP(
        data.phone,
        data.code,
        data.firstName,
        data.lastName
      );

      await AsyncStorage.setItem('access_token', response.data.access);
      await AsyncStorage.setItem('refresh_token', response.data.refresh);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(api.getErrorMessage(error));
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (
    data: { phone: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.login(data.phone, data.password);

      await AsyncStorage.setItem('access_token', response.data.access);
      await AsyncStorage.setItem('refresh_token', response.data.refresh);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(api.getErrorMessage(error));
    }
  }
);

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getMe();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(api.getErrorMessage(error));
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      return null;
    } catch (error: any) {
      return rejectWithValue(api.getErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Request OTP
      .addCase(requestOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestOTP.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(requestOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.tokens.access = action.payload.access;
        state.tokens.refresh = action.payload.refresh;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.tokens.access = action.payload.access;
        state.tokens.refresh = action.payload.refresh;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Me
      .addCase(getMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.tokens.access = null;
        state.tokens.refresh = null;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
