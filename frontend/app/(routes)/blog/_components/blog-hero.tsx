"use client";

export function BlogHero() {
  return (
    <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20 rounded-lg bg-gradient-to-br from-slate-600/30 via-slate-500/20 to-cream">
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900 drop-shadow-lg">
          Our Blog
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 mb-8 max-w-2xl mx-auto drop-shadow-md">
          Discover stories, insights, and guides about the world&apos;s best restaurants and food culture
        </p>
      </div>
    </div>
  );
}
