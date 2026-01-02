import type { Address, AddressGroup, Policy, ServiceObject } from '@/types';

export class FortigateClientProxy {
  private host: string;
  private apiKey: string;
  private vdom: string;

  constructor(host: string, apiKey: string, vdom: string = 'root') {
    this.host = host;
    this.apiKey = apiKey;
    this.vdom = vdom;
  }

  private async proxyRequest(method: string, endpoint: string, data?: any) {
    try {
      const response = await fetch('/api/fortigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: this.host,
          apiKey: this.apiKey,
          vdom: this.vdom,
          method,
          endpoint,
          data,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        const error = new Error(result.error || 'FortiGate API request failed');
        (error as any).status = result.status;
        (error as any).fortigateResponse = result.fortigateResponse;
        throw error;
      }

      return result.data;
    } catch (error: any) {
      // If it's a network error (fetch failed), throw with more context
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('네트워크 오류: 프록시 서버에 연결할 수 없습니다');
      }
      throw error;
    }
  }

  // System Status
  async getSystemStatus() {
    return await this.proxyRequest('GET', '/monitor/system/status');
  }

  // Address Management
  async getAddresses(): Promise<Address[]> {
    const data = await this.proxyRequest('GET', `/cmdb/firewall/address?vdom=${this.vdom}`);
    return data.results || [];
  }

  async getAddress(name: string): Promise<Address | null> {
    try {
      const data = await this.proxyRequest('GET', `/cmdb/firewall/address/${encodeURIComponent(name)}?vdom=${this.vdom}`);
      return data.results?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  async createAddress(address: Address): Promise<void> {
    await this.proxyRequest('POST', `/cmdb/firewall/address?vdom=${this.vdom}`, address);
  }

  async updateAddress(name: string, address: Address): Promise<void> {
    await this.proxyRequest('PUT', `/cmdb/firewall/address/${encodeURIComponent(name)}?vdom=${this.vdom}`, address);
  }

  async deleteAddress(name: string): Promise<void> {
    await this.proxyRequest('DELETE', `/cmdb/firewall/address/${encodeURIComponent(name)}?vdom=${this.vdom}`);
  }

  // Address Group Management
  async getAddressGroups(): Promise<AddressGroup[]> {
    const data = await this.proxyRequest('GET', `/cmdb/firewall/addrgrp?vdom=${this.vdom}`);
    return data.results || [];
  }

  async getAddressGroup(name: string): Promise<AddressGroup | null> {
    try {
      const data = await this.proxyRequest('GET', `/cmdb/firewall/addrgrp/${encodeURIComponent(name)}?vdom=${this.vdom}`);
      return data.results?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  async createAddressGroup(group: AddressGroup): Promise<void> {
    await this.proxyRequest('POST', `/cmdb/firewall/addrgrp?vdom=${this.vdom}`, group);
  }

  async updateAddressGroup(name: string, group: AddressGroup): Promise<void> {
    await this.proxyRequest('PUT', `/cmdb/firewall/addrgrp/${encodeURIComponent(name)}?vdom=${this.vdom}`, group);
  }

  async deleteAddressGroup(name: string): Promise<void> {
    await this.proxyRequest('DELETE', `/cmdb/firewall/addrgrp/${encodeURIComponent(name)}?vdom=${this.vdom}`);
  }

  // Policy Management
  async getPolicies(): Promise<Policy[]> {
    const data = await this.proxyRequest('GET', `/cmdb/firewall/policy?vdom=${this.vdom}`);
    return data.results || [];
  }

  async getPolicy(policyid: number): Promise<Policy | null> {
    try {
      const data = await this.proxyRequest('GET', `/cmdb/firewall/policy/${policyid}?vdom=${this.vdom}`);
      return data.results?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  async createPolicy(policy: Policy): Promise<void> {
    await this.proxyRequest('POST', `/cmdb/firewall/policy?vdom=${this.vdom}`, policy);
  }

  async updatePolicy(policyid: number, policy: Policy): Promise<void> {
    await this.proxyRequest('PUT', `/cmdb/firewall/policy/${policyid}?vdom=${this.vdom}`, policy);
  }

  async deletePolicy(policyid: number): Promise<void> {
    await this.proxyRequest('DELETE', `/cmdb/firewall/policy/${policyid}?vdom=${this.vdom}`);
  }

  async movePolicy(policyid: number, action: 'before' | 'after', reference: number): Promise<void> {
    await this.proxyRequest('PUT', `/cmdb/firewall/policy/${policyid}?vdom=${this.vdom}&action=move&${action}=${reference}`);
  }

  // Service Management
  async getServices(): Promise<ServiceObject[]> {
    const data = await this.proxyRequest('GET', `/cmdb/firewall.service/custom?vdom=${this.vdom}`);
    return data.results || [];
  }

  async getService(name: string): Promise<ServiceObject | null> {
    try {
      const data = await this.proxyRequest('GET', `/cmdb/firewall.service/custom/${encodeURIComponent(name)}?vdom=${this.vdom}`);
      return data.results?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  async createService(service: ServiceObject): Promise<void> {
    await this.proxyRequest('POST', `/cmdb/firewall.service/custom?vdom=${this.vdom}`, service);
  }

  async updateService(name: string, service: ServiceObject): Promise<void> {
    await this.proxyRequest('PUT', `/cmdb/firewall.service/custom/${encodeURIComponent(name)}?vdom=${this.vdom}`, service);
  }

  async deleteService(name: string): Promise<void> {
    await this.proxyRequest('DELETE', `/cmdb/firewall.service/custom/${encodeURIComponent(name)}?vdom=${this.vdom}`);
  }

  // Interface Management
  async getInterfaces(): Promise<any[]> {
    const data = await this.proxyRequest('GET', `/cmdb/system/interface?vdom=${this.vdom}`);
    return data.results || [];
  }

  async getInterface(name: string): Promise<any | null> {
    try {
      const data = await this.proxyRequest('GET', `/cmdb/system/interface/${encodeURIComponent(name)}?vdom=${this.vdom}`);
      return data.results?.[0] || null;
    } catch (error) {
      return null;
    }
  }
}
