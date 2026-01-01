'use client';

import { useState, useEffect } from 'react';
import { Globe, Search, Loader2, Plus, CheckCircle, Users, X, Server, RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';
import { FortigateClientProxy } from '@/lib/fortigate-client-proxy';
import { storage } from '@/lib/storage';

interface DomainInfo {
  domain: string;
  type: 'main' | 'resource' | 'api' | 'cdn' | 'analytics';
  description?: string;
}

interface ServerRegistration {
  serverId: string;
  serverName: string;
  registered: boolean;
}

interface DomainRegistrationStatus {
  [domain: string]: ServerRegistration[];
}

export default function DomainAnalyzerPage() {
  const { servers, selectedServers } = useStore();
  const [inputDomain, setInputDomain] = useState('');
  const [blocklist, setBlocklist] = useState<string[]>(['facebook', 'twitter', 'instagram', 'tiktok', 'snapchat']);
  const [newBlockItem, setNewBlockItem] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState<DomainRegistrationStatus>({});
  const [checkingStatus, setCheckingStatus] = useState(false);

  const addToBlocklist = () => {
    if (!newBlockItem.trim()) return;
    if (!blocklist.includes(newBlockItem.trim().toLowerCase())) {
      setBlocklist([...blocklist, newBlockItem.trim().toLowerCase()]);
    }
    setNewBlockItem('');
  };

  const removeFromBlocklist = (item: string) => {
    setBlocklist(blocklist.filter(b => b !== item));
  };

  const isBlocked = (domain: string): boolean => {
    const lowerDomain = domain.toLowerCase();
    return blocklist.some(blocked => lowerDomain.includes(blocked));
  };

  // Check registration status for all domains
  const checkRegistrationStatus = async (domainList: string[]) => {
    if (servers.length === 0 || domainList.length === 0) return;

    setCheckingStatus(true);
    try {
      const response = await fetch('/api/fortigate/check-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domains: domainList,
          servers: servers.map(s => ({
            id: s.id,
            name: s.name,
            host: s.host,
            apiKey: s.apiKey,
            vdom: s.vdom,
          })),
        }),
      });

      const result = await response.json();

      if (result.success && result.results) {
        const statusMap: DomainRegistrationStatus = {};
        for (const item of result.results) {
          statusMap[item.domain] = item.servers;
        }
        setRegistrationStatus(statusMap);
      }
    } catch (error) {
      console.error('Failed to check registration status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const analyzeDomain = async () => {
    if (!inputDomain.trim()) {
      alert('도메인을 입력해주세요');
      return;
    }

    setAnalyzing(true);
    setDomains([]);
    setSelectedDomains(new Set());

    try {
      // Call the domain analysis API
      const response = await fetch('/api/analyze-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: inputDomain.trim() }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '도메인 분석 실패');
      }

      // Filter out blocked domains
      const filteredDomains = result.domains.filter((d: DomainInfo) => !isBlocked(d.domain));
      const blockedCount = result.domains.length - filteredDomains.length;

      setDomains(filteredDomains);
      // Select all by default
      setSelectedDomains(new Set(filteredDomains.map((d: DomainInfo) => d.domain)));

      // Check registration status for all domains
      if (filteredDomains.length > 0 && servers.length > 0) {
        checkRegistrationStatus(filteredDomains.map((d: DomainInfo) => d.domain));
      }

      if (blockedCount > 0) {
        alert(`총 ${result.domains.length}개 도메인 발견\n블랙리스트 필터링: ${blockedCount}개 제외됨\n표시: ${filteredDomains.length}개`);
      }
    } catch (error) {
      alert('도메인 분석 실패: ' + (error as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleDomain = (domain: string) => {
    const newSelected = new Set(selectedDomains);
    if (newSelected.has(domain)) {
      newSelected.delete(domain);
    } else {
      newSelected.add(domain);
    }
    setSelectedDomains(newSelected);
  };

  const addToFortigate = async () => {
    if (selectedServers.length === 0) {
      alert('서버를 먼저 선택해주세요');
      return;
    }

    if (selectedDomains.size === 0) {
      alert('추가할 도메인을 선택해주세요');
      return;
    }

    setAdding(true);
    const results = [];

    try {
      for (const serverId of selectedServers) {
        const server = servers.find(s => s.id === serverId);
        if (!server) continue;

        const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);

        for (const domain of Array.from(selectedDomains)) {
          try {
            // Check if address already exists
            const existing = await client.getAddress(domain);
            if (existing) {
              results.push({
                server: server.name,
                domain,
                success: false,
                error: '이미 존재함'
              });
              continue;
            }

            // Create new FQDN address
            await client.createAddress({
              name: domain,
              type: 'fqdn',
              fqdn: domain,
              comment: `Auto-added from domain analyzer for ${inputDomain}`,
            });

            results.push({ server: server.name, domain, success: true });
          } catch (error) {
            results.push({
              server: server.name,
              domain,
              success: false,
              error: (error as Error).message,
            });
          }
        }
      }

      await storage.addAuditLog({
        action: 'create',
        resourceType: 'address',
        resourceName: `${selectedDomains.size} domains from ${inputDomain}`,
        servers: selectedServers.map(id => servers.find(s => s.id === id)?.name || ''),
        status: results.every(r => r.success) ? 'success' : results.some(r => r.success) ? 'partial' : 'failed',
        details: `Added ${results.filter(r => r.success).length}/${results.length} domains`,
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      let message = `${successCount}개 도메인이 성공적으로 추가되었습니다`;
      if (failCount > 0) {
        message += `\n${failCount}개 실패 (이미 존재하거나 오류 발생)`;
      }
      alert(message);

      // Clear after success
      if (successCount > 0) {
        setDomains([]);
        setSelectedDomains(new Set());
        setInputDomain('');
      }
    } catch (error) {
      alert('추가 실패: ' + (error as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const createAddressGroup = async () => {
    if (!groupName.trim()) {
      alert('그룹 이름을 입력해주세요');
      return;
    }

    if (selectedServers.length === 0) {
      alert('서버를 먼저 선택해주세요');
      return;
    }

    if (selectedDomains.size === 0) {
      alert('그룹에 추가할 도메인을 선택해주세요');
      return;
    }

    setCreatingGroup(true);
    const results = [];

    try {
      // First, ensure all selected domains exist as addresses
      for (const serverId of selectedServers) {
        const server = servers.find(s => s.id === serverId);
        if (!server) continue;

        const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);

        // Create addresses first
        for (const domain of Array.from(selectedDomains)) {
          try {
            const existing = await client.getAddress(domain);
            if (!existing) {
              await client.createAddress({
                name: domain,
                type: 'fqdn',
                fqdn: domain,
                comment: `Auto-added for group ${groupName.trim()} from ${inputDomain}`,
              });
            }
          } catch (error) {
            console.error(`Failed to create address ${domain}:`, error);
          }
        }

        // Create the group
        try {
          const existingGroup = await client.getAddressGroup(groupName.trim());
          if (existingGroup) {
            results.push({
              server: server.name,
              success: false,
              error: '그룹이 이미 존재함'
            });
            continue;
          }

          await client.createAddressGroup({
            name: groupName.trim(),
            member: Array.from(selectedDomains),
            comment: `Auto-created from domain analyzer for ${inputDomain}`,
          });

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
        action: 'create',
        resourceType: 'addressGroup',
        resourceName: groupName.trim(),
        servers: selectedServers.map(id => servers.find(s => s.id === id)?.name || ''),
        status: results.every(r => r.success) ? 'success' : results.some(r => r.success) ? 'partial' : 'failed',
        details: `Created group with ${selectedDomains.size} domains from ${inputDomain}`,
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      let message = `${successCount}개 서버에 그룹 "${groupName.trim()}" 생성 완료`;
      if (failCount > 0) {
        message += `\n${failCount}개 서버 실패`;
      }
      alert(message);

      // Clear after success
      if (successCount > 0) {
        setDomains([]);
        setSelectedDomains(new Set());
        setInputDomain('');
        setGroupName('');
      }
    } catch (error) {
      alert('그룹 생성 실패: ' + (error as Error).message);
    } finally {
      setCreatingGroup(false);
    }
  };

  const getTypeLabel = (type: DomainInfo['type']) => {
    const labels = {
      main: '메인',
      resource: '리소스',
      api: 'API',
      cdn: 'CDN',
      analytics: '분석'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: DomainInfo['type']) => {
    const colors = {
      main: 'bg-blue-100 text-blue-800',
      resource: 'bg-green-100 text-green-800',
      api: 'bg-purple-100 text-purple-800',
      cdn: 'bg-orange-100 text-orange-800',
      analytics: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">도메인 분석기</h1>
        <p className="text-gray-600 mt-1">
          웹사이트 도메인을 입력하면 해당 사이트 로딩에 필요한 모든 도메인을 찾아서 FortiGate에 추가할 수 있습니다.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              분석할 도메인 입력
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={inputDomain}
                  onChange={(e) => setInputDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && analyzeDomain()}
                  placeholder="예: megastudy.net"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={analyzeDomain}
                disabled={analyzing || !inputDomain.trim()}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>분석 중...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    <span>분석</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              도메인만 입력하세요 (예: example.com, www.example.com)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              블랙리스트 (제외할 키워드)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newBlockItem}
                onChange={(e) => setNewBlockItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addToBlocklist()}
                placeholder="제외할 키워드 입력 (예: facebook)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={addToBlocklist}
                disabled={!newBlockItem.trim()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {blocklist.map(item => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-sm"
                >
                  {item}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-900"
                    onClick={() => removeFromBlocklist(item)}
                  />
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              블랙리스트에 있는 키워드가 포함된 도메인은 분석 결과에서 자동 제외됩니다
            </p>
          </div>
        </div>
      </div>

      {domains.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  발견된 도메인 ({domains.length}개)
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedDomains.size}개 선택됨
                  {checkingStatus && <span className="ml-2 text-blue-600">등록 상태 확인 중...</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => checkRegistrationStatus(domains.map(d => d.domain))}
                  disabled={checkingStatus || servers.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                  title="등록 상태 새로고침"
                >
                  <RefreshCw className={`h-4 w-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                  <span>상태 확인</span>
                </button>
                <button
                  onClick={addToFortigate}
                  disabled={adding || selectedDomains.size === 0 || selectedServers.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>추가 중...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Address 추가</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선택한 도메인들을 그룹으로 생성
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createAddressGroup()}
                  placeholder="그룹 이름 입력 (예: megastudy_domains)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={createAddressGroup}
                  disabled={creatingGroup || !groupName.trim() || selectedDomains.size === 0 || selectedServers.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {creatingGroup ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>생성 중...</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      <span>그룹 생성</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                선택된 {selectedDomains.size}개 도메인이 자동으로 Address로 추가되고, 하나의 그룹으로 묶입니다
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {domains.map((domainInfo) => {
              const status = registrationStatus[domainInfo.domain];
              const registeredServers = status?.filter(s => s.registered) || [];
              const allRegistered = status && status.length > 0 && registeredServers.length === status.length;
              const someRegistered = registeredServers.length > 0 && registeredServers.length < (status?.length || 0);

              return (
                <div
                  key={domainInfo.domain}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedDomains.has(domainInfo.domain) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => toggleDomain(domainInfo.domain)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {selectedDomains.has(domainInfo.domain) ? (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {domainInfo.domain}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(domainInfo.type)}`}>
                            {getTypeLabel(domainInfo.type)}
                          </span>
                        </div>
                        {domainInfo.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {domainInfo.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Server registration status */}
                    <div className="flex items-center space-x-2 ml-4">
                      {status ? (
                        <div className="flex flex-wrap gap-1">
                          {status.map((s) => (
                            <span
                              key={s.serverId}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                s.registered
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                              title={s.registered ? `${s.serverName}에 등록됨` : `${s.serverName}에 미등록`}
                            >
                              <Server className="h-3 w-3 mr-1" />
                              {s.serverName}
                              {s.registered && <CheckCircle className="h-3 w-3 ml-1" />}
                            </span>
                          ))}
                        </div>
                      ) : checkingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedServers.length === 0 && domains.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ FortiGate 서버를 선택해야 도메인을 추가할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
