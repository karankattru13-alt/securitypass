import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, tokens, loading, error } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          await dispatch(getMe()).unwrap();
        }
      } catch (err) {
        // Auth failed, user needs to login
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  return {
    user,
    tokens,
    loading,
    error,
    isLoading,
    isAuthenticated: !!user && !!tokens.access,
  };
};
