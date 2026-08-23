'use client'

import { useEffect } from 'react'
import { Zap, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-btn glow-primary mx-auto mb-6 flex items-center justify-center">
          <Zap size={32} className="text-white" fill="white" />
        </div>
        <h1 className="font-display font-black text-3xl text-text-primary mb-3">
          Algo salió mal
        </h1>
        <p className="text-text-secondary mb-8">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => unstable_retry()} className="btn-primary">
            <RefreshCw size={18} /> Intentar de nuevo
          </button>
          <Link href="/" className="btn-secondary">
            <ArrowLeft size={18} /> Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
