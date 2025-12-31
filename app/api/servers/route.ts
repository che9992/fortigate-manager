import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const servers = db.getServers();
    return NextResponse.json(servers);
  } catch (error) {
    console.error('Failed to get servers:', error);
    return NextResponse.json({ error: 'Failed to get servers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const server = await request.json();
    db.addServer(server);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add server:', error);
    return NextResponse.json({ error: 'Failed to add server' }, { status: 500 });
  }
}
