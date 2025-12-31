'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { CheckSquare, Square } from 'lucide-react';

export function ServerSelector() {
  const { servers, selectedServers, toggleServerSelection, selectAllServers, clearServerSelection, loadServers } = useStore();

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  if (servers.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          서버가 등록되어 있지 않습니다.
          <a href="/servers" className="underline ml-1 font-medium">
            서버 설정
          </a>
          페이지에서 FortiGate 서버를 추가하세요.
        </p>
      </div>
    );
  }

  const allSelected = servers.length === selectedServers.length;
  const someSelected = selectedServers.length > 0 && !allSelected;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">적용 대상 서버</h3>
        <div className="flex space-x-2">
          <button
            onClick={selectAllServers}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            전체 선택
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={clearServerSelection}
            className="text-xs text-gray-600 hover:text-gray-700 font-medium"
          >
            선택 해제
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {servers.map((server) => {
          const isSelected = selectedServers.includes(server.id);
          return (
            <button
              key={server.id}
              onClick={() => toggleServerSelection(server.id)}
              disabled={!server.enabled}
              className={`
                w-full flex items-center justify-between p-3 rounded-md border transition-all
                ${isSelected
                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
                }
                ${!server.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center space-x-3">
                {isSelected ? (
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                ) : (
                  <Square className="h-5 w-5 text-gray-400" />
                )}
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {server.name}
                  </div>
                  <div className="text-xs text-gray-500">{server.host}</div>
                </div>
              </div>
              {!server.enabled && (
                <span className="text-xs text-gray-500">비활성</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          선택된 서버: <span className="font-medium">{selectedServers.length}</span>개
        </p>
      </div>
    </div>
  );
}
