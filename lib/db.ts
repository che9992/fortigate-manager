import { Redis } from '@upstash/redis';
import type { FortigateServer, AuditLog } from '@/types';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const SERVERS_KEY = 'fortigate:servers';
const LOGS_KEY = 'fortigate:logs';

export const db = {
  // Server Management
  async getServers(): Promise<FortigateServer[]> {
    const servers = await redis.get<FortigateServer[]>(SERVERS_KEY);
    return servers || [];
  },

  async saveServers(servers: FortigateServer[]): Promise<void> {
    await redis.set(SERVERS_KEY, servers);
  },

  async addServer(server: FortigateServer): Promise<void> {
    const servers = await this.getServers();
    servers.push(server);
    await this.saveServers(servers);
  },

  async updateServer(id: string, updates: Partial<FortigateServer>): Promise<void> {
    const servers = await this.getServers();
    const index = servers.findIndex(s => s.id === id);
    if (index !== -1) {
      servers[index] = { ...servers[index], ...updates };
      await this.saveServers(servers);
    }
  },

  async deleteServer(id: string): Promise<void> {
    const servers = (await this.getServers()).filter(s => s.id !== id);
    await this.saveServers(servers);
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const logs = await redis.get<AuditLog[]>(LOGS_KEY);
    if (!logs) return [];
    return logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  },

  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const logs = await this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    logs.unshift(newLog);

    // Keep only last 1000 logs
    const trimmedLogs = logs.slice(0, 1000);
    await redis.set(LOGS_KEY, trimmedLogs);
  },

  async clearAuditLogs(): Promise<void> {
    await redis.set(LOGS_KEY, []);
  },
};
