import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ScrollToTop from './components/ScrollToTop';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <ScrollToTop />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <header className="text-center py-16 sm:py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-4 tracking-tight">Smart Recipe Generator</h1>
            <p className="text-xl sm:text-2xl text-slate-600 leading-relaxed max-w-3xl mx-auto font-normal mb-6">Discover delicious recipes based on your ingredients and dietary preferences</p>
          </div>
        </header>

        {/* Navigation to routes */}
        <main className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-10 lg:p-12 mb-16">
          <div className="flex flex-col items-center gap-3">
            <Link href="/generate"><Button className="w-full max-w-md">Go to Generate</Button></Link>
            <Link href="/saved"><Button variant="outline" className="w-full max-w-md">View Saved Recipes</Button></Link>
          </div>
        </main>

        {/* Enhanced Footer with more vibrant styling */}
        <footer className="text-center py-12">
          <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm">
            <p className="text-slate-600 text-base">Powered by AI • Generate personalized recipes in seconds</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
