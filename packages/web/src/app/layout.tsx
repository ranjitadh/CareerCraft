import type { Metadata } from 'next'
import { Inter, Archivo_Black } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ResumeForge AI - Instant Resume Generator',
  description:
    'Build ATS-optimized, professionally formatted resumes tailored to any job description instantly',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${archivoBlack.variable}`}>
      <body className="font-sans">
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '0.85rem',
            },
          }}
        />
      </body>
    </html>
  )
}
