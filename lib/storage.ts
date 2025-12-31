import type { FortigateServer, AuditLog } from '@/types';

export const storage = {
  // Server Management
  async getServers(): Promise<FortigateServer[]> {
    if (typeof window === 'undefined') return [];
    try {
      const response = await fetch('/api/servers');
      if (!response.ok) throw new Error('Failed to fetch servers');
      return await response.json();
    } catch (error) {
      console.error('Failed to get servers:', error);
      return [];
    }
  },

  async saveServers(servers: FortigateServer[]): Promise<void> {
    // This method is deprecated - use addServer, updateServer, deleteServer instead
    console.warn('saveServers is deprecated');
  },

  async addServer(server: FortigateServer): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(server),
      });
      if (!response.ok) throw new Error('Failed to add server');
    } catch (error) {
      console.error('Failed to add server:', error);
      throw error;
    }
  },

  async updateServer(id: string, updates: Partial<FortigateServer>): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const response = await fetch(`/api/servers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update server');
    } catch (error) {
      console.error('Failed to update server:', error);
      throw error;
    }
  },

  async deleteServer(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const response = await fetch(`/api/servers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete server');
    } catch (error) {
      console.error('Failed to delete server:', error);
      throw error;
    }
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    if (typeof window === 'undefined') return [];
    try {
      const response = await fetch('/api/logs');
      if (!response.ok) throw new Error('Failed to fetch logs');
      const logs = await response.json();
      return logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  },

  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    if (typeof window === 'undefined') return;

    // 현재 로그인된 사용자 정보 가져오기
    let currentUser = log.user;
    if (!currentUser) {
      try {
        const authData = localStorage.getItem('fortigate_auth');
        if (authData) {
          const auth = JSON.parse(authData);
          currentUser = auth.user || undefined;
        }
      } catch (error) {
        // 에러 무시
      }
    }

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...log, user: currentUser }),
      });
      if (!response.ok) throw new Error('Failed to add audit log');
    } catch (error) {
      console.error('Failed to add audit log:', error);
      throw error;
    }
  },

  async clearAuditLogs(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const response = await fetch('/api/logs', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear audit logs');
    } catch (error) {
      console.error('Failed to clear audit logs:', error);
      throw error;
    }
  },
};
