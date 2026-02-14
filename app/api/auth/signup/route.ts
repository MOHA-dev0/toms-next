
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Public signup is disabled. Please contact an administrator for an invitation.' }, { status: 403 });
}
