'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Plus, Trash2, Edit2, Server, Eye, EyeOff } from 'lucide-react';
import type { FortigateServer } from '@/types';

export default function ServersPage() {
  const { servers, loadServers, addServer, updateServer, deleteServer } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Omit<FortigateServer, 'id'>>({
    name: '',
    host: '',
    apiKey: '',
    vdom: 'root',
    enabled: true,
  });

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateServer(editingId, formData);
        setEditingId(null);
      } else {
        await addServer({
          ...formData,
          id: Date.now().toString(),
        });
      }
      setFormData({
        name: '',
        host: '',
        apiKey: '',
        vdom: 'root',
        enabled: true,
      });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save server:', error);
      alert('서버 저장에 실패했습니다.');
    }
  };

  const handleEdit = (server: FortigateServer) => {
    setFormData({
      name: server.name,
      host: server.host,
      apiKey: server.apiKey,
      vdom: server.vdom || 'root',
      enabled: server.enabled,
    });
    setEditingId(server.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      host: '',
      apiKey: '',
      vdom: 'root',
      enabled: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const toggleApiKeyVisibility = (serverId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [serverId]: !prev[serverId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">서버 설정</h1>
          <p className="text-gray-600 mt-1">FortiGate 서버를 추가하고 관리하세요</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>서버 추가</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? '서버 수정' : '새 서버 추가'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  서버 이름
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: FortiGate-01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  호스트 (IP 또는 도메인)
                </label>
                <input
                  type="text"
                  required
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 192.168.1.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                required
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="FortiGate API Token"
              />
              <p className="text-xs text-gray-500 mt-1">
                FortiGate 웹 인터페이스에서 생성한 API 토큰을 입력하세요
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VDOM (선택사항)
              </label>
              <input
                type="text"
                value={formData.vdom}
                onChange={(e) => setFormData({ ...formData, vdom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="root"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
                서버 활성화
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingId ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">등록된 서버</h2>
        </div>
        {servers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Server className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>등록된 서버가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {servers.map((server) => (
              <div key={server.id} className="p-6 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Server className="h-5 w-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">{server.name}</h3>
                      <p className="text-sm text-gray-500">{server.host}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-400">
                          API Key: {showApiKeys[server.id] ? server.apiKey : '••••••••••••••••'}
                        </p>
                        <button
                          onClick={() => toggleApiKeyVisibility(server.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showApiKeys[server.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        VDOM: {server.vdom || 'root'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${server.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }
                    `}
                  >
                    {server.enabled ? '활성' : '비활성'}
                  </span>
                  <button
                    onClick={() => handleEdit(server)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`${server.name} 서버를 삭제하시겠습니까?`)) {
                        try {
                          await deleteServer(server.id);
                        } catch (error) {
                          console.error('Failed to delete server:', error);
                          alert('서버 삭제에 실패했습니다.');
                        }
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
