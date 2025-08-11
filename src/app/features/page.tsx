import AppLayout from '@/components/layout/AppLayout'

export default function FeaturesPage() {
  return (
    <AppLayout>
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Features
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Discover all the powerful features of Scan-ttendance
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">QR Code Scanning</h3>
              <p className="text-gray-600">
                Fast and accurate attendance verification using device cameras. Works on all modern browsers and devices.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Real-time Analytics</h3>
              <p className="text-gray-600">
                Live attendance statistics and comprehensive reporting. Monitor attendance patterns and generate insights.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Multi-Organization</h3>
              <p className="text-gray-600">
                Secure data isolation for multiple organizations. Each organization has its own dedicated workspace.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}