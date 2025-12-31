import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

export async function POST(request: NextRequest) {
  try {
    const { host, apiKey, vdom, method, endpoint, data } = await request.json();

    if (!host || !apiKey) {
      return NextResponse.json({ error: 'Host and API key are required' }, { status: 400 });
    }

    const url = `https://${host}/api/v2${endpoint}`;

    console.log(`[FortiGate Proxy] ${method} ${url}`);

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // FortiGate often uses self-signed certs
    });

    const config: any = {
      method: method || 'GET',
      url,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      httpsAgent,
      timeout: 30000,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }

    const response = await axios(config);

    console.log(`[FortiGate Proxy] Success: ${response.status}`);

    return NextResponse.json({
      success: true,
      data: response.data,
      status: response.status,
    });
  } catch (error: any) {
    console.error('[FortiGate Proxy] Error:', error.message);

    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        success: false,
        error: error.message,
        status: error.response?.status || 500,
        data: error.response?.data,
        details: {
          message: error.message,
          code: error.code,
          config: {
            url: error.config?.url,
            method: error.config?.method,
          }
        }
      }, { status: error.response?.status || 500 });
    }

    return NextResponse.json({
      success: false,
      error: error.message,
      status: 500,
    }, { status: 500 });
  }
}
