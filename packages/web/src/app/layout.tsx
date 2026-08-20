import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ResumeForge AI',
  description: 'Build ATS-optimized, professionally formatted resumes with AI-powered insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="dark">
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(235, 18%, 12%)',
              color: 'hsl(240, 6%, 94%)',
              border: '1px solid hsl(235, 14%, 18%)',
              borderRadius: '0.625rem',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: {
                primary: 'hsl(160, 84%, 45%)',
                secondary: 'hsl(0, 0%, 100%)',
              },
            },
            error: {
              iconTheme: {
                primary: 'hsl(0, 62%, 50%)',
                secondary: 'hsl(0, 0%, 100%)',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
