import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const logs = db.getAuditLogs();
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return NextResponse.json({ error: 'Failed to get audit logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const log = await request.json();
    db.addAuditLog(log);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add audit log:', error);
    return NextResponse.json({ error: 'Failed to add audit log' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    db.clearAuditLogs();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear audit logs:', error);
    return NextResponse.json({ error: 'Failed to clear audit logs' }, { status: 500 });
  }
}
