'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { FileText, Trash2, Filter, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { AuditLog } from '@/types';

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterResource, setFilterResource] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filterAction, filterResource, filterStatus]);

  const loadLogs = async () => {
    const auditLogs = await storage.getAuditLogs();
    setLogs(auditLogs);
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    if (filterResource !== 'all') {
      filtered = filtered.filter(log => log.resourceType === filterResource);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    setFilteredLogs(filtered);
  };

  const handleClearLogs = async () => {
    if (confirm('모든 감사 로그를 삭제하시겠습니까?')) {
      await storage.clearAuditLogs();
      await loadLogs();
    }
  };

  const getActionBadge = (action: AuditLog['action']) => {
    const colors = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      sync: 'bg-purple-100 text-purple-800',
    };

    const labels = {
      create: '생성',
      update: '수정',
      delete: '삭제',
      sync: '동기화',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[action]}`}>
        {labels[action]}
      </span>
    );
  };

  const getResourceBadge = (resourceType: AuditLog['resourceType']) => {
    const labels = {
      address: 'Address',
      addressGroup: 'Address Group',
      policy: 'Policy',
      service: 'Service',
    };

    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
        {labels[resourceType]}
      </span>
    );
  };

  const getStatusIcon = (status: AuditLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">감사 로그</h1>
          <p className="text-gray-600 mt-1">모든 변경 사항이 기록됩니다</p>
        </div>
        <button
          onClick={handleClearLogs}
          disabled={logs.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          <span>로그 삭제</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">필터:</span>
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">모든 작업</option>
            <option value="create">생성</option>
            <option value="update">수정</option>
            <option value="delete">삭제</option>
            <option value="sync">동기화</option>
          </select>

          <select
            value={filterResource}
            onChange={(e) => setFilterResource(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">모든 리소스</option>
            <option value="address">Address</option>
            <option value="addressGroup">Address Group</option>
            <option value="policy">Policy</option>
            <option value="service">Service</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">모든 상태</option>
            <option value="success">성공</option>
            <option value="partial">부분 성공</option>
            <option value="failed">실패</option>
          </select>

          <div className="flex-1 text-right text-sm text-gray-600">
            총 {filteredLogs.length}개의 로그
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>표시할 로그가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getStatusIcon(log.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getActionBadge(log.action)}
                        {getResourceBadge(log.resourceType)}
                        <span className="text-sm font-medium text-gray-900">
                          {log.resourceName}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">서버:</span>{' '}
                          {log.servers.join(', ')}
                        </div>
                        <div>
                          <span className="font-medium">결과:</span>{' '}
                          {log.details}
                        </div>
                        {log.user && (
                          <div>
                            <span className="font-medium">사용자:</span>{' '}
                            {log.user}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-xs text-gray-500">
                      {format(log.timestamp, 'yyyy-MM-dd')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(log.timestamp, 'HH:mm:ss')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      {logs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">성공</p>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter(l => l.status === 'success').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">부분 성공</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {logs.filter(l => l.status === 'partial').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">실패</p>
                <p className="text-2xl font-bold text-red-600">
                  {logs.filter(l => l.status === 'failed').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
