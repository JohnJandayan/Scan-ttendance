import AppLayout from '@/components/layout/AppLayout'
import SignInForm from '@/components/auth/SignInForm'

export default function SignInPage() {
  return (
    <AppLayout showFooter={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <SignInForm />
      </div>
    </AppLayout>
  )
}