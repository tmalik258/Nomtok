'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Home, Users, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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
              src="/logo-transparent-white.png"
              alt="Logo"
              className="w-auto h-10 object-contain"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2 text-slate-300">
            <Button asChild variant="ghost" className="flex items-center gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                Home
              </Link>
            </Button>
            <Button asChild variant="ghost" className="flex items-center gap-2">
              <Link href="/restaurants">
                <MapPin className="w-4 h-4" />
                Restaurants
              </Link>
            </Button>
            <Button asChild variant="ghost" className="flex items-center gap-2">
              <Link href="/influencers">
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
                className="flex items-center gap-3 justify-start text-slate-300 hover:text-slate-200 hover:bg-slate-700/30 p-3 rounded-lg"
                onClick={closeMobileMenu}
              >
                <Link href="/">
                  <Home className="w-4 h-4" />
                  Home
                </Link>
              </Button>
              <Button 
                asChild 
                variant="ghost" 
                className="flex items-center gap-3 justify-start text-slate-300 hover:text-slate-200 hover:bg-slate-700/30 p-3 rounded-lg"
                onClick={closeMobileMenu}
              >
                <Link href="/restaurants">
                  <MapPin className="w-4 h-4" />
                  Restaurants
                </Link>
              </Button>
              <Button 
                asChild 
                variant="ghost" 
                className="flex items-center gap-3 justify-start text-slate-300 hover:text-slate-200 hover:bg-slate-700/30 p-3 rounded-lg"
                onClick={closeMobileMenu}
              >
                <Link href="/influencers">
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