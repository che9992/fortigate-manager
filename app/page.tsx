'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { FortigateClientProxy } from '@/lib/fortigate-client-proxy';
import { Activity, AlertCircle, CheckCircle, XCircle, Server, Shield, Users, ExternalLink } from 'lucide-react';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const { servers, loadServers } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  useEffect(() => {
    if (servers.length === 0) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const serverStatus = await Promise.all(
          servers.map(async (server) => {
            try {
              const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);
              const status = await client.getSystemStatus();
              return {
                serverId: server.id,
                serverName: server.name,
                status: 'online' as const,
                version: status.version,
                lastSync: new Date(),
              };
            } catch (error) {
              return {
                serverId: server.id,
                serverName: server.name,
                status: 'error' as const,
              };
            }
          })
        );

        // Get counts from first available server
        let totalAddresses = 0;
        let totalAddressGroups = 0;
        let totalPolicies = 0;

        for (const server of servers) {
          try {
            const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);
            const [addresses, groups, policies] = await Promise.all([
              client.getAddresses(),
              client.getAddressGroups(),
              client.getPolicies(),
            ]);
            totalAddresses = addresses.length;
            totalAddressGroups = groups.length;
            totalPolicies = policies.length;
            break;
          } catch (error) {
            continue;
          }
        }

        setStats({
          totalAddresses,
          totalAddressGroups,
          totalPolicies,
          serverStatus,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [servers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          환영합니다!
        </h2>
        <p className="text-gray-600 mb-4">
          FortiGate 서버를 추가하여 시작하세요.
        </p>
        <a
          href="/servers"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          서버 추가하기
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-1">FortiGate 서버 현황 및 통계</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 Address</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.totalAddresses || 0}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Address Group</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.totalAddressGroups || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Policy</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.totalPolicies || 0}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Server Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">서버 상태</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats?.serverStatus.map((server) => {
            const serverData = servers.find(s => s.id === server.serverId);
            return (
              <div key={server.serverId} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {server.status === 'online' ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{server.serverName}</h3>
                    {server.version && (
                      <p className="text-sm text-gray-500">Version: {server.version}</p>
                    )}
                    {serverData && (
                      <p className="text-xs text-gray-400 mt-1">{serverData.host}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {serverData && (
                    <button
                      onClick={() => window.open(`https://${serverData.host}`, '_blank', 'noopener,noreferrer')}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      title="FortiGate 관리 페이지 열기"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>접속</span>
                    </button>
                  )}
                  <span
                    className={`
                      inline-flex px-3 py-1 rounded-full text-xs font-medium
                      ${server.status === 'online'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }
                    `}
                  >
                    {server.status === 'online' ? '온라인' : '오류'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
