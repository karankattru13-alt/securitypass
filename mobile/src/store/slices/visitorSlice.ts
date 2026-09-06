import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Visitor {
  id: number;
  name: string;
  phone: string;
  purpose: string;
  status: string;
  vehicle_number?: string;
  entry_time?: string;
  exit_time?: string;
}

interface VisitorState {
  visitors: Visitor[];
  currentVisitor: Visitor | null;
  loading: boolean;
  error: string | null;
}

const initialState: VisitorState = {
  visitors: [],
  currentVisitor: null,
  loading: false,
  error: null,
};

export const fetchVisitors = createAsyncThunk(
  'visitor/fetchVisitors',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const response = await api.getVisitors(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(api.getErrorMessage(error));
    }
  }
);

export const fetchVisitor = createAsyncThunk(
  'visitor/fetchVisitor',
  async (visitorId: number, { rejectWithValue }) => {
    try {
      const response = await api.getVisitor(visitorId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(api.getErrorMessage(error));
    }
  }
);

export const createVisitor = createAsyncThunk(
  'visitor/createVisitor',
  async (visitorData: any, { rejectWithValue }) => {
    try {
      const response = await api.createVisitor(visitorData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(api.getErrorMessage(error));
    }
  }
);

const visitorSlice = createSlice({
  name: 'visitor',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisitors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisitors.fulfilled, (state, action) => {
        state.loading = false;
        state.visitors = action.payload;
      })
      .addCase(fetchVisitors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchVisitor.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVisitor.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVisitor = action.payload;
      })
      .addCase(fetchVisitor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createVisitor.pending, (state) => {
        state.loading = true;
      })
      .addCase(createVisitor.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVisitor = action.payload;
        state.visitors.unshift(action.payload);
      })
      .addCase(createVisitor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = visitorSlice.actions;
export default visitorSlice.reducer;
