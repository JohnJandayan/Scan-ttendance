import AppLayout from '@/components/layout/AppLayout'

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              About Scan-ttendance
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Modern attendance tracking for the digital age
            </p>
          </div>
          
          <div className="prose prose-lg mx-auto">
            <p>
              Scan-ttendance is a modern, QR code-based attendance tracking application designed 
              to streamline attendance management for events, organizations, and educational institutions.
            </p>
            
            <h2>Our Mission</h2>
            <p>
              We believe that attendance tracking should be simple, accurate, and efficient. 
              Our mission is to provide organizations with the tools they need to manage attendance 
              seamlessly while maintaining data security and privacy.
            </p>
            
            <h2>Key Features</h2>
            <ul>
              <li>QR code-based attendance verification</li>
              <li>Real-time attendance tracking and analytics</li>
              <li>Multi-organization support with data isolation</li>
              <li>Mobile-optimized interface</li>
              <li>Comprehensive reporting and insights</li>
            </ul>
            
            <h2>Technology Stack</h2>
            <p>
              Built with modern web technologies including Next.js, TypeScript, Tailwind CSS, 
              and PostgreSQL on Supabase. Deployed on Vercel for optimal performance and scalability.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}