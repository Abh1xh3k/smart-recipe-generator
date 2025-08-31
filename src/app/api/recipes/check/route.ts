import { NextRequest, NextResponse } from 'next/server'
import { dbConnect, Recipe } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: 'DB_CONNECTION_FAILED', message: errorMessage }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('recipeId')
    
    if (!recipeId) {
      return NextResponse.json({ ok: false, error: 'VALIDATION_ERROR', message: 'recipeId is required' }, { status: 400 })
    }

    // Check if recipe exists in database
    const recipe = await Recipe.findById(recipeId)
    const isSaved = !!recipe

    return NextResponse.json({ ok: true, isSaved })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: 'CHECK_FAILED', message: errorMessage }, { status: 500 })
  }
}
