'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Server, Home, Shield, Users, FileText, Settings, Bug, Globe, Terminal } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: '대시보드', icon: Home },
    { href: '/addresses', label: 'Address 관리', icon: Users },
    { href: '/policies', label: 'Policy 관리', icon: Shield },
    { href: '/domain-analyzer', label: '도메인 분석', icon: Globe },
    { href: '/cli', label: 'CLI 실행', icon: Terminal },
    { href: '/logs', label: '감사 로그', icon: FileText },
    { href: '/servers', label: '서버 설정', icon: Settings },
    { href: '/debug', label: '디버그', icon: Bug },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Server className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              FortiGate Manager
            </span>
          </div>

          <div className="flex space-x-1">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
