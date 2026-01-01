import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { FortigateServer } from '@/types';

const initialServers: FortigateServer[] = [
  {
    id: '1',
    name: '남학생',
    host: '220.72.109.65',
    vdom: 'root',
    apiKey: '734hcG9n4c6b858krpy0tdbmhjr5j7',
    enabled: true,
  },
  {
    id: '2',
    name: '여학생',
    host: '211.104.30.81',
    vdom: 'root',
    apiKey: 'f9h1q86cNmktzNN530npntN8mjrr3y',
    enabled: true,
  },
  {
    id: '3',
    name: '대치',
    host: '121.134.123.193',
    vdom: 'root',
    apiKey: 'b93xsfm331phcdcNG4n9pd3m98r4zw',
    enabled: true,
  },
];

export async function POST() {
  try {
    const existingServers = await db.getServers();

    if (existingServers.length > 0) {
      return NextResponse.json({
        success: false,
        message: `이미 ${existingServers.length}개의 서버가 등록되어 있습니다.`,
        servers: existingServers,
      });
    }

    await db.saveServers(initialServers);

    return NextResponse.json({
      success: true,
      message: `${initialServers.length}개의 서버가 등록되었습니다.`,
      servers: initialServers,
    });
  } catch (error) {
    console.error('Failed to initialize servers:', error);
    return NextResponse.json(
      { error: 'Failed to initialize servers' },
      { status: 500 }
    );
  }
}
