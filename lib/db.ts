import fs from 'fs';
import path from 'path';
import type { FortigateServer, AuditLog } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// 데이터 디렉토리 생성
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 초기 파일 생성
if (!fs.existsSync(SERVERS_FILE)) {
  fs.writeFileSync(SERVERS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(LOGS_FILE)) {
  fs.writeFileSync(LOGS_FILE, JSON.stringify([]));
}

export const db = {
  // Server Management
  getServers(): FortigateServer[] {
    const data = fs.readFileSync(SERVERS_FILE, 'utf-8');
    return JSON.parse(data);
  },

  saveServers(servers: FortigateServer[]): void {
    fs.writeFileSync(SERVERS_FILE, JSON.stringify(servers, null, 2));
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
    const data = fs.readFileSync(LOGS_FILE, 'utf-8');
    const logs = JSON.parse(data);
    return logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  },

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    logs.unshift(newLog);

    // Keep only last 1000 logs
    const trimmedLogs = logs.slice(0, 1000);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmedLogs, null, 2));
  },

  clearAuditLogs(): void {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([]));
  },
};
