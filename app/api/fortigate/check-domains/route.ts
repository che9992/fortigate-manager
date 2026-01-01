import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

interface DomainCheckResult {
  domain: string;
  servers: {
    serverId: string;
    serverName: string;
    registered: boolean;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { domains, servers } = await request.json();

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json({ error: 'Domains array is required' }, { status: 400 });
    }

    if (!servers || !Array.isArray(servers) || servers.length === 0) {
      return NextResponse.json({ error: 'Servers array is required' }, { status: 400 });
    }

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const results: DomainCheckResult[] = [];

    // Check each domain against each server
    for (const domain of domains) {
      const domainResult: DomainCheckResult = {
        domain,
        servers: [],
      };

      for (const server of servers) {
        try {
          const url = `https://${server.host}/api/v2/cmdb/firewall/address/${encodeURIComponent(domain)}`;

          const response = await axios({
            method: 'GET',
            url,
            headers: {
              'Authorization': `Bearer ${server.apiKey}`,
              'Content-Type': 'application/json',
            },
            httpsAgent,
            timeout: 10000,
            params: server.vdom ? { vdom: server.vdom } : undefined,
          });

          // If we get a successful response, the address exists
          domainResult.servers.push({
            serverId: server.id,
            serverName: server.name,
            registered: response.status === 200 && response.data?.results?.length > 0,
          });
        } catch (error: any) {
          // 404 means not found, other errors we'll treat as not registered
          domainResult.servers.push({
            serverId: server.id,
            serverName: server.name,
            registered: false,
          });
        }
      }

      results.push(domainResult);
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('[Check Domains] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
