'use server'

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    // Skeleton: echo the prompt with a fake response
    const output = `AI mock response for prompt: ${prompt}`
    return NextResponse.json({ output })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
