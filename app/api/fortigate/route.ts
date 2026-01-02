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
    console.error('[FortiGate Proxy] Error details:', error.response?.data);

    if (axios.isAxiosError(error)) {
      const fortigateError = error.response?.data;
      const status = error.response?.status || 500;

      // Check for specific FortiGate errors
      let errorMessage = error.message;

      // Handle duplicate entry errors
      if (fortigateError?.error_description?.includes('already exist') ||
          fortigateError?.error_description?.includes('duplicate') ||
          status === 424) {
        errorMessage = '이미 존재하는 항목입니다';
      }
      // Handle invalid reference errors
      else if (fortigateError?.error_description?.includes('referenced') ||
               fortigateError?.error_description?.includes('invalid')) {
        errorMessage = fortigateError.error_description || '잘못된 참조입니다';
      }
      // Use FortiGate's error description if available
      else if (fortigateError?.error_description) {
        errorMessage = fortigateError.error_description;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        status: status,
        fortigateResponse: fortigateError,
        details: {
          message: error.message,
          code: error.code,
          config: {
            url: error.config?.url,
            method: error.config?.method,
          }
        }
      }, { status: status });
    }

    return NextResponse.json({
      success: false,
      error: error.message,
      status: 500,
    }, { status: 500 });
  }
}
