'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowUpRight } from 'lucide-react'
import toast from 'react-hot-toast'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type RegisterInput = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Registration failed')
        return
      }

      toast.success('Account created! Signing you in...')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      <div className="border-b hairline pb-8">
        <p className="font-mono-label text-accent mb-3">Create Account</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Start your story.
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Start building your perfect resume today
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="font-mono-label block">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            className="w-full h-12 px-4 bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="font-mono-label block">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full h-12 px-4 bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="font-mono-label block">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Min 8 characters"
            className="w-full h-12 px-4 bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-destructive text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-primary text-primary-foreground font-mono-label hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account <ArrowUpRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-foreground font-medium border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}