'use client'

import { Card } from '@/components/ui/card'
import { FileText, CheckCircle2 } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-12 border-b border-zinc-800 pb-8">
        <div className="flex items-center gap-3 text-white mb-4">
          <FileText size={32} className="text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">TERMS OF SERVICE</h1>
        </div>
        <p className="text-zinc-400 font-mono text-sm leading-relaxed">
          Last Updated: January 26, 2026. Effective Immediately.
        </p>
      </div>

      <div className="space-y-8 font-sans text-zinc-300">
        <section>
          <h2 className="text-lg font-bold text-white mb-4 font-mono">1. ACCEPTANCE OF TERMS</h2>
          <p className="mb-4 text-sm leading-7">
            By accessing or using the 2Wallets interface (the "Interface") and the underlying smart contracts (the "Protocol"), 
            you agree to be bound by these Terms of Service. If you do not agree, do not use the Interface or Protocol.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 font-mono">2. ELIGIBILITY</h2>
          <p className="mb-4 text-sm leading-7">
            You must be at least 18 years old and capable of forming a binding contract. 
            You represent that you are not:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400 text-sm mb-4">
            <li>A resident of a restricted jurisdiction (including the US, China, North Korea, Iran).</li>
            <li>Subject to economic sanctions.</li>
            <li>Using the protocol for illegal activities.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 font-mono">3. NON-CUSTODIAL NATURE</h2>
          <p className="mb-4 text-sm leading-7">
            2Wallets is a non-custodial protocol. We do not have access to your private keys or funds. 
            You maintain full control and responsibility for your digital assets at all times. 
            We are not a bank, broker, or custodian.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 font-mono">4. FEES & PAYMENTS</h2>
          <p className="mb-4 text-sm leading-7">
            The Protocol collects a fee from each settlement pool to support development and operations. 
            This fee is transparently displayed on the interface and encoded in the smart contracts. 
            Gas fees on the Solana network are paid directly by users.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 font-mono">5. LIMITATION OF LIABILITY</h2>
          <div className="bg-zinc-950 border border-zinc-800 p-6 text-sm text-zinc-400 leading-7">
            TO THE FULLEST EXTENT PERMITTED BY LAW, 2WALLETS AND ITS DEVELOPERS SHALL NOT BE LIABLE FOR ANY DAMAGES, 
            LOSS OF PROFITS, OR DATA ARISING FROM: (A) USE OF THE PROTOCOL; (B) SMART CONTRACT BUGS; 
            (C) ORACLE FAILURES; OR (D) UNAUTHORIZED ACCESS TO YOUR WALLET.
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-4 font-mono">6. GOVERNING LAW</h2>
          <p className="mb-4 text-sm leading-7">
            These terms are governed by the laws of [DAO Jurisdiction / Decentralized Nature]. 
            Disputes shall be resolved through binding arbitration.
          </p>
        </section>
      </div>

      <div className="mt-16 flex items-center justify-center gap-2 text-primary font-mono text-sm">
        <CheckCircle2 size={16} />
        <span>END OF DOCUMENT</span>
      </div>
    </div>
  )
}
