import axios, { AxiosInstance } from 'axios';
import type { Address, AddressGroup, Policy, ServiceObject } from '@/types';

export class FortigateClient {
  private client: AxiosInstance;
  private vdom: string;

  constructor(host: string, apiKey: string, vdom: string = 'root') {
    this.vdom = vdom;
    this.client = axios.create({
      baseURL: `https://${host}/api/v2`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false, // FortiGate often uses self-signed certs
      }),
      timeout: 30000,
    });
  }

  // System Status
  async getSystemStatus() {
    const response = await this.client.get('/monitor/system/status');
    return response.data;
  }

  // Address Management
  async getAddresses(): Promise<Address[]> {
    const response = await this.client.get(
      `/cmdb/firewall/address?vdom=${this.vdom}`
    );
    return response.data.results || [];
  }

  async getAddress(name: string): Promise<Address | null> {
    try {
      const response = await this.client.get(
        `/cmdb/firewall/address/${encodeURIComponent(name)}?vdom=${this.vdom}`
      );
      return response.data.results?.[0] || null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createAddress(address: Address): Promise<void> {
    await this.client.post(
      `/cmdb/firewall/address?vdom=${this.vdom}`,
      address
    );
  }

  async updateAddress(name: string, address: Address): Promise<void> {
    await this.client.put(
      `/cmdb/firewall/address/${encodeURIComponent(name)}?vdom=${this.vdom}`,
      address
    );
  }

  async deleteAddress(name: string): Promise<void> {
    await this.client.delete(
      `/cmdb/firewall/address/${encodeURIComponent(name)}?vdom=${this.vdom}`
    );
  }

  // Address Group Management
  async getAddressGroups(): Promise<AddressGroup[]> {
    const response = await this.client.get(
      `/cmdb/firewall/addrgrp?vdom=${this.vdom}`
    );
    return response.data.results || [];
  }

  async getAddressGroup(name: string): Promise<AddressGroup | null> {
    try {
      const response = await this.client.get(
        `/cmdb/firewall/addrgrp/${encodeURIComponent(name)}?vdom=${this.vdom}`
      );
      return response.data.results?.[0] || null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createAddressGroup(group: AddressGroup): Promise<void> {
    await this.client.post(
      `/cmdb/firewall/addrgrp?vdom=${this.vdom}`,
      group
    );
  }

  async updateAddressGroup(name: string, group: AddressGroup): Promise<void> {
    await this.client.put(
      `/cmdb/firewall/addrgrp/${encodeURIComponent(name)}?vdom=${this.vdom}`,
      group
    );
  }

  async deleteAddressGroup(name: string): Promise<void> {
    await this.client.delete(
      `/cmdb/firewall/addrgrp/${encodeURIComponent(name)}?vdom=${this.vdom}`
    );
  }

  // Policy Management
  async getPolicies(): Promise<Policy[]> {
    const response = await this.client.get(
      `/cmdb/firewall/policy?vdom=${this.vdom}`
    );
    return response.data.results || [];
  }

  async getPolicy(policyId: number): Promise<Policy | null> {
    try {
      const response = await this.client.get(
        `/cmdb/firewall/policy/${policyId}?vdom=${this.vdom}`
      );
      return response.data.results?.[0] || null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createPolicy(policy: Policy): Promise<void> {
    await this.client.post(
      `/cmdb/firewall/policy?vdom=${this.vdom}`,
      policy
    );
  }

  async updatePolicy(policyId: number, policy: Policy): Promise<void> {
    await this.client.put(
      `/cmdb/firewall/policy/${policyId}?vdom=${this.vdom}`,
      policy
    );
  }

  async deletePolicy(policyId: number): Promise<void> {
    await this.client.delete(
      `/cmdb/firewall/policy/${policyId}?vdom=${this.vdom}`
    );
  }

  // Service Object Management
  async getServices(): Promise<ServiceObject[]> {
    const response = await this.client.get(
      `/cmdb/firewall.service/custom?vdom=${this.vdom}`
    );
    return response.data.results || [];
  }

  async createService(service: ServiceObject): Promise<void> {
    await this.client.post(
      `/cmdb/firewall.service/custom?vdom=${this.vdom}`,
      service
    );
  }

  async deleteService(name: string): Promise<void> {
    await this.client.delete(
      `/cmdb/firewall.service/custom/${encodeURIComponent(name)}?vdom=${this.vdom}`
    );
  }

  // Interfaces
  async getInterfaces(): Promise<any[]> {
    const response = await this.client.get(
      `/cmdb/system/interface?vdom=${this.vdom}`
    );
    return response.data.results || [];
  }
}
