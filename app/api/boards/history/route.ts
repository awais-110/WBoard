'use server'

import { NextResponse } from 'next/server'

export async function GET() {
  // Skeleton: return empty history or sample snapshots
  const sample = [
    { name: 'Initial', created_at: new Date().toISOString(), json: null },
  ]

  return NextResponse.json(sample)
}
