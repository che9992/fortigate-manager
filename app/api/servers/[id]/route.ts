import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    await db.updateServer(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update server:', error);
    return NextResponse.json({ error: 'Failed to update server' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    await db.deleteServer(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete server:', error);
    return NextResponse.json({ error: 'Failed to delete server' }, { status: 500 });
  }
}
