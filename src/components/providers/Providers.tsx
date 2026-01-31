'use client'

import { WalletProvider } from "@/components/providers/WalletProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { CookieConsent } from "@/components/CookieConsent";
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <WalletProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 relative min-w-0 md:ml-64">
              {children}
            </main>
          </div>
          <CookieConsent />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: 'bg-zinc-950 border border-zinc-800 text-white font-sans text-sm shadow-2xl backdrop-blur-md',
            }}
          />
        </WalletProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
