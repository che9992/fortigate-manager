import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

export async function POST(request: NextRequest) {
  try {
    const { host, apiKey, vdom, command } = await request.json();

    if (!host || !apiKey || !command) {
      return NextResponse.json({
        success: false,
        error: 'Host, API key, and command are required'
      }, { status: 400 });
    }

    // FortiGate CLI endpoint
    const url = `https://${host}/api/v2/monitor/system/cli`;

    console.log(`[FortiGate CLI] Executing on ${host}: ${command}`);

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const response = await axios({
      method: 'POST',
      url,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        vdom: vdom || 'root',
        command: command,
      },
      httpsAgent,
      timeout: 30000,
    });

    console.log(`[FortiGate CLI] Success on ${host}`);

    return NextResponse.json({
      success: true,
      output: response.data?.results || JSON.stringify(response.data, null, 2),
    });
  } catch (error: any) {
    console.error('[FortiGate CLI] Error:', error.message);

    if (axios.isAxiosError(error)) {
      const fortigateError = error.response?.data;
      const errorMessage = fortigateError?.error_description || error.message;

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: fortigateError,
      }, { status: error.response?.status || 500 });
    }

    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
