import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import visitorReducer from './slices/visitorSlice';
import notificationReducer from './slices/notificationSlice';
import guiReducer from './slices/guiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    visitor: visitorReducer,
    notification: notificationReducer,
    gui: guiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export default store;
