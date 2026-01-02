import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

interface PolicyUsage {
  policyId: number;
  policyName: string;
  usedIn: 'srcaddr' | 'dstaddr' | 'both';
}

interface DomainCheckResult {
  domain: string;
  servers: {
    serverId: string;
    serverName: string;
    registered: boolean;
    policies: PolicyUsage[];
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
        let registered = false;
        const policies: PolicyUsage[] = [];

        try {
          // Get all addresses and find by FQDN value instead of name
          const addressUrl = `https://${server.host}/api/v2/cmdb/firewall/address`;

          const addressResponse = await axios({
            method: 'GET',
            url: addressUrl,
            headers: {
              'Authorization': `Bearer ${server.apiKey}`,
              'Content-Type': 'application/json',
            },
            httpsAgent,
            timeout: 10000,
            params: server.vdom ? { vdom: server.vdom } : undefined,
          });

          const addresses = addressResponse.data?.results || [];

          // Find address by FQDN value (not by name)
          const matchingAddress = addresses.find((addr: any) =>
            addr.type === 'fqdn' && addr.fqdn === domain
          );

          registered = !!matchingAddress;

          // If registered, check which policies use this address
          if (registered && matchingAddress) {
            try {
              const policiesUrl = `https://${server.host}/api/v2/cmdb/firewall/policy`;
              const policiesResponse = await axios({
                method: 'GET',
                url: policiesUrl,
                headers: {
                  'Authorization': `Bearer ${server.apiKey}`,
                  'Content-Type': 'application/json',
                },
                httpsAgent,
                timeout: 15000,
                params: server.vdom ? { vdom: server.vdom } : undefined,
              });

              const allPolicies = policiesResponse.data?.results || [];

              // Check each policy for this address (using the actual address name)
              for (const policy of allPolicies) {
                const srcaddrs = policy.srcaddr || [];
                const dstaddrs = policy.dstaddr || [];

                const inSrc = srcaddrs.some((addr: any) => addr.name === matchingAddress.name);
                const inDst = dstaddrs.some((addr: any) => addr.name === matchingAddress.name);

                if (inSrc || inDst) {
                  policies.push({
                    policyId: policy.policyid,
                    policyName: policy.name || `Policy ${policy.policyid}`,
                    usedIn: inSrc && inDst ? 'both' : inSrc ? 'srcaddr' : 'dstaddr',
                  });
                }
              }
            } catch (policyError) {
              console.error(`Failed to check policies for ${domain} on ${server.name}:`, policyError);
            }
          }

          domainResult.servers.push({
            serverId: server.id,
            serverName: server.name,
            registered,
            policies,
          });
        } catch (error: any) {
          // 404 means not found, other errors we'll treat as not registered
          domainResult.servers.push({
            serverId: server.id,
            serverName: server.name,
            registered: false,
            policies: [],
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
