import type { FortigateServer, AuditLog } from '@/types';

const SERVERS_KEY = 'fortigate_servers';
const AUDIT_LOGS_KEY = 'fortigate_audit_logs';

export const storage = {
  // Server Management
  getServers(): FortigateServer[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(SERVERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveServers(servers: FortigateServer[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
  },

  addServer(server: FortigateServer): void {
    const servers = this.getServers();
    servers.push(server);
    this.saveServers(servers);
  },

  updateServer(id: string, updates: Partial<FortigateServer>): void {
    const servers = this.getServers();
    const index = servers.findIndex(s => s.id === id);
    if (index !== -1) {
      servers[index] = { ...servers[index], ...updates };
      this.saveServers(servers);
    }
  },

  deleteServer(id: string): void {
    const servers = this.getServers().filter(s => s.id !== id);
    this.saveServers(servers);
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!data) return [];

    const logs = JSON.parse(data);
    return logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  },

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
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

    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      user: currentUser,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    logs.unshift(newLog);

    // Keep only last 1000 logs
    const trimmedLogs = logs.slice(0, 1000);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(trimmedLogs));
  },

  clearAuditLogs(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUDIT_LOGS_KEY);
  },
};
