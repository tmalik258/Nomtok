'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Home, Users, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="bg-black/40 backdrop-blur-lg shadow-xl rounded-xl fixed top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-[10000] p-3 md:p-4">
      <div className="max-w-6xl mx-auto px-2 md:px-4 py-0">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-1.5 md:gap-2 text-lg md:text-2xl font-bold text-slate-300 tracking-tight hover:text-slate-200 transition-colors"
            onClick={closeMobileMenu}
          >
            <Image
              height={150}
              width={150}
              src="/logo-2.2-transparent-dark.png"
              alt="Logo"
              className="w-auto h-7 object-contain"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2 text-slate-300">
            <Button
              asChild
              variant="ghost"
              className={cn(
                'flex items-center gap-2 cursor-pointer hover:bg-cream/30 hover:text-cream',
                isActive('/') && 'bg-cream/30 text-cream'
              )}
            >
              <Link href="/" aria-current={isActive('/') ? 'page' : undefined}>
                <Home className="w-4 h-4" />
                Home
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className={cn(
                'flex items-center gap-2 cursor-pointer hover:bg-cream/30 hover:text-cream',
                isActive('/restaurants') && 'bg-cream/30 text-cream'
              )}
            >
              <Link
                href="/restaurants"
                aria-current={isActive('/restaurants') ? 'page' : undefined}
              >
                <MapPin className="w-4 h-4" />
                Restaurants
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className={cn(
                'flex items-center gap-2 cursor-pointer hover:bg-cream/30 hover:text-cream',
                isActive('/influencers') && 'bg-cream/30 text-cream'
              )}
            >
              <Link
                href="/influencers"
                aria-current={isActive('/influencers') ? 'page' : undefined}
              >
                <Users className="w-4 h-4" />
                Influencers
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-slate-300 hover:text-slate-200 p-2"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-600/30">
            <div className="flex flex-col space-y-2">
              <Button
                asChild
                variant="ghost"
                className={cn(
                  'flex items-center gap-3 justify-start text-slate-300 hover:text-slate-200 hover:bg-orange-500/30 p-3 rounded-lg cursor-pointer',
                  isActive('/') && 'bg-cream text-slate-200'
                )}
                onClick={closeMobileMenu}
              >
                <Link href="/" aria-current={isActive('/') ? 'page' : undefined}>
                  <Home className="w-4 h-4" />
                  Home
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className={cn(
                  'flex items-center gap-3 justify-start text-slate-300 hover:text-slate-200 hover:bg-orange-500/30 p-3 rounded-lg cursor-pointer',
                  isActive('/restaurants') && 'bg-slate-700/30 text-slate-200'
                )}
                onClick={closeMobileMenu}
              >
                <Link
                  href="/restaurants"
                  aria-current={isActive('/restaurants') ? 'page' : undefined}
                >
                  <MapPin className="w-4 h-4" />
                  Restaurants
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className={cn(
                  'flex items-center gap-3 justify-start text-slate-300 hover:text-slate-200 hover:bg-cream/30 p-3 rounded-lg cursor-pointer',
                  isActive('/influencers') && 'bg-cream text-slate-200'
                )}
                onClick={closeMobileMenu}
              >
                <Link
                  href="/influencers"
                  aria-current={isActive('/influencers') ? 'page' : undefined}
                >
                  <Users className="w-4 h-4" />
                  Influencers
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
