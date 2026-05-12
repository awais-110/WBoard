'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <nav className="fixed w-full top-0 z-50 bg-gradient-to-b from-black via-black to-transparent backdrop-blur-sm border-b border-the-mint/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-the-mint to-the-mint/60 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <span className="text-ice-latte font-bold text-lg">I</span>
            </div>
            <span className="text-xl font-bold text-ice-latte hidden sm:inline-block">
              IdeaSpace
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-ice-latte/80 hover:text-the-mint transition-colors duration-300 text-sm font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-ice-latte hover:text-the-mint transition-colors duration-300 text-sm font-medium hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 bg-gradient-to-r from-the-mint to-the-mint/80 text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-the-mint/50 transition-all duration-300 text-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-ice-latte hover:text-the-mint transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-the-mint/10">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block py-3 text-ice-latte/80 hover:text-the-mint transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="flex gap-2 pt-4">
              <Link
                href="/login"
                className="flex-1 py-2 text-center text-ice-latte border border-ice-latte/30 rounded-lg hover:border-the-mint transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex-1 py-2 text-center bg-gradient-to-r from-the-mint to-the-mint/80 text-black rounded-lg font-semibold text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
