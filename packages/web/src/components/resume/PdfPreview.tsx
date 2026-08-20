'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  ZoomIn,
  ZoomOut,
  Download,
  Maximize2,
  Loader2,
  AlertCircle,
  FileText,
  RefreshCw,
} from 'lucide-react'

interface PdfPreviewProps {
  pdfUrl?: string | null
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  onDownload?: () => void
  lastCompiled?: string | null
  className?: string
}

const zoomLevels = [75, 100, 125]

export default function PdfPreview({
  pdfUrl,
  isLoading = false,
  error = null,
  onRetry,
  onDownload,
  lastCompiled,
  className,
}: PdfPreviewProps) {
  const [zoom, setZoom] = useState(100)
  const [zoomIndex, setZoomIndex] = useState(1)

  const cycleZoom = useCallback(() => {
    const next = (zoomIndex + 1) % zoomLevels.length
    setZoomIndex(next)
    setZoom(zoomLevels[next])
  }, [zoomIndex])

  const zoomOut = useCallback(() => {
    if (zoomIndex > 0) {
      setZoomIndex(zoomIndex - 1)
      setZoom(zoomLevels[zoomIndex - 1])
    }
  }, [zoomIndex])

  const zoomIn = useCallback(() => {
    if (zoomIndex < zoomLevels.length - 1) {
      setZoomIndex(zoomIndex + 1)
      setZoom(zoomLevels[zoomIndex + 1])
    }
  }, [zoomIndex])

  return (
    <div className={cn('flex flex-col rounded-xl border border-border bg-card overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/50">
        <span className="text-xs font-medium text-muted-foreground">PDF Preview</span>
        <div className="flex items-center gap-1">
          {lastCompiled && (
            <span className="text-[10px] text-muted-foreground/70 mr-2 hidden sm:inline">
              {lastCompiled}
            </span>
          )}
          <button
            onClick={zoomOut}
            disabled={zoomIndex === 0}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={cycleZoom}
            className="px-2 py-1 rounded text-xs font-mono font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-w-[48px] text-center"
          >
            {zoom}%
          </button>
          <button
            onClick={zoomIn}
            disabled={zoomIndex === zoomLevels.length - 1}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {pdfUrl && (
            <button
              onClick={onDownload}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto" style={{ minHeight: 500 }}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-primary/20 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Generating PDF...</p>
                <p className="text-xs text-muted-foreground">Compiling LaTeX document</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-4 max-w-xs text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Compilation Failed</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              )}
            </motion.div>
          ) : pdfUrl ? (
            <motion.div
              key="pdf"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-2xl overflow-hidden"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            >
              {/* A4 ratio container */}
              <div
                className="relative bg-white"
                style={{
                  width: 595,
                  minHeight: 842,
                }}
              >
                <iframe
                  src={pdfUrl}
                  className="w-full border-0"
                  style={{ width: 595, minHeight: 842 }}
                  title="PDF Preview"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-muted-foreground">No preview available</p>
                <p className="text-xs text-muted-foreground/60">
                  Generate LaTeX to see a preview
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
