"use client";

export function BlogHero() {
  return (
    <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20 rounded-lg bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-cream">
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
          Our Blog
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover stories, insights, and guides about the world&apos;s best restaurants and food culture
        </p>
      </div>
    </div>
  );
}
