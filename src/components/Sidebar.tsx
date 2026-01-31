'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords,
  Trophy,
  Wallet,
  Menu,
  X,
  LogOut,
  User,
  ArrowUpRight
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/components/providers/AuthProvider'
import { AuthDialog } from '@/components/AuthDialog'
import { Button } from '@/components/ui/button'
import { LobsterLogo } from '@/components/LobsterLogo'

const navItems = [
  { name: 'Battle', href: '/', icon: Swords },
  { name: 'Portfolio', href: '/portfolio', icon: Wallet },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { user, logout } = useAuth()

  return (
    <>
      {/* Mobile Toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex items-center justify-center w-10 h-10 bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-md text-white hover:bg-zinc-900 transition-all shadow-lg"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <motion.aside
        className={clsx(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800/50 flex flex-col transition-transform duration-300 md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-zinc-800/50">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/5 group-hover:shadow-cyan-500/20 transition-all duration-300">
              <LobsterLogo className="w-7 h-7 text-cyan-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                LOBSTER BATTLES
              </span>
              <span className="text-[10px] text-zinc-500 font-medium tracking-wide">
                PVP TRADING
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link key={item.name} href={item.href}>
                <div className={clsx(
                  "relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group overflow-hidden",
                  isActive
                    ? "text-white bg-zinc-900/50 border border-zinc-800/50 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
                )}>
                  {/* Active Indicator Glow */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_12px_rgba(var(--primary),0.8)]" />
                  )}

                  <Icon size={18} className={clsx("transition-transform duration-200", isActive ? "text-primary scale-110" : "group-hover:text-zinc-300")} />
                  <span className={clsx(isActive ? "text-white" : "")}>{item.name}</span>

                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50" />
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer / Auth */}
        <div className="p-4 border-t border-zinc-800/50">
          <div className="bg-zinc-900/20 rounded-xl p-4 border border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Status</span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-medium text-emerald-500">Live</span>
              </div>
            </div>

            {user ? (
              <div className="space-y-2">
                <Link href="/portfolio">
                  <div className="flex items-center gap-2 p-2 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer group">
                    <User size={16} className="text-primary group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{user.email}</p>
                      <p className="text-[10px] text-zinc-500 font-mono truncate">
                        {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                      </p>
                    </div>
                    <ArrowUpRight size={14} className="text-zinc-500 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="w-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  <LogOut size={14} className="mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthDialog(true)}
                className="w-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 backdrop-blur-sm transition-all"
              >
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </>
  )
}
