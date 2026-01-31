'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { FileText, ShieldAlert, Code, Book } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">PROTOCOL DOCUMENTATION</h1>
        <p className="text-zinc-400 max-w-xl mx-auto">
          Technical specifications, legal frameworks, and operational guides for the 2Wallets ecosystem.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/docs/risk" className="group">
          <Card className="terminal-card p-8 h-full hover:border-red-500/50 transition-all">
            <div className="mb-6 p-4 bg-zinc-900 w-fit border border-zinc-800 group-hover:bg-red-500/10 group-hover:text-red-500 transition-colors">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors">Risk Disclosure</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Critical information regarding market risks, smart contract vulnerabilities, and oracle dependencies. 
              Required reading for all participants.
            </p>
          </Card>
        </Link>

        <Link href="/docs/terms" className="group">
          <Card className="terminal-card p-8 h-full hover:border-primary/50 transition-all">
            <div className="mb-6 p-4 bg-zinc-900 w-fit border border-zinc-800 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <FileText size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">Terms of Service</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Legal agreement governing the use of the interface and protocol. 
              Includes eligibility requirements and liability limitations.
            </p>
          </Card>
        </Link>

        <div className="group opacity-50 cursor-not-allowed">
          <Card className="terminal-card p-8 h-full">
            <div className="mb-6 p-4 bg-zinc-900 w-fit border border-zinc-800">
              <Code size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Developer Docs</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              API reference, smart contract addresses, and integration guides. 
              [COMING SOON]
            </p>
          </Card>
        </div>

        <div className="group opacity-50 cursor-not-allowed">
          <Card className="terminal-card p-8 h-full">
            <div className="mb-6 p-4 bg-zinc-900 w-fit border border-zinc-800">
              <Book size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">User Guide</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Tutorials on how to connect wallets, place bets, and manage positions. 
              [COMING SOON]
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
