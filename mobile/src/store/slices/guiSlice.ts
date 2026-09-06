import { createSlice } from '@reduxjs/toolkit';

interface GUIState {
  theme: 'light' | 'dark';
  language: string;
  isOnline: boolean;
  sidebarOpen: boolean;
}

const initialState: GUIState = {
  theme: 'light',
  language: 'en',
  isOnline: true,
  sidebarOpen: false,
};

const guiSlice = createSlice({
  name: 'gui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { setTheme, setLanguage, setOnlineStatus, toggleSidebar } = guiSlice.actions;
export default guiSlice.reducer;
