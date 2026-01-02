import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

const BLACKLIST_KEY = 'domain_blacklist';

export async function GET() {
  try {
    if (!redis) {
      return NextResponse.json({
        blacklist: ['facebook', 'twitter', 'instagram', 'tiktok', 'snapchat']
      });
    }

    const blacklist = await redis.get<string[]>(BLACKLIST_KEY);
    return NextResponse.json({
      blacklist: blacklist || ['facebook', 'twitter', 'instagram', 'tiktok', 'snapchat']
    });
  } catch (error: any) {
    console.error('[Blacklist] GET Error:', error.message);
    return NextResponse.json({
      blacklist: ['facebook', 'twitter', 'instagram', 'tiktok', 'snapchat']
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { blacklist } = await request.json();

    if (!Array.isArray(blacklist)) {
      return NextResponse.json(
        { error: 'Blacklist must be an array' },
        { status: 400 }
      );
    }

    if (!redis) {
      console.warn('[Blacklist] Redis not configured, blacklist not persisted');
      return NextResponse.json({ success: true });
    }

    await redis.set(BLACKLIST_KEY, blacklist);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Blacklist] POST Error:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
