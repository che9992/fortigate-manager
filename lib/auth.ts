import { create } from 'zustand';

// 인증 정보
const VALID_CREDENTIALS = {
  email: 'che9992@edusherpa.kr',
  password: '!05240425aa',
};

const AUTH_STORAGE_KEY = 'fortigate_auth';

// localStorage 헬퍼
const getAuthFromStorage = () => {
  if (typeof window === 'undefined') return { isAuthenticated: false, user: null };

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load auth state:', error);
  }

  return { isAuthenticated: false, user: null };
};

const saveAuthToStorage = (isAuthenticated: boolean, user: string | null) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated, user }));
  } catch (error) {
    console.error('Failed to save auth state:', error);
  }
};

interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  loadAuth: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  loadAuth: () => {
    const auth = getAuthFromStorage();
    set(auth);
  },

  login: (email: string, password: string) => {
    // 이메일과 비밀번호 검증
    if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
      set({ isAuthenticated: true, user: email });
      saveAuthToStorage(true, email);
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false, user: null });
    saveAuthToStorage(false, null);
  },
}));
