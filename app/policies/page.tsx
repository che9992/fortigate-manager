'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { FortigateClientProxy } from '@/lib/fortigate-client-proxy';
import { storage } from '@/lib/storage';
import { ServerSelector } from '@/components/ServerSelector';
import { MultiSelect } from '@/components/MultiSelect';
import { Plus, Trash2, Edit2, RefreshCw, Loader2, Shield, CheckCircle, XCircle, Search, Power, PowerOff, ArrowUpDown } from 'lucide-react';
import type { Policy } from '@/types';

export default function PoliciesPage() {
  const { servers, selectedServers } = useStore();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [addressGroups, setAddressGroups] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<number | null>(null);
  const [movingPolicy, setMovingPolicy] = useState<number | null>(null);
  const [moveSearchTerm, setMoveSearchTerm] = useState('');
  const [moveAction, setMoveAction] = useState<'before' | 'after'>('before');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show 50 items per page

  // Helper function to convert to array
  const toArray = (value: any): string[] => {
    if (Array.isArray(value)) return value.map(v => typeof v === 'object' ? v.name || String(v) : String(v));
    if (typeof value === 'object' && value !== null) return [value.name || String(value)];
    if (typeof value === 'string') return [value];
    return [];
  };

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
    nat: 'disable',
    status: 'enable',
    comments: '',
  });

  const loadData = async () => {
    if (selectedServers.length === 0) return;

    setLoading(true);
    try {
      const server = servers.find(s => s.id === selectedServers[0]);
      if (!server) return;

      const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);
      const [policyList, intfList, addrList, addrGrpList, svcList] = await Promise.all([
        client.getPolicies(),
        client.getInterfaces(),
        client.getAddresses(),
        client.getAddressGroups(),
        client.getServices(),
      ]);

      setPolicies(policyList);
      setInterfaces(intfList.map(i => i.name));
      setAddresses(addrList.map(a => a.name));
      // Prefix address groups with 📁 to distinguish them visually
      setAddressGroups(addrGrpList.map(g => `📁 ${g.name}`));
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

  // Filter policies based on search term
  useEffect(() => {
    setCurrentPage(1); // Reset to first page on search
    if (!searchTerm.trim()) {
      setFilteredPolicies(policies);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = policies.filter(policy => {
        const searchableText = [
          policy.name,
          policy.policyid?.toString(),
          policy.action,
          policy.status,
          policy.comments || '',
          ...toArray(policy.srcintf),
          ...toArray(policy.dstintf),
          ...toArray(policy.srcaddr),
          ...toArray(policy.dstaddr),
          ...toArray(policy.service),
        ].join(' ').toLowerCase();

        return searchableText.includes(term);
      });
      setFilteredPolicies(filtered);
    }
  }, [policies, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPolicies = filteredPolicies.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServers.length === 0) {
      alert('서버를 선택해주세요');
      return;
    }

    setSyncing(true);
    const results = [];
    let createdPolicyId: number | null = null;

    try {
      // Remove 📁 prefix from address groups before sending to FortiGate
      const cleanFormData = {
        ...formData,
        srcaddr: formData.srcaddr.map(addr => addr.replace('📁 ', '')),
        dstaddr: formData.dstaddr.map(addr => addr.replace('📁 ', '')),
      };

      for (const serverId of selectedServers) {
        const server = servers.find(s => s.id === serverId);
        if (!server) continue;

        try {
          const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);

          if (editingPolicy !== null) {
            await client.updatePolicy(editingPolicy, cleanFormData);
          } else {
            await client.createPolicy(cleanFormData);
            // Get the created policy ID from the first server
            if (createdPolicyId === null) {
              const policies = await client.getPolicies();
              const created = policies.find(p => p.name === cleanFormData.name);
              if (created?.policyid) {
                createdPolicyId = created.policyid;
              }
            }
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

      await storage.addAuditLog({
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
      await loadData();

      // If policy was created successfully, open move modal
      if (createdPolicyId !== null && editingPolicy === null) {
        setMovingPolicy(createdPolicyId);
      }
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
          const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);
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

      await storage.addAuditLog({
        action: 'delete',
        resourceType: 'policy',
        resourceName: name,
        servers: selectedServers.map(id => servers.find(s => s.id === id)?.name || ''),
        status: results.every(r => r.success) ? 'success' : results.some(r => r.success) ? 'partial' : 'failed',
        details: results.map(r => `${r.server}: ${r.success ? '성공' : r.error}`).join(', '),
      });

      const successCount = results.filter(r => r.success).length;
      alert(`${successCount}/${results.length} 서버에서 삭제 완료`);
      await loadData();
    } catch (error) {
      alert('삭제 실패: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleStatus = async (policy: Policy) => {
    if (!policy.policyid) return;

    const newStatus = policy.status === 'enable' ? 'disable' : 'enable';
    setSyncing(true);
    const results = [];

    try {
      for (const serverId of selectedServers) {
        const server = servers.find(s => s.id === serverId);
        if (!server) continue;

        try {
          const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);
          await client.updatePolicy(policy.policyid, { ...policy, status: newStatus });
          results.push({ server: server.name, success: true });
        } catch (error) {
          results.push({
            server: server.name,
            success: false,
            error: (error as Error).message,
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      alert(`${successCount}/${results.length} 서버에서 ${newStatus === 'enable' ? '활성화' : '비활성화'} 완료`);
      await loadData();
    } catch (error) {
      alert('상태 변경 실패: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleMove = async (selectedReference: Policy) => {
    if (!movingPolicy || !selectedReference.policyid) return;

    setSyncing(true);
    const results = [];
    const movingPolicyData = policies.find(p => p.policyid === movingPolicy);

    try {
      for (const serverId of selectedServers) {
        const server = servers.find(s => s.id === serverId);
        if (!server) continue;

        try {
          const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);
          await client.movePolicy(movingPolicy, moveAction, selectedReference.policyid);
          results.push({ server: server.name, success: true });
        } catch (error) {
          results.push({
            server: server.name,
            success: false,
            error: (error as Error).message,
          });
        }
      }

      await storage.addAuditLog({
        action: 'update',
        resourceType: 'policy',
        resourceName: movingPolicyData?.name || `Policy ${movingPolicy}`,
        servers: selectedServers.map(id => servers.find(s => s.id === id)?.name || ''),
        status: results.every(r => r.success) ? 'success' : results.some(r => r.success) ? 'partial' : 'failed',
        details: `Moved ${moveAction} Policy ${selectedReference.policyid} (${selectedReference.name})`,
      });

      const successCount = results.filter(r => r.success).length;
      alert(`${successCount}/${results.length} 서버에서 이동 완료`);
      setMovingPolicy(null);
      setMoveSearchTerm('');
      await loadData();
    } catch (error) {
      alert('이동 실패: ' + (error as Error).message);
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

        <div className="flex items-center justify-between gap-4">
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

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Policy 검색 (이름, ID, Interface, Address, Service 등...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

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
                <MultiSelect
                  label="Source Interface"
                  options={interfaces}
                  selected={formData.srcintf}
                  onChange={(selected) => setFormData({ ...formData, srcintf: selected })}
                  placeholder="인터페이스 선택"
                />

                <MultiSelect
                  label="Destination Interface"
                  options={interfaces}
                  selected={formData.dstintf}
                  onChange={(selected) => setFormData({ ...formData, dstintf: selected })}
                  placeholder="인터페이스 선택"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MultiSelect
                  label="Source Address"
                  options={[...addresses, ...addressGroups]}
                  selected={formData.srcaddr}
                  onChange={(selected) => setFormData({ ...formData, srcaddr: selected })}
                  placeholder="주소 또는 그룹 선택"
                />

                <MultiSelect
                  label="Destination Address"
                  options={[...addresses, ...addressGroups]}
                  selected={formData.dstaddr}
                  onChange={(selected) => setFormData({ ...formData, dstaddr: selected })}
                  placeholder="주소 또는 그룹 선택"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MultiSelect
                  label="Service"
                  options={services}
                  selected={formData.service}
                  onChange={(selected) => setFormData({ ...formData, service: selected })}
                  placeholder="서비스 선택"
                />

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

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.nat === 'enable'}
                      onChange={(e) => setFormData({ ...formData, nat: e.target.checked ? 'enable' : 'disable' })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">NAT 활성화</span>
                  </label>
                </div>
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
          ) : filteredPolicies.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>검색 결과가 없습니다</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  전체 {filteredPolicies.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredPolicies.length)} 표시
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {paginatedPolicies.map((policy) => (
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
                            {toArray(policy.srcintf).join(', ')} → {toArray(policy.srcaddr).join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Destination: </span>
                          <span className="text-gray-900">
                            {toArray(policy.dstintf).join(', ')} → {toArray(policy.dstaddr).join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Service: </span>
                          <span className="text-gray-900">{toArray(policy.service).join(', ')}</span>
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
                        onClick={() => handleToggleStatus(policy)}
                        disabled={syncing}
                        className={`p-2 rounded disabled:opacity-50 ${
                          policy.status === 'enable'
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={policy.status === 'enable' ? '비활성화' : '활성화'}
                      >
                        {policy.status === 'enable' ? (
                          <Power className="h-4 w-4" />
                        ) : (
                          <PowerOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setMovingPolicy(policy.policyid || null)}
                        disabled={syncing}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50"
                        title="Policy 이동"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setFormData({
                            ...policy,
                            srcintf: toArray(policy.srcintf),
                            dstintf: toArray(policy.dstintf),
                            srcaddr: toArray(policy.srcaddr),
                            dstaddr: toArray(policy.dstaddr),
                            service: toArray(policy.service),
                          });
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
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Policy Move Modal */}
      {movingPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Policy 이동: {policies.find(p => p.policyid === movingPolicy)?.name}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이동 방향
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMoveAction('before')}
                  className={`px-4 py-2 rounded ${
                    moveAction === 'before'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  선택한 Policy 앞으로
                </button>
                <button
                  onClick={() => setMoveAction('after')}
                  className={`px-4 py-2 rounded ${
                    moveAction === 'after'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  선택한 Policy 뒤로
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기준 Policy 검색
              </label>
              <input
                type="text"
                value={moveSearchTerm}
                onChange={(e) => setMoveSearchTerm(e.target.value)}
                placeholder="Policy 이름으로 검색..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded">
              {policies
                .filter(p =>
                  p.policyid !== movingPolicy &&
                  p.name.toLowerCase().includes(moveSearchTerm.toLowerCase())
                )
                .map((policy) => (
                  <div
                    key={policy.policyid}
                    onClick={() => handleMove(policy)}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">#{policy.policyid} - {policy.name}</p>
                        <p className="text-xs text-gray-600">
                          {policy.srcintf.join(', ')} → {policy.dstintf.join(', ')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        policy.status === 'enable'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {policy.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setMovingPolicy(null);
                  setMoveSearchTerm('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
