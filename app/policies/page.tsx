'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { FortigateClient } from '@/lib/fortigate-client';
import { storage } from '@/lib/storage';
import { ServerSelector } from '@/components/ServerSelector';
import { Plus, Trash2, Edit2, RefreshCw, Loader2, Shield, CheckCircle, XCircle } from 'lucide-react';
import type { Policy } from '@/types';

export default function PoliciesPage() {
  const { servers, selectedServers } = useStore();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<number | null>(null);

  const [formData, setFormData] = useState<Policy>({
    name: '',
    srcintf: [],
    dstintf: [],
    srcaddr: [],
    dstaddr: [],
    action: 'accept',
    schedule: 'always',
    service: [],
    logtraffic: 'all',
    status: 'enable',
    comments: '',
  });

  const loadData = async () => {
    if (selectedServers.length === 0) return;

    setLoading(true);
    try {
      const server = servers.find(s => s.id === selectedServers[0]);
      if (!server) return;

      const client = new FortigateClient(server.host, server.apiKey, server.vdom);
      const [policyList, intfList, addrList, svcList] = await Promise.all([
        client.getPolicies(),
        client.getInterfaces(),
        client.getAddresses(),
        client.getServices(),
      ]);

      setPolicies(policyList);
      setInterfaces(intfList.map(i => i.name));
      setAddresses(addrList.map(a => a.name));
      setServices(svcList.map(s => s.name));
    } catch (error) {
      alert('데이터 로드 실패: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedServers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServers.length === 0) {
      alert('서버를 선택해주세요');
      return;
    }

    setSyncing(true);
    const results = [];

    try {
      for (const serverId of selectedServers) {
        const server = servers.find(s => s.id === serverId);
        if (!server) continue;

        try {
          const client = new FortigateClient(server.host, server.apiKey, server.vdom);

          if (editingPolicy !== null) {
            await client.updatePolicy(editingPolicy, formData);
          } else {
            await client.createPolicy(formData);
          }

          results.push({ server: server.name, success: true });
        } catch (error) {
          results.push({
            server: server.name,
            success: false,
            error: (error as Error).message,
          });
        }
      }

      storage.addAuditLog({
        action: editingPolicy !== null ? 'update' : 'create',
        resourceType: 'policy',
        resourceName: formData.name,
        servers: selectedServers.map(id => servers.find(s => s.id === id)?.name || ''),
        status: results.every(r => r.success) ? 'success' : results.some(r => r.success) ? 'partial' : 'failed',
        details: results.map(r => `${r.server}: ${r.success ? '성공' : r.error}`).join(', '),
      });

      const successCount = results.filter(r => r.success).length;
      alert(`${successCount}/${results.length} 서버에 ${editingPolicy !== null ? '수정' : '생성'} 완료`);

      setShowForm(false);
      setEditingPolicy(null);
      setFormData({
        name: '',
        srcintf: [],
        dstintf: [],
        srcaddr: [],
        dstaddr: [],
        action: 'accept',
        schedule: 'always',
        service: [],
        logtraffic: 'all',
        status: 'enable',
        comments: '',
      });
      loadData();
    } catch (error) {
      alert('작업 실패: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (policyId: number, name: string) => {
    if (!confirm(`Policy "${name}"를 삭제하시겠습니까?`)) return;

    setSyncing(true);
    const results = [];

    try {
      for (const serverId of selectedServers) {
        const server = servers.find(s => s.id === serverId);
        if (!server) continue;

        try {
          const client = new FortigateClient(server.host, server.apiKey, server.vdom);
          await client.deletePolicy(policyId);
          results.push({ server: server.name, success: true });
        } catch (error) {
          results.push({
            server: server.name,
            success: false,
            error: (error as Error).message,
          });
        }
      }

      storage.addAuditLog({
        action: 'delete',
        resourceType: 'policy',
        resourceName: name,
        servers: selectedServers.map(id => servers.find(s => s.id === id)?.name || ''),
        status: results.every(r => r.success) ? 'success' : results.some(r => r.success) ? 'partial' : 'failed',
        details: results.map(r => `${r.server}: ${r.success ? '성공' : r.error}`).join(', '),
      });

      const successCount = results.filter(r => r.success).length;
      alert(`${successCount}/${results.length} 서버에서 삭제 완료`);
      loadData();
    } catch (error) {
      alert('삭제 실패: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <ServerSelector />
      </div>

      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Policy 관리</h1>
          <button
            onClick={loadData}
            disabled={loading || selectedServers.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            disabled={selectedServers.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Policy 추가</span>
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPolicy !== null ? 'Policy 수정' : '새 Policy 추가'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy 이름
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Interface (콤마로 구분)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.srcintf.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      srcintf: e.target.value.split(',').map(i => i.trim()).filter(i => i)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="port1, port2"
                  />
                  <p className="text-xs text-gray-500 mt-1">사용 가능: {interfaces.slice(0, 5).join(', ')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Interface (콤마로 구분)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dstintf.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      dstintf: e.target.value.split(',').map(i => i.trim()).filter(i => i)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="port1, port2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Address (콤마로 구분)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.srcaddr.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      srcaddr: e.target.value.split(',').map(a => a.trim()).filter(a => a)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="all, address1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {addresses.length > 0 ? `등록된 주소 ${addresses.length}개` : 'Address를 먼저 생성하세요'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Address (콤마로 구분)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dstaddr.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      dstaddr: e.target.value.split(',').map(a => a.trim()).filter(a => a)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="all, address2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service (콤마로 구분)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.service.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      service: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="ALL, HTTP, HTTPS"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action
                  </label>
                  <select
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value as Policy['action'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="accept">Accept</option>
                    <option value="deny">Deny</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule
                  </label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Log Traffic
                  </label>
                  <select
                    value={formData.logtraffic}
                    onChange={(e) => setFormData({ ...formData, logtraffic: e.target.value as Policy['logtraffic'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All</option>
                    <option value="utm">UTM</option>
                    <option value="disable">Disable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.status === 'enable'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'enable' : 'disable' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Policy 활성화</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명 (선택사항)
                </label>
                <textarea
                  value={formData.comments || ''}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPolicy(null);
                    setFormData({
                      name: '',
                      srcintf: [],
                      dstintf: [],
                      srcaddr: [],
                      dstaddr: [],
                      action: 'accept',
                      schedule: 'always',
                      service: [],
                      logtraffic: 'all',
                      status: 'enable',
                      comments: '',
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {syncing && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingPolicy !== null ? '수정' : '추가'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            </div>
          ) : policies.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>등록된 Policy가 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {policies.map((policy) => (
                <div key={policy.policyid} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {policy.action === 'accept' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <h3 className="font-medium text-gray-900">
                          {policy.name}
                          {policy.policyid && (
                            <span className="ml-2 text-sm text-gray-500">
                              (ID: {policy.policyid})
                            </span>
                          )}
                        </h3>
                        <span
                          className={`
                            px-2 py-1 rounded text-xs font-medium
                            ${policy.status === 'enable'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }
                          `}
                        >
                          {policy.status === 'enable' ? '활성' : '비활성'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Source: </span>
                          <span className="text-gray-900">
                            {policy.srcintf.join(', ')} → {policy.srcaddr.join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Destination: </span>
                          <span className="text-gray-900">
                            {policy.dstintf.join(', ')} → {policy.dstaddr.join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Service: </span>
                          <span className="text-gray-900">{policy.service.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Action: </span>
                          <span className={`font-medium ${policy.action === 'accept' ? 'text-green-600' : 'text-red-600'}`}>
                            {policy.action.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {policy.comments && (
                        <p className="text-xs text-gray-500 mt-2">{policy.comments}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setFormData(policy);
                          setEditingPolicy(policy.policyid || null);
                          setShowForm(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(policy.policyid || 0, policy.name)}
                        disabled={syncing}
                        className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
