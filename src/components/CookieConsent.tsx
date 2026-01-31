'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Cookie, X } from 'lucide-react'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consented = localStorage.getItem('cookie-consent')
    if (!consented) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 flex justify-center pointer-events-none"
        >
          <div className="pointer-events-auto bg-zinc-900 border border-zinc-800 p-6 shadow-2xl max-w-xl w-full flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 text-white font-bold">
                <Cookie size={16} className="text-primary" />
                <span>COOKIE PROTOCOL</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                We use cookies to optimize platform performance and analyze market traffic. 
                By interacting with the protocol, you agree to our data policy.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleAccept}
                className="bg-primary text-black hover:bg-primary/90 font-bold rounded-none h-10 px-6 text-xs tracking-wide"
              >
                ACKNOWLEDGE
              </Button>
              <button 
                onClick={() => setIsVisible(false)}
                className="p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
