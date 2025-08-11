import AppLayout from '@/components/layout/AppLayout'
import SignUpForm from '@/components/auth/SignUpForm'

export default function SignUpPage() {
  return (
    <AppLayout showFooter={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <SignUpForm />
      </div>
    </AppLayout>
  )
}