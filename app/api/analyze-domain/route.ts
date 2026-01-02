import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

interface DomainInfo {
  domain: string;
  type: 'main' | 'resource' | 'api' | 'cdn' | 'analytics';
  description?: string;
}

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if running locally or on Vercel
const isLocal = process.env.NODE_ENV !== 'production' || !process.env.VERCEL;

// Remote chromium URL for Vercel serverless
const CHROMIUM_URL = 'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar';

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
      return NextResponse.json({
        success: false,
        error: 'Domain is required'
      }, { status: 400 });
    }

    // Normalize domain
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    console.log(`[Domain Analyzer] Starting analysis for: ${normalizedDomain}`);

    const domains = new Set<string>();
    const domainInfo: { [key: string]: DomainInfo } = {};

    // Get executable path from remote URL
    console.log('[Domain Analyzer] Loading Chromium...');
    console.log('[Domain Analyzer] Environment:', { isLocal, NODE_ENV: process.env.NODE_ENV, VERCEL: process.env.VERCEL });

    let executablePath: string;
    try {
      executablePath = await chromium.executablePath(CHROMIUM_URL);
      console.log('[Domain Analyzer] Chromium path:', executablePath);
    } catch (error: any) {
      console.error('[Domain Analyzer] Failed to get Chromium path:', error.message);
      throw new Error(`Chromium setup failed: ${error.message}`);
    }

    // Launch headless browser with serverless-compatible settings
    console.log('[Domain Analyzer] Launching browser...');
    const launchOptions = {
      args: chromium.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: true,
    };

    console.log('[Domain Analyzer] Launch args count:', chromium.args.length);

    try {
      browser = await puppeteer.launch(launchOptions);
      console.log('[Domain Analyzer] Browser launched successfully');
    } catch (error: any) {
      console.error('[Domain Analyzer] Failed to launch browser:', error.message);
      throw new Error(`Browser launch failed: ${error.message}`);
    }

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

    // Try HTTPS first, fallback to HTTP
    let success = false;
    const urls = [`https://${normalizedDomain}`, `http://${normalizedDomain}`];

    for (const url of urls) {
      try {
        console.log(`[Domain Analyzer] Navigating to: ${url}`);
        await page.goto(url, {
          waitUntil: 'domcontentloaded', // Changed from networkidle2 for faster loading
          timeout: 45000, // Increased timeout
        });
        console.log(`[Domain Analyzer] Successfully loaded ${url}`);
        success = true;

        // Wait a bit for dynamic content and network requests
        console.log('[Domain Analyzer] Waiting for additional resources...');
        await delay(3000); // Increased wait time for lazy-loaded resources

        break;
      } catch (error: any) {
        console.error(`[Domain Analyzer] Failed to load ${url}:`, error.message);
        if (url === urls[urls.length - 1]) {
          throw new Error(`Cannot load domain: ${error.message}`);
        }
      }
    }

    if (!success) {
      throw new Error('Failed to load the domain with both HTTPS and HTTP');
    }

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
    console.error('[Domain Analyzer] Error:', error.message, error.stack);

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
