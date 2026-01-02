'use client';

import { useState } from 'react';
import { Zap, Plus, Minus, Users as UsersIcon, Shield, Loader2, Search, Eye } from 'lucide-react';
import { useStore } from '@/lib/store';
import { ServerSelector } from '@/components/ServerSelector';
import { FortigateClientProxy } from '@/lib/fortigate-client-proxy';

interface ActionResult {
  serverId: string;
  serverName: string;
  success: boolean;
  message: string;
}

interface GroupMemberInfo {
  serverName: string;
  members: string[];
}

export default function QuickActionsPage() {
  const { servers, selectedServers } = useStore();
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<ActionResult[]>([]);

  // Address Group Member Management
  const [groupName, setGroupName] = useState('');
  const [memberToAdd, setMemberToAdd] = useState('');
  const [memberToRemove, setMemberToRemove] = useState('');
  const [groupMembers, setGroupMembers] = useState<GroupMemberInfo[]>([]);
  const [viewingMembers, setViewingMembers] = useState(false);

  const addMemberToGroup = async () => {
    if (!groupName.trim() || !memberToAdd.trim() || selectedServers.length === 0) {
      alert('그룹 이름과 추가할 멤버를 입력하고 서버를 선택해주세요');
      return;
    }

    setExecuting(true);
    const newResults: ActionResult[] = [];

    try {
      for (const serverId of selectedServers) {
        const server = servers.find(s => s.id === serverId);
        if (!server) continue;

        try {
          const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);

          // Get existing group
          const existingGroup = await client.getAddressGroup(groupName.trim());

          if (!existingGroup) {
            newResults.push({
              serverId: server.id,
              serverName: server.name,
              success: false,
              message: `그룹 "${groupName.trim()}"을 찾을 수 없습니다`,
            });
            continue;
          }

          // Check if member already exists
          const members = Array.isArray(existingGroup.member)
            ? existingGroup.member.map((m: any) => typeof m === 'object' ? m.name : m)
            : [];

          if (members.includes(memberToAdd.trim())) {
            newResults.push({
              serverId: server.id,
              serverName: server.name,
              success: false,
              message: `멤버 "${memberToAdd.trim()}"이 이미 존재합니다`,
            });
            continue;
          }

          // Add new member (FortiGate expects objects with 'name' property)
          await client.updateAddressGroup(groupName.trim(), {
            ...existingGroup,
            member: [...members, memberToAdd.trim()].map(name => ({ name })),
          });

          newResults.push({
            serverId: server.id,
            serverName: server.name,
            success: true,
            message: `멤버 "${memberToAdd.trim()}" 추가 완료`,
          });
        } catch (error) {
          newResults.push({
            serverId: server.id,
            serverName: server.name,
            success: false,
            message: (error as Error).message,
          });
        }
      }

      setResults([...newResults, ...results]);
      alert(`${newResults.filter(r => r.success).length}/${newResults.length} 서버에서 작업 완료`);
      setMemberToAdd('');
    } catch (error) {
      alert('작업 실패: ' + (error as Error).message);
    } finally {
      setExecuting(false);
    }
  };

  const removeMemberFromGroup = async () => {
    if (!groupName.trim() || !memberToRemove.trim() || selectedServers.length === 0) {
      alert('그룹 이름과 제거할 멤버를 입력하고 서버를 선택해주세요');
      return;
    }

    setExecuting(true);
    const newResults: ActionResult[] = [];

    try {
      for (const serverId of selectedServers) {
        const server = servers.find(s => s.id === serverId);
        if (!server) continue;

        try {
          const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);

          // Get existing group
          const existingGroup = await client.getAddressGroup(groupName.trim());

          if (!existingGroup) {
            newResults.push({
              serverId: server.id,
              serverName: server.name,
              success: false,
              message: `그룹 "${groupName.trim()}"을 찾을 수 없습니다`,
            });
            continue;
          }

          // Get current members
          const members = Array.isArray(existingGroup.member)
            ? existingGroup.member.map((m: any) => typeof m === 'object' ? m.name : m)
            : [];

          if (!members.includes(memberToRemove.trim())) {
            newResults.push({
              serverId: server.id,
              serverName: server.name,
              success: false,
              message: `멤버 "${memberToRemove.trim()}"을 찾을 수 없습니다`,
            });
            continue;
          }

          // Remove member
          const updatedMembers = members.filter(m => m !== memberToRemove.trim());

          if (updatedMembers.length === 0) {
            newResults.push({
              serverId: server.id,
              serverName: server.name,
              success: false,
              message: '그룹에 최소 1개의 멤버가 필요합니다',
            });
            continue;
          }

          await client.updateAddressGroup(groupName.trim(), {
            ...existingGroup,
            member: updatedMembers.map(name => ({ name })), // FortiGate expects objects
          });

          newResults.push({
            serverId: server.id,
            serverName: server.name,
            success: true,
            message: `멤버 "${memberToRemove.trim()}" 제거 완료`,
          });
        } catch (error) {
          newResults.push({
            serverId: server.id,
            serverName: server.name,
            success: false,
            message: (error as Error).message,
          });
        }
      }

      setResults([...newResults, ...results]);
      alert(`${newResults.filter(r => r.success).length}/${newResults.length} 서버에서 작업 완료`);
      setMemberToRemove('');
    } catch (error) {
      alert('작업 실패: ' + (error as Error).message);
    } finally {
      setExecuting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const viewGroupMembers = async () => {
    if (!groupName.trim() || selectedServers.length === 0) {
      alert('그룹 이름을 입력하고 서버를 선택해주세요');
      return;
    }

    setExecuting(true);
    setViewingMembers(true);
    const membersInfo: GroupMemberInfo[] = [];

    try {
      for (const serverId of selectedServers) {
        const server = servers.find(s => s.id === serverId);
        if (!server) continue;

        try {
          const client = new FortigateClientProxy(server.host, server.apiKey, server.vdom);
          const group = await client.getAddressGroup(groupName.trim());

          if (group) {
            const members = Array.isArray(group.member)
              ? group.member.map((m: any) => typeof m === 'object' ? m.name : m)
              : [];

            membersInfo.push({
              serverName: server.name,
              members: members,
            });
          } else {
            membersInfo.push({
              serverName: server.name,
              members: [],
            });
          }
        } catch (error) {
          membersInfo.push({
            serverName: server.name,
            members: [],
          });
        }
      }

      setGroupMembers(membersInfo);
    } catch (error) {
      alert('그룹 조회 실패: ' + (error as Error).message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">빠른 작업</h1>
        </div>
        <p className="text-gray-600">
          여러 서버에 자주 사용하는 작업을 빠르게 실행할 수 있습니다
        </p>
      </div>

      {/* Server Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">서버 선택</h2>
        <ServerSelector />
        {selectedServers.length === 0 && (
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ 작업을 실행할 서버를 선택해주세요
          </p>
        )}
      </div>

      {/* Address Group Member Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <UsersIcon className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Address Group 멤버 관리</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address Group 이름
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="예: Keymedia.co.kr"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={viewGroupMembers}
                disabled={executing || !groupName.trim() || selectedServers.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {executing && viewingMembers ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span>멤버 조회</span>
              </button>
            </div>
          </div>

          {/* Group Members Display */}
          {groupMembers.length > 0 && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-medium text-gray-900 mb-3">현재 그룹 멤버</h3>
              <div className="space-y-3">
                {groupMembers.map((info) => (
                  <div key={info.serverName} className="bg-white rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900">{info.serverName}</span>
                      <span className="text-xs text-gray-500">
                        {info.members.length === 0 ? '그룹 없음' : `${info.members.length}개 멤버`}
                      </span>
                    </div>
                    {info.members.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {info.members.map((member) => (
                          <span
                            key={member}
                            className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">이 서버에 그룹이 존재하지 않습니다</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Add Member */}
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h3 className="font-medium text-gray-900 mb-3">멤버 추가</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={memberToAdd}
                  onChange={(e) => setMemberToAdd(e.target.value)}
                  placeholder="추가할 멤버 이름 (예: FQ_keymedia.co.kr)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={addMemberToGroup}
                  disabled={executing || !groupName.trim() || !memberToAdd.trim() || selectedServers.length === 0}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {executing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>멤버 추가</span>
                </button>
              </div>
            </div>

            {/* Remove Member */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="font-medium text-gray-900 mb-3">멤버 제거</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={memberToRemove}
                  onChange={(e) => setMemberToRemove(e.target.value)}
                  placeholder="제거할 멤버 이름 (예: FQ_keyedu.co.kr)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={removeMemberFromGroup}
                  disabled={executing || !groupName.trim() || !memberToRemove.trim() || selectedServers.length === 0}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {executing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                  <span>멤버 제거</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              작업 결과 ({results.length})
            </h2>
            <button
              onClick={clearResults}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              결과 지우기
            </button>
          </div>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={`${result.serverId}-${index}`}
                className={`p-3 rounded border ${
                  result.success
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{result.serverName}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    result.success
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? '성공' : '실패'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{result.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
