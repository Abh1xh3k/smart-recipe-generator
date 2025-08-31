'use client';

import IngredientForm from '../components/IngredientForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ScrollToTop from '../components/ScrollToTop';

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <ScrollToTop />

      {/* Sticky App Header */}
      <header className="sticky top-0 z-40 border-b border-white/30 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-pink-500 via-purple-600 to-blue-600" />
            <span className="text-lg font-semibold text-slate-800">Smart Recipe Generator</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" className="h-9 px-4 text-sm font-medium">Home</Button>
            </Link>
            <Link href="/saved">
              <Button variant="outline" className="h-9 px-4 text-sm font-medium">Saved</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Page Intro */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Generate Recipes
          </h1>
          <p className="mt-2 text-slate-700 max-w-2xl">
            Add ingredients, set preferences, and create tailored recipes. Fully responsive for mobile and desktop.
          </p>
        </div>
      </section>

      {/* Main Content Shell */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 lg:pb-12 pt-4">
        <IngredientForm />
      </main>
    </div>
  );
}


