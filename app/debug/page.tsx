'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { FortigateClientProxy } from '@/lib/fortigate-client-proxy';

export default function DebugPage() {
  const { servers, loadServers } = useStore();

  useEffect(() => {
    loadServers();
  }, [loadServers]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    if (!selectedServer) {
      setTestResult('서버를 선택해주세요');
      return;
    }

    const server = servers.find(s => s.id === selectedServer);
    if (!server) {
      setTestResult('서버를 찾을 수 없습니다');
      return;
    }

    setLoading(true);
    setTestResult('테스트 중...\n\n');

    try {
      const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);

      // Test 1: System Status
      setTestResult(prev => prev + '1. System Status 테스트...\n');
      try {
        const status = await client.getSystemStatus();
        setTestResult(prev => prev + `✅ System Status: ${JSON.stringify(status, null, 2)}\n\n`);
      } catch (error: any) {
        setTestResult(prev => prev + `❌ System Status 실패: ${error.message}\n`);
        setTestResult(prev => prev + `Error details: ${JSON.stringify(error, null, 2)}\n\n`);
      }

      // Test 2: Addresses
      setTestResult(prev => prev + '2. Addresses 테스트...\n');
      try {
        const addresses = await client.getAddresses();
        setTestResult(prev => prev + `✅ Addresses: ${addresses.length}개 발견\n`);
        setTestResult(prev => prev + `First 3: ${JSON.stringify(addresses.slice(0, 3), null, 2)}\n\n`);
      } catch (error: any) {
        setTestResult(prev => prev + `❌ Addresses 실패: ${error.message}\n`);
        setTestResult(prev => prev + `Error details: ${JSON.stringify(error, null, 2)}\n\n`);
      }

      // Test 3: Address Groups
      setTestResult(prev => prev + '3. Address Groups 테스트...\n');
      try {
        const groups = await client.getAddressGroups();
        setTestResult(prev => prev + `✅ Address Groups: ${groups.length}개 발견\n`);
        setTestResult(prev => prev + `First 3: ${JSON.stringify(groups.slice(0, 3), null, 2)}\n\n`);
      } catch (error: any) {
        setTestResult(prev => prev + `❌ Address Groups 실패: ${error.message}\n`);
        setTestResult(prev => prev + `Error details: ${JSON.stringify(error, null, 2)}\n\n`);
      }

      // Test 4: Policies
      setTestResult(prev => prev + '4. Policies 테스트...\n');
      try {
        const policies = await client.getPolicies();
        setTestResult(prev => prev + `✅ Policies: ${policies.length}개 발견\n`);
        setTestResult(prev => prev + `First 3: ${JSON.stringify(policies.slice(0, 3), null, 2)}\n\n`);
      } catch (error: any) {
        setTestResult(prev => prev + `❌ Policies 실패: ${error.message}\n`);
        setTestResult(prev => prev + `Error details: ${JSON.stringify(error, null, 2)}\n\n`);
      }

      setTestResult(prev => prev + '\n테스트 완료!');
    } catch (error: any) {
      setTestResult(prev => prev + `\n❌ 전체 테스트 실패: ${error.message}\n`);
      setTestResult(prev => prev + `Stack: ${error.stack}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">FortiGate 연결 디버그</h1>
        <p className="text-gray-600 mt-1">실제 FortiGate API 통신을 테스트합니다</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              테스트할 서버 선택
            </label>
            <select
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">서버를 선택하세요</option>
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name} ({server.host})
                </option>
              ))}
            </select>
          </div>

          {selectedServer && (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>서버 정보:</strong>
              </p>
              <pre className="text-xs mt-2 text-gray-600">
                {JSON.stringify(servers.find(s => s.id === selectedServer), null, 2)}
              </pre>
            </div>
          )}

          <button
            onClick={testConnection}
            disabled={!selectedServer || loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '테스트 중...' : '연결 테스트 시작'}
          </button>
        </div>
      </div>

      {testResult && (
        <div className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-auto max-h-96">
          <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
    </div>
  );
}
