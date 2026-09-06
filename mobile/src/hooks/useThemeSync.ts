import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setTheme } from '../store/slices/guiSlice';

/**
 * Keeps the active UI theme tied to the *signed-in user's* saved preference.
 *
 * The theme flag lives in the (non-persisted) `gui` slice, but the preference
 * itself is stored per-user (mock `user.theme`). Whenever the user changes
 * (login / logout / account switch) we resync so one account's dark-mode choice
 * never leaks into another's session.
 */
export const useThemeSync = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector((s: RootState) => s.auth.user?.id ?? null);
  const userTheme = useSelector((s: RootState) => s.auth.user?.theme);

  useEffect(() => {
    dispatch(setTheme(userTheme === 'dark' ? 'dark' : 'light'));
    // Only resync on identity change — in-session toggles update `gui.theme`
    // directly and must not be clobbered here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
};
