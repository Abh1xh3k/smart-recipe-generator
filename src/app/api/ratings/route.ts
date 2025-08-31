import { NextRequest, NextResponse } from 'next/server'
import { dbConnect, Rating, Recipe } from '@/lib/db'
import { RatingDocument } from '@/app/types'

// TEMP auth: derive userId from header or fallback
function getUserId(req: NextRequest): string {
  return req.headers.get('x-user-id') || 'demo-user'
}

export async function GET(req: NextRequest) {
  try { await dbConnect() } catch (_: unknown) { return NextResponse.json({ ok: false, error: 'DB' }, { status: 500 }) }
  const recipeId = req.nextUrl.searchParams.get('recipeId')
  if (!recipeId) return NextResponse.json({ ok: false, error: 'MISSING_RECIPE' }, { status: 400 })
  const userId = getUserId(req)
  try {
    const doc = await Rating.findOne({ userId, recipeId }).lean()
    // Use type assertion to tell TypeScript that doc has a rating property
    return NextResponse.json({ ok: true, rating: doc ? (doc as any).rating : null })
  } catch (_: unknown) {
    return NextResponse.json({ ok: false, error: 'READ_FAILED' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try { await dbConnect() } catch (_: unknown) { return NextResponse.json({ ok: false, error: 'DB' }, { status: 500 }) }
  const userId = getUserId(req)
  try {
    const body = await req.json()
    const { recipeId, rating } = body || {}
    if (!recipeId || typeof rating !== 'number') {
      return NextResponse.json({ ok: false, error: 'VALIDATION' }, { status: 400 })
    }
    await Rating.findOneAndUpdate(
      { userId, recipeId },
      { $set: { rating } },
      { upsert: true, new: true }
    )
    // Aggregate to compute average and count
    const agg = await Rating.aggregate([
      { $match: { recipeId: recipeId } },
      { $group: { _id: '$recipeId', count: { $sum: 1 }, sum: { $sum: '$rating' } } },
      { $project: { _id: 0, count: 1, sum: 1, avg: { $divide: ['$sum', '$count'] } } },
    ])
    if (agg[0]) {
      await Recipe.findByIdAndUpdate(recipeId, { $set: { avgRating: agg[0].avg, ratingsCount: agg[0].count } })
    }
    return NextResponse.json({ ok: true })
  } catch (_: unknown) {
    return NextResponse.json({ ok: false, error: 'WRITE_FAILED' }, { status: 500 })
  }
}


