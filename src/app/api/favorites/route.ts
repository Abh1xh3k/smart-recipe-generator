import { NextRequest, NextResponse } from 'next/server'
import { dbConnect, Favorite } from '@/lib/db'
import { FavoriteDocument } from '@/app/types'

function getUserId(req: NextRequest): string {
  return req.headers.get('x-user-id') || 'demo-user'
}

export async function GET(req: NextRequest) {
  try { await dbConnect() } catch { return NextResponse.json({ ok: false, error: 'DB' }, { status: 500 }) }
  const userId = getUserId(req)
  try {
    const docs = await Favorite.find({ userId }).lean()
    const ids = docs.map(d => String(d.recipeId))
    return NextResponse.json({ ok: true, recipeIds: ids })
  } catch {
    return NextResponse.json({ ok: false, error: 'READ_FAILED' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try { await dbConnect() } catch { return NextResponse.json({ ok: false, error: 'DB' }, { status: 500 }) }
  const userId = getUserId(req)
  try {
    const body = await req.json()
    const { recipeId } = body || {}
    if (!recipeId) return NextResponse.json({ ok: false, error: 'VALIDATION' }, { status: 400 })
    await Favorite.findOneAndUpdate({ userId, recipeId }, { $set: { userId, recipeId } }, { upsert: true })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'WRITE_FAILED' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try { await dbConnect() } catch { return NextResponse.json({ ok: false, error: 'DB' }, { status: 500 }) }
  const userId = getUserId(req)
  const recipeId = req.nextUrl.searchParams.get('recipeId')
  if (!recipeId) return NextResponse.json({ ok: false, error: 'VALIDATION' }, { status: 400 })
  try {
    await Favorite.deleteOne({ userId, recipeId })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'DELETE_FAILED' }, { status: 500 })
  }
}


