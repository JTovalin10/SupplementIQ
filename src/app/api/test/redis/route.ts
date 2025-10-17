import { getRedisTCP } from '@/../../Database/Redis/client';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/test/redis
// Performs a simple set/get roundtrip to verify Redis TCP connectivity
export async function GET(_req: NextRequest) {
  try {
    const redis = getRedisTCP();
    if (!redis.isOpen) await redis.connect();
    await redis.set('foo', 'bar');
    const value = await redis.get('foo');
    return NextResponse.json({ ok: true, value });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}


