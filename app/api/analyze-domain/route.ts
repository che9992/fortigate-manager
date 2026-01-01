import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

interface DomainInfo {
  domain: string;
  type: 'main' | 'resource' | 'api' | 'cdn' | 'analytics';
  description?: string;
}

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const body = await request.text();
    let domain: string;

    try {
      const parsed = JSON.parse(body);
      domain = parsed.domain;
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body'
      }, { status: 400 });
    }

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Normalize domain
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const url = `https://${normalizedDomain}`;

    console.log(`[Domain Analyzer] Analyzing: ${url}`);

    const domains = new Set<string>();
    const domainInfo: { [key: string]: DomainInfo } = {};

    // Launch headless browser with serverless-compatible settings
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    // Capture all network requests
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      const reqUrl = req.url();
      try {
        const urlObj = new URL(reqUrl);
        const hostname = urlObj.hostname;

        if (hostname && !domains.has(hostname)) {
          domains.add(hostname);

          // Categorize domain
          let type: DomainInfo['type'] = 'resource';
          let description = '';

          if (hostname === normalizedDomain || hostname === `www.${normalizedDomain}`) {
            type = 'main';
            description = '메인 도메인';
          } else if (hostname.includes('cdn') || hostname.includes('static') || hostname.includes('assets')) {
            type = 'cdn';
            description = 'CDN / 정적 리소스';
          } else if (hostname.includes('api') || reqUrl.includes('/api/')) {
            type = 'api';
            description = 'API 엔드포인트';
          } else if (
            hostname.includes('analytics') ||
            hostname.includes('google-analytics') ||
            hostname.includes('gtag') ||
            hostname.includes('tracking')
          ) {
            type = 'analytics';
            description = '분석 / 추적';
          } else {
            description = '서드파티 리소스';
          }

          domainInfo[hostname] = { domain: hostname, type, description };
        }
      } catch (error) {
        // Invalid URL, skip
      }

      req.continue();
    });

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait a bit more to catch lazy-loaded resources using delay helper
    await delay(2000);

    await browser.close();
    browser = null;

    // Convert to array and sort
    const sortedDomains = Array.from(domains)
      .map(d => domainInfo[d])
      .sort((a, b) => {
        // Sort order: main, resource, api, cdn, analytics
        const order = { main: 0, resource: 1, api: 2, cdn: 3, analytics: 4 };
        return order[a.type] - order[b.type];
      });

    console.log(`[Domain Analyzer] Found ${sortedDomains.length} domains`);

    return NextResponse.json({
      success: true,
      domains: sortedDomains,
      count: sortedDomains.length,
    });
  } catch (error: any) {
    console.error('[Domain Analyzer] Error:', error.message);

    // Clean up browser if still open
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Domain analysis failed',
    }, { status: 500 });
  }
}
