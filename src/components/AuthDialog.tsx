'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/AuthProvider'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Wallet, Check, Copy, Shield, User } from 'lucide-react'
import { LobsterLogo } from '@/components/LobsterLogo'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { login, signup } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')

  const [showKeys, setShowKeys] = useState(false)
  const [newUserKeys, setNewUserKeys] = useState<{ publicKey: string; privateKey: string } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Auto-generate credentials based on username
    const email = `${username.toLowerCase().replace(/\s+/g, '')}@2wallets.fun`
    const password = `secret-${username.toLowerCase()}-key`

    try {
      // Try to login first
      try {
        await login(email, password)
        toast.success(`Welcome back, ${username}!`)
        onOpenChange(false)
        return
      } catch (err) {
        // Login failed, try signup
      }

      // If login failed, signup
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      setNewUserKeys({
        publicKey: data.user.publicKey,
        privateKey: data.user.privateKey
      })
      setShowKeys(true)
      toast.success('Account created! Welcome to the arena!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeysAcknowledged = () => {
    setShowKeys(false)
    setNewUserKeys(null)
    setUsername('')
    onOpenChange(false)
    window.location.reload()
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`${field} copied!`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (showKeys && newUserKeys) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 border-zinc-800 text-white max-w-3xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <DialogHeader>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center mb-4"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                Your Wallet is Ready!
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-center">
                Save these credentials securely. They can&apos;t be recovered if lost.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="p-4 bg-gradient-to-r from-red-950/30 to-orange-950/30 border border-red-500/30 rounded-xl backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-semibold text-sm mb-1">Critical Security Notice</p>
                    <p className="text-red-300/80 text-xs leading-relaxed">
                      These keys control your wallet. Store them in a password manager or write them down.
                      If you lose them, your funds are permanently inaccessible.
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="space-y-4">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="text-sm font-semibold text-zinc-300 mb-2 block flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    Public Key (Wallet Address)
                  </label>
                  <div className="relative group">
                    <Input
                      value={newUserKeys.publicKey}
                      readOnly
                      className="font-mono text-xs bg-zinc-900/50 border-zinc-700 hover:border-primary/50 transition-colors pr-24 h-12"
                    />
                    <Button
                      onClick={() => copyToClipboard(newUserKeys.publicKey, 'Public key')}
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-10 hover:bg-primary/10 hover:text-primary"
                    >
                      {copiedField === 'Public key' ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="ml-2 text-xs">Copy</span>
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Share this to receive funds</p>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="text-sm font-semibold text-zinc-300 mb-2 block flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-red-400" />
                    Private Key (Keep Secret!)
                  </label>
                  <div className="relative group">
                    <Input
                      value={newUserKeys.privateKey}
                      readOnly
                      className="font-mono text-xs bg-zinc-900/50 border-zinc-700 hover:border-red-500/50 transition-colors pr-24 h-12"
                    />
                    <Button
                      onClick={() => copyToClipboard(newUserKeys.privateKey, 'Private key')}
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-10 hover:bg-red-500/10 hover:text-red-400"
                    >
                      {copiedField === 'Private key' ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="ml-2 text-xs">Copy</span>
                    </Button>
                  </div>
                  <p className="text-xs text-red-400/80 mt-2">Never share this with anyone!</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleKeysAcknowledged}
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 h-12 text-base font-semibold shadow-lg shadow-primary/20"
                >
                  <Check className="w-5 h-5 mr-2" />
                  I&apos;ve Saved My Keys Securely
                </Button>
              </motion.div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) return
        onOpenChange(newOpen)
      }}
    >
      <DialogContent
        className="bg-zinc-950 border-zinc-800 text-white max-w-md p-6"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <DialogHeader className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center mb-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-center shadow-lg shadow-red-500/10">
                <LobsterLogo className="w-10 h-10 text-red-500" />
              </div>
            </motion.div>

            <DialogTitle className="text-2xl font-bold text-white mb-2 font-mono tracking-tight">
              LOBSTER BATTLES
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter the arena. Fight for glory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEnter} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  className="bg-zinc-900/50 border-zinc-700 hover:border-zinc-600 focus:border-primary pl-10 h-11 transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 h-11 text-black font-semibold"
            >
              {isLoading ? 'Entering Arena...' : 'Enter Arena'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
