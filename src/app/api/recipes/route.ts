import { NextResponse, NextRequest } from 'next/server'
import { dbConnect, Recipe } from '@/lib/db'

const SEED_RECIPES = [
  { name: 'Margherita Pizza', cuisine: 'Italian', ingredients: ['Pizza dough', 'Tomato sauce', 'Mozzarella', 'Basil', 'Olive oil', 'Salt'], instructions: ['Preheat oven to 250°C/480°F', 'Spread sauce on dough', 'Top with mozzarella', 'Bake 7-10 min until bubbly', 'Finish with basil and olive oil'], nutrition: { calories: 280, protein: 12, fat: 9, carbs: 36 }, tags: ['Vegetarian'], difficulty: 'Medium', time: '30 minutes' },
]

export async function GET() {
  try {
    await dbConnect()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: 'DB_CONNECTION_FAILED', message: errorMessage }, { status: 500 })
  }

  try {
    const count = await Recipe.estimatedDocumentCount()
    if (count === 0) {
      await Recipe.insertMany(SEED_RECIPES)
    }
  } catch (err) {
    console.error('Seeding error:', err)
  }

  try {
    const recipes = await Recipe.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ ok: true, count: recipes.length, recipes }, { status: 200 })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: 'FETCH_FAILED', message: errorMessage }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: 'DB_CONNECTION_FAILED', message: errorMessage }, { status: 500 })
  }

  try {
    const body = await request.json()
    if (!body?.name) {
      return NextResponse.json({ ok: false, error: 'VALIDATION_ERROR', message: 'name is required' }, { status: 400 })
    }

    const doc = await Recipe.create({
      name: body.name,
      ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
      instructions: Array.isArray(body.instructions) ? body.instructions : [],
      nutrition: body.nutrition || {},
      cuisine: body.cuisine,
      tags: Array.isArray(body.tags) ? body.tags : [],
      difficulty: body.difficulty,
      time: body.time,
    })

    return NextResponse.json({ ok: true, recipe: doc }, { status: 201 })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: 'CREATE_FAILED', message: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: 'DB_CONNECTION_FAILED', message: errorMessage }, { status: 500 })
  }

  const id = request.nextUrl.searchParams.get('id')
  const all = request.nextUrl.searchParams.get('all')
  if (!id && all !== 'true') {
    return NextResponse.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Provide id or all=true' }, { status: 400 })
  }

  try {
    if (all === 'true') {
      await Recipe.deleteMany({})
      return NextResponse.json({ ok: true, deletedAll: true }, { status: 200 })
    } else {
      const result = await Recipe.findByIdAndDelete(id)
      if (!result) {
        return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 })
      }
      return NextResponse.json({ ok: true }, { status: 200 })
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: 'DELETE_FAILED', message: errorMessage }, { status: 500 })
  }
}


