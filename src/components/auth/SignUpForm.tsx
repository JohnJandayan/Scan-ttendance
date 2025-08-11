'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import styles from '@/styles/responsive.module.css'

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpFormData = z.infer<typeof signUpSchema>

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema)
  })

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          organizationName: data.organizationName,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Registration failed')
      }

      setSuccess(true)
      reset()
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Registration Successful!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your organization has been created. Redirecting to dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full space-y-6 md:space-y-8">
      <div className="text-center">
        <h2 className={`${styles.responsiveHeading} font-extrabold text-gray-900`}>
          Create your organization
        </h2>
        <p className="mt-2 text-sm md:text-base text-gray-600">
          Or{' '}
          <Link 
            href="/auth/signin" 
            className={`${styles.touchTarget} font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200 inline-block py-1`}
          >
            sign in to existing account
          </Link>
        </p>
      </div>

      <form className={`${styles.mobileForm} mt-6 md:mt-8`} onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Registration Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 md:space-y-5">
          <div className={styles.mobileFormField}>
            <label htmlFor="name" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              {...register('name')}
              id="name"
              type="text"
              autoComplete="name"
              className={`${styles.mobileInput} ${
                errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className={styles.mobileFormField}>
            <label htmlFor="email" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              className={`${styles.mobileInput} ${
                errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className={styles.mobileFormField}>
            <label htmlFor="organizationName" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Organization Name
            </label>
            <input
              {...register('organizationName')}
              id="organizationName"
              type="text"
              className={`${styles.mobileInput} ${
                errors.organizationName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="Enter your organization name"
            />
            {errors.organizationName && (
              <p className="mt-2 text-sm text-red-600">{errors.organizationName.message}</p>
            )}
          </div>

          <div className={styles.mobileFormField}>
            <label htmlFor="password" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              {...register('password')}
              id="password"
              type="password"
              autoComplete="new-password"
              className={`${styles.mobileInput} ${
                errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className={styles.mobileFormField}>
            <label htmlFor="confirmPassword" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              {...register('confirmPassword')}
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={`${styles.mobileInput} ${
                errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`${styles.touchButton} group relative w-full flex justify-center border border-transparent font-medium rounded-lg text-white shadow-sm hover:shadow-md transition-all duration-200 ${
              isLoading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </div>
            ) : (
              'Create Organization'
            )}
          </button>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </form>
    </div>
  )
}