import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchNotifications } from '../store/slices/notificationSlice';

/**
 * Keeps the notification list fresh while a user is signed in.
 *
 * The original implementation wired up Expo push + a socket.io connection to a
 * Django/Channels backend. In mock mode (and on web, where Expo push is not
 * available) we simply poll the API every 30s. Swap this out for the realtime
 * transport when a backend is available.
 */
export const useNotifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user) return;

    dispatch(fetchNotifications(20));
    const interval = setInterval(() => {
      dispatch(fetchNotifications(20));
    }, 30_000);

    return () => clearInterval(interval);
  }, [user, dispatch]);

  return { socket: null };
};

/** Kept for API compatibility with the previous socket-based implementation. */
export const sendNotification = (_userId: number, _notification: any) => {
  // no-op in mock mode
};
