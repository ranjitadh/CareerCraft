'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Marquee } from '@/components/ui/Marquee'

const marqueeItems = [
  'ART COMES FIRST',
  'CRAFT YOUR STORY',
  'ATS READY',
  'AI POWERED',
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="border-b hairline">
        <div className="flex items-center justify-between px-5 lg:px-10 h-16">
          <Link href="/" className="font-display text-xl font-bold tracking-tight">
            ResumeForge<span className="text-accent">AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-mono-label text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Left brand panel */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r hairline">
          <div>
            <p className="font-mono-label text-accent mb-8">ResumeForge AI</p>
            <h2 className="font-display text-display-md font-semibold leading-none">
              Build resumes
              <br />
              that get
              <br />
              <span className="italic font-normal text-muted-foreground">
                interviews
              </span>
            </h2>
          </div>

          <div className="font-mono-label space-y-4 text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="text-accent">01</span>
              <span>ATS Score Analysis</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-accent">02</span>
              <span>AI Content Generation</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-accent">03</span>
              <span>LaTeX Export</span>
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 flex items-center justify-center px-6 py-16 sm:px-12">
          <div className="w-full max-w-md">
            {/* Mobile brand */}
            <div className="lg:hidden mb-10">
              <Link href="/" className="font-display text-xl font-bold tracking-tight">
                ResumeForge<span className="text-accent">AI</span>
              </Link>
            </div>
            {children}
          </div>
        </div>
      </div>

      {/* Marquee footer */}
      <div className="border-t hairline">
        <Marquee speed={80} ariaLabel="auth footer marquee">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="font-display text-2xl font-semibold px-6 py-4 flex items-center gap-6"
            >
              {item}
              <ArrowUpRight className="w-5 h-5 text-accent" aria-hidden="true" />
            </span>
          ))}
        </Marquee>
      </div>
    </div>
  )
}
