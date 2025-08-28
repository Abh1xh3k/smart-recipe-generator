'use client';

import IngredientForm from '../components/IngredientForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ScrollToTop from '../components/ScrollToTop';

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <ScrollToTop />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Generate Recipes</h1>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">Home</Button>
            </Link>
            <Link href="/saved">
              <Button variant="outline">Saved</Button>
            </Link>
          </div>
        </div>
        <IngredientForm />
      </div>
    </div>
  );
}


