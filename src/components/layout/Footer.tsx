import Link from 'next/link'
import styles from '@/styles/responsive.module.css'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 safe-area-bottom">
      <div className={`${styles.container} max-w-7xl mx-auto py-8 md:py-12`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM12 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg md:text-xl font-bold text-gray-900">Scan-ttendance</span>
            </div>
            <p className="text-gray-600 text-sm md:text-base max-w-md leading-relaxed">
              Modern QR code-based attendance tracking for events and organizations. 
              Streamline your attendance management with real-time verification and comprehensive reporting.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/features" 
                  className={`${styles.touchTarget} text-gray-600 hover:text-gray-900 text-sm md:text-base transition-colors duration-200 block py-1`}
                >
                  Features
                </Link>
              </li>
              <li>
                <Link 
                  href="/pricing" 
                  className={`${styles.touchTarget} text-gray-600 hover:text-gray-900 text-sm md:text-base transition-colors duration-200 block py-1`}
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link 
                  href="/docs" 
                  className={`${styles.touchTarget} text-gray-600 hover:text-gray-900 text-sm md:text-base transition-colors duration-200 block py-1`}
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/help" 
                  className={`${styles.touchTarget} text-gray-600 hover:text-gray-900 text-sm md:text-base transition-colors duration-200 block py-1`}
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className={`${styles.touchTarget} text-gray-600 hover:text-gray-900 text-sm md:text-base transition-colors duration-200 block py-1`}
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className={`${styles.touchTarget} text-gray-600 hover:text-gray-900 text-sm md:text-base transition-colors duration-200 block py-1`}
                >
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 md:pt-8 border-t border-gray-200">
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
            <div className="text-sm md:text-base text-gray-600 text-center md:text-left">
              © 2025 Scan-ttendance. Built with ❤️ for better attendance management.
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm md:text-base text-gray-600">
                Developed by{' '}
                <a 
                  href="https://github.com/yourusername" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${styles.touchTarget} text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200 inline-block py-1`}
                >
                  Your Name
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}