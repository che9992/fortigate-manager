'use client';

import { useState } from 'react';
import { Terminal, Play, Trash2, Copy, Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { ServerSelector } from '@/components/ServerSelector';

interface CommandResult {
  serverId: string;
  serverName: string;
  output: string;
  success: boolean;
  timestamp: Date;
}

export default function CLIPage() {
  const { servers, selectedServers } = useStore();
  const [command, setCommand] = useState('');
  const [results, setResults] = useState<CommandResult[]>([]);
  const [executing, setExecuting] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const executeCommand = async () => {
    if (!command.trim() || selectedServers.length === 0) {
      alert('명령어를 입력하고 서버를 선택해주세요');
      return;
    }

    setExecuting(true);
    const newResults: CommandResult[] = [];

    try {
      // Execute command on each selected server in parallel
      const promises = selectedServers.map(async (serverId) => {
        const server = servers.find(s => s.id === serverId);
        if (!server) return null;

        try {
          const response = await fetch('/api/fortigate/cli', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              host: server.host,
              apiKey: server.apiKey,
              vdom: server.vdom,
              command: command.trim(),
            }),
          });

          const data = await response.json();

          return {
            serverId: server.id,
            serverName: server.name,
            output: data.success ? data.output : data.error,
            success: data.success,
            timestamp: new Date(),
          };
        } catch (error) {
          return {
            serverId: server.id,
            serverName: server.name,
            output: (error as Error).message,
            success: false,
            timestamp: new Date(),
          };
        }
      });

      const commandResults = await Promise.all(promises);
      newResults.push(...commandResults.filter(r => r !== null) as CommandResult[]);

      setResults([...newResults, ...results]);
    } catch (error) {
      alert('명령 실행 실패: ' + (error as Error).message);
    } finally {
      setExecuting(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Terminal className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">CLI 명령 실행</h1>
        </div>
        <p className="text-gray-600">
          선택한 여러 서버에 FortiGate CLI 명령을 동시에 실행할 수 있습니다
        </p>
      </div>

      {/* Server Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">서버 선택</h2>
        <ServerSelector />
        {selectedServers.length === 0 && (
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ 명령을 실행할 서버를 선택해주세요
          </p>
        )}
      </div>

      {/* Command Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">명령어 입력</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              FortiGate CLI 명령어
            </label>
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="예: get system status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              여러 줄 명령어를 입력할 수 있습니다. 각 줄은 순차적으로 실행됩니다.
            </p>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedServers.length}개 서버에 실행됩니다
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearResults}
                disabled={results.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>결과 지우기</span>
              </button>
              <button
                onClick={executeCommand}
                disabled={executing || !command.trim() || selectedServers.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                <span>{executing ? '실행 중...' : '실행'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            실행 결과 ({results.length})
          </h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={`${result.serverId}-${result.timestamp.getTime()}`}
                className={`border rounded-lg p-4 ${
                  result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{result.serverName}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      result.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? '성공' : '실패'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.output, index)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      title="출력 복사"
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto font-mono">
                  {result.output}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
