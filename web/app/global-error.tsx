'use client'

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html>
      <body className="bg-[#0f172a] text-[#f8fafc] antialiased">
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <h1 className="font-display font-black text-3xl mb-3">
              Error crítico
            </h1>
            <p className="text-[#94a3b8] mb-8">
              Ocurrió un error inesperado en la aplicación.
            </p>
            <button
              onClick={() => unstable_retry()}
              className="px-8 py-3 rounded-full font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
