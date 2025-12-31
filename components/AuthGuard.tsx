'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { LoginForm } from './LoginForm';
import { LogOut, User } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout, loadAuth } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadAuth(); // localStorage에서 인증 상태 로드
  }, [loadAuth]);

  // 클라이언트에서만 렌더링 (hydration 오류 방지)
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <>
      {/* Logout Button in Navigation */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 px-4 py-2 flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">{user}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>
      {children}
    </>
  );
}
