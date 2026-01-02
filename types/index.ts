export interface FortigateServer {
  id: string;
  name: string;
  host: string;
  apiKey: string;
  vdom?: string;
  enabled: boolean;
}

export interface Address {
  name: string;
  subnet?: string;
  type: 'ipmask' | 'iprange' | 'fqdn' | 'geography';
  fqdn?: string;
  startIp?: string;
  endIp?: string;
  comment?: string;
}

export interface AddressGroup {
  name: string;
  member: { name: string }[] | string[]; // FortiGate API expects {name: string}[], but returns both formats
  comment?: string;
}

export interface Policy {
  policyid?: number;
  name: string;
  srcintf: string[];
  dstintf: string[];
  srcaddr: string[];
  dstaddr: string[];
  action: 'accept' | 'deny';
  schedule: string;
  service: string[];
  logtraffic?: 'all' | 'utm' | 'disable';
  nat?: 'enable' | 'disable';
  comments?: string;
  status?: 'enable' | 'disable';
}

export interface ServiceObject {
  name: string;
  protocol: 'TCP/UDP/SCTP' | 'ICMP' | 'IP';
  tcp_portrange?: string;
  udp_portrange?: string;
  comment?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  action: 'create' | 'update' | 'delete' | 'sync';
  resourceType: 'address' | 'addressGroup' | 'policy' | 'service';
  resourceName: string;
  servers: string[];
  status: 'success' | 'partial' | 'failed';
  details: string;
  user?: string;
}

export interface SyncResult {
  server: string;
  success: boolean;
  error?: string;
  changes?: string[];
}

export interface DashboardStats {
  totalAddresses: number;
  totalAddressGroups: number;
  totalPolicies: number;
  serverStatus: {
    serverId: string;
    serverName: string;
    status: 'online' | 'offline' | 'error';
    lastSync?: Date;
    version?: string;
  }[];
}
