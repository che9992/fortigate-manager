'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { FortigateClientProxy } from '@/lib/fortigate-client-proxy';
import { storage } from '@/lib/storage';
import { ServerSelector } from '@/components/ServerSelector';
import { MultiSelect } from '@/components/MultiSelect';
import { Plus, Trash2, Edit2, RefreshCw, Loader2, Search } from 'lucide-react';
import type { Address, AddressGroup } from '@/types';

type TabType = 'addresses' | 'groups';

export default function AddressesPage() {
  const { servers, selectedServers } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('addresses');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [groups, setGroups] = useState<AddressGroup[]>([]);
  const [filteredAddresses, setFilteredAddresses] = useState<Address[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<AddressGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);

  // Helper function to convert to array
  const toArray = (value: any): string[] => {
    if (Array.isArray(value)) return value.map(v => typeof v === 'object' ? v.name || String(v) : String(v));
    if (typeof value === 'object' && value !== null) return [value.name || String(value)];
    if (typeof value === 'string') return [value];
    return [];
  };

  const [addressFormData, setAddressFormData] = useState<Address>({
    name: '',
    type: 'ipmask',
    subnet: '',
    comment: '',
  });

  const [groupFormData, setGroupFormData] = useState<AddressGroup>({
    name: '',
    member: [],
    comment: '',
  });

  const loadData = async () => {
    if (selectedServers.length === 0) return;

    setLoading(true);
    try {
      const server = servers.find(s => s.id === selectedServers[0]);
      if (!server) return;

      const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);
      const [addressList, groupList] = await Promise.all([
        client.getAddresses(),
        client.getAddressGroups(),
      ]);

      setAddresses(addressList);
      setGroups(groupList);
    } catch (error) {
      alert('데이터 로드 실패: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedServers]);

  // Filter addresses based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAddresses(addresses);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = addresses.filter(addr => {
        const searchableText = [
          addr.name,
          addr.type,
          addr.subnet || '',
          addr.fqdn || '',
          addr.comment || '',
        ].join(' ').toLowerCase();
        return searchableText.includes(term);
      });
      setFilteredAddresses(filtered);
    }
  }, [addresses, searchTerm]);

  // Filter groups based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredGroups(groups);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = groups.filter(group => {
        const searchableText = [
          group.name,
          ...toArray(group.member),
          group.comment || '',
        ].join(' ').toLowerCase();
        return searchableText.includes(term);
      });
      setFilteredGroups(filtered);
    }
  }, [groups, searchTerm]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
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
          const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);

          if (editingAddress) {
            await client.updateAddress(editingAddress, addressFormData);
          } else {
            await client.createAddress(addressFormData);
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
        action: editingAddress ? 'update' : 'create',
        resourceType: 'address',
        resourceName: addressFormData.name,
        servers: selectedServers.map(id => servers.find(s => s.id === id)?.name || ''),
        status: results.every(r => r.success) ? 'success' : results.some(r => r.success) ? 'partial' : 'failed',
        details: results.map(r => `${r.server}: ${r.success ? '성공' : r.error}`).join(', '),
      });

      const successCount = results.filter(r => r.success).length;
      alert(`${successCount}/${results.length} 서버에 ${editingAddress ? '수정' : '생성'} 완료`);

      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressFormData({ name: '', type: 'ipmask', subnet: '', comment: '' });
      await loadData();
    } catch (error) {
      alert('작업 실패: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
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
          const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);

          if (editingGroup) {
            await client.updateAddressGroup(editingGroup, groupFormData);
          } else {
            await client.createAddressGroup(groupFormData);
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
        action: editingGroup ? 'update' : 'create',
        resourceType: 'addressGroup',
        resourceName: groupFormData.name,
        servers: selectedServers.map(id => servers.find(s => s.id === id)?.name || ''),
        status: results.every(r => r.success) ? 'success' : results.some(r => r.success) ? 'partial' : 'failed',
        details: results.map(r => `${r.server}: ${r.success ? '성공' : r.error}`).join(', '),
      });

      const successCount = results.filter(r => r.success).length;
      alert(`${successCount}/${results.length} 서버에 ${editingGroup ? '수정' : '생성'} 완료`);

      setShowGroupForm(false);
      setEditingGroup(null);
      setGroupFormData({ name: '', member: [], comment: '' });
      await loadData();
    } catch (error) {
      alert('작업 실패: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteAddress = async (name: string) => {
    if (!confirm(`Address "${name}"를 삭제하시겠습니까?`)) return;

    setSyncing(true);
    const results = [];

    try {
      for (const serverId of selectedServers) {
        const server = servers.find(s => s.id === serverId);
        if (!server) continue;

        try {
          const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);
          await client.deleteAddress(name);
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
        resourceType: 'address',
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

  const handleDeleteGroup = async (name: string) => {
    if (!confirm(`Address Group "${name}"를 삭제하시겠습니까?`)) return;

    setSyncing(true);
    const results = [];

    try {
      for (const serverId of selectedServers) {
        const server = servers.find(s => s.id === serverId);
        if (!server) continue;

        try {
          const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);
          await client.deleteAddressGroup(name);
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
        resourceType: 'addressGroup',
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <ServerSelector />
      </div>

      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Address 관리</h1>
          <button
            onClick={loadData}
            disabled={loading || selectedServers.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('addresses')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'addresses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Addresses ({addresses.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'groups'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Address Groups ({groups.length})
            </button>
          </nav>
        </div>

        {/* Address Tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  disabled={selectedServers.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Address 추가</span>
                </button>
              )}

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Address 검색 (이름, 타입, 서브넷, FQDN 등...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {showAddressForm && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingAddress ? 'Address 수정' : '새 Address 추가'}
                </h2>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        이름
                      </label>
                      <input
                        type="text"
                        required
                        value={addressFormData.name}
                        onChange={(e) => setAddressFormData({ ...addressFormData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        disabled={!!editingAddress}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        타입
                      </label>
                      <select
                        value={addressFormData.type}
                        onChange={(e) => setAddressFormData({ ...addressFormData, type: e.target.value as Address['type'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="ipmask">IP/Netmask</option>
                        <option value="iprange">IP Range</option>
                        <option value="fqdn">FQDN</option>
                      </select>
                    </div>
                  </div>

                  {addressFormData.type === 'ipmask' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subnet (예: 192.168.1.0/24)
                      </label>
                      <input
                        type="text"
                        required
                        value={addressFormData.subnet || ''}
                        onChange={(e) => setAddressFormData({ ...addressFormData, subnet: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}

                  {addressFormData.type === 'fqdn' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        FQDN
                      </label>
                      <input
                        type="text"
                        required
                        value={addressFormData.fqdn || ''}
                        onChange={(e) => setAddressFormData({ ...addressFormData, fqdn: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}

                  {addressFormData.type === 'iprange' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          시작 IP
                        </label>
                        <input
                          type="text"
                          required
                          value={addressFormData.startIp || ''}
                          onChange={(e) => setAddressFormData({ ...addressFormData, startIp: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          종료 IP
                        </label>
                        <input
                          type="text"
                          required
                          value={addressFormData.endIp || ''}
                          onChange={(e) => setAddressFormData({ ...addressFormData, endIp: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명 (선택사항)
                    </label>
                    <textarea
                      value={addressFormData.comment || ''}
                      onChange={(e) => setAddressFormData({ ...addressFormData, comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                        setAddressFormData({ name: '', type: 'ipmask', subnet: '', comment: '' });
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
                      <span>{editingAddress ? '수정' : '추가'}</span>
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
              ) : addresses.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  등록된 Address가 없습니다
                </div>
              ) : filteredAddresses.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  검색 결과가 없습니다
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAddresses.map((addr) => (
                    <div key={addr.name} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <h3 className="font-medium text-gray-900">{addr.name}</h3>
                        <p className="text-sm text-gray-600">
                          {addr.type === 'ipmask' && addr.subnet}
                          {addr.type === 'fqdn' && addr.fqdn}
                          {addr.type === 'iprange' && `${addr.startIp} - ${addr.endIp}`}
                        </p>
                        {addr.comment && (
                          <p className="text-xs text-gray-500 mt-1">{addr.comment}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setAddressFormData(addr);
                            setEditingAddress(addr.name);
                            setShowAddressForm(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.name)}
                          disabled={syncing}
                          className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
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
        )}

        {/* Address Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              {!showGroupForm && (
                <button
                  onClick={() => setShowGroupForm(true)}
                  disabled={selectedServers.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Address Group 추가</span>
                </button>
              )}

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Address Group 검색 (이름, 멤버 등...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {showGroupForm && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingGroup ? 'Address Group 수정' : '새 Address Group 추가'}
                </h2>
                <form onSubmit={handleGroupSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      그룹 이름
                    </label>
                    <input
                      type="text"
                      required
                      value={groupFormData.name}
                      onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={!!editingGroup}
                    />
                  </div>

                  <MultiSelect
                    label="멤버 (Addresses)"
                    options={addresses.map(a => a.name)}
                    selected={groupFormData.member}
                    onChange={(selected) => setGroupFormData({ ...groupFormData, member: selected })}
                    placeholder="Address 선택"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명 (선택사항)
                    </label>
                    <textarea
                      value={groupFormData.comment || ''}
                      onChange={(e) => setGroupFormData({ ...groupFormData, comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGroupForm(false);
                        setEditingGroup(null);
                        setGroupFormData({ name: '', member: [], comment: '' });
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
                      <span>{editingGroup ? '수정' : '추가'}</span>
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
              ) : groups.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  등록된 Address Group이 없습니다
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  검색 결과가 없습니다
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredGroups.map((group) => (
                    <div key={group.name} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          멤버 ({toArray(group.member).length}): {toArray(group.member).join(', ')}
                        </p>
                        {group.comment && (
                          <p className="text-xs text-gray-500 mt-1">{group.comment}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setGroupFormData({
                              ...group,
                              member: toArray(group.member),
                            });
                            setEditingGroup(group.name);
                            setShowGroupForm(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.name)}
                          disabled={syncing}
                          className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
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
        )}
      </div>
    </div>
  );
}
