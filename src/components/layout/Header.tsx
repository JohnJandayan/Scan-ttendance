'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import styles from '@/styles/responsive.module.css'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && isMobile) {
        const target = event.target as Element
        if (!target.closest('header')) {
          setIsMenuOpen(false)
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMenuOpen, isMobile])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen, isMobile])

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 safe-area-top relative z-40">
      <div className={`${styles.container} max-w-7xl mx-auto`}>
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center touch-manipulation">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM12 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg md:text-xl font-bold text-gray-900 truncate">
                Scan-ttendance
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-gray-50"
            >
              Home
            </Link>
            <Link 
              href="/features" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-gray-50"
            >
              Features
            </Link>
            <Link 
              href="/about" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-gray-50"
            >
              About
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/auth/signin" 
              className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-gray-50"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`${styles.touchTarget} flex items-center justify-center text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md transition-colors duration-200`}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-2 pt-2 pb-4 space-y-1 border-t border-gray-200 bg-white">
            <Link 
              href="/" 
              className={`${styles.touchTarget} text-gray-600 hover:text-gray-900 hover:bg-gray-50 block px-4 py-3 text-base font-medium rounded-md transition-colors duration-200`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/features" 
              className={`${styles.touchTarget} text-gray-600 hover:text-gray-900 hover:bg-gray-50 block px-4 py-3 text-base font-medium rounded-md transition-colors duration-200`}
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/about" 
              className={`${styles.touchTarget} text-gray-600 hover:text-gray-900 hover:bg-gray-50 block px-4 py-3 text-base font-medium rounded-md transition-colors duration-200`}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-4 pb-2 border-t border-gray-200 space-y-2">
              <Link 
                href="/auth/signin" 
                className={`${styles.touchTarget} text-gray-600 hover:text-gray-900 hover:bg-gray-50 block px-4 py-3 text-base font-medium rounded-md transition-colors duration-200`}
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className={`${styles.touchButton} bg-indigo-600 hover:bg-indigo-700 text-white block px-4 py-3 rounded-md text-base font-medium transition-all duration-200 text-center shadow-sm hover:shadow-md`}
                onClick={() => setIsMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  )
}