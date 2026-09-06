import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Notifications from 'expo-notifications';
import { io, Socket } from 'socket.io-client';
import { RootState } from '../store';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

let socket: Socket | null = null;

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { user, tokens } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user || !tokens.access) return;

    // Register for push notifications
    const setupNotifications = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Notification permissions not granted');
          return;
        }

        const token = await Notifications.getExpoPushTokenAsync();
        console.log('Push token:', token);

        // Connect to WebSocket for real-time notifications
        socket = io(SOCKET_URL, {
          auth: {
            token: tokens.access,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
          console.log('WebSocket connected');
          socket?.emit('join_notifications', { user_id: user.id });
        });

        socket.on('notification', (data) => {
          handleSocketNotification(data);
        });

        socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
        });

        // Handle notification responses
        const subscription = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            console.log('Notification response:', response);
            // Handle notification tap
          }
        );

        return () => {
          subscription.remove();
        };
      } catch (error) {
        console.error('Notification setup error:', error);
      }
    };

    setupNotifications();

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [user, tokens, dispatch]);

  return { socket };
};

const handleSocketNotification = async (data: any) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: data.title,
      body: data.message,
      data: data.data || {},
    },
    trigger: { seconds: 1 },
  });
};

export const sendNotification = (userId: number, notification: any) => {
  if (socket) {
    socket.emit('send_notification', {
      user_id: userId,
      ...notification,
    });
  }
};
