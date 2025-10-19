import { Facebook, Instagram, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-orange-800 to-black text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          {/* Logo and Name */}
          <div className="flex items-center space-x-2">
            <Image
              height={150}
              width={150}
              src="/logo-transparent-white.png"
              alt="Logo"
              className="w-auto h-10 object-contain"
            />
          </div>

          {/* Navigation Links */}
          <nav className="space-x-4">
            <Link href="#" className="hover:underline">Home</Link>
            <Link href="#" className="hover:underline">Restaurants</Link>
            <Link href="#" className="hover:underline">Influencers</Link>
          </nav>

          {/* Social Media Links */}
          <div className="flex space-x-4">
            <a href="#" className="text-white hover:text-gray-300"><Facebook className="w-4 h-4" /></a>
            <a href="#" className="text-white hover:text-gray-300"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="text-white hover:text-gray-300"><Instagram className="w-4 h-4" /></a>
          </div>
        </div>

        {/* Copyright */} 
        <div className="text-center text-gray-400 text-sm">
          © 2025 Nomtok. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;