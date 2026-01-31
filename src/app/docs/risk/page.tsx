'use client'

import { Card } from '@/components/ui/card'
import { AlertTriangle, ShieldAlert, BookOpen } from 'lucide-react'

export default function RiskDisclosurePage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-12 border-b border-zinc-800 pb-8">
        <div className="flex items-center gap-3 text-red-500 mb-4">
          <AlertTriangle size={32} />
          <h1 className="text-3xl font-bold tracking-tight">RISK DISCLOSURE STATEMENT</h1>
        </div>
        <p className="text-zinc-400 font-mono text-sm leading-relaxed">
          Please read this entire document carefully before interacting with the 2Wallets Protocol.
          Trading involves significant risk and is not suitable for every investor.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert size={20} className="text-primary" />
            1. GENERAL TRADING RISKS
          </h2>
          <Card className="terminal-card p-6 bg-zinc-950/50">
            <p className="text-zinc-400 text-sm leading-7 mb-4">
              Trading in prediction markets and cryptocurrency derivatives carries a high level of risk 
              and may not be suitable for all investors. You could lose some or all of your initial investment. 
              Do not invest money that you cannot afford to lose.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-500 text-sm">
              <li>Market Volatility: Crypto markets are highly volatile and unpredictable.</li>
              <li>Liquidity Risk: Markets may become illiquid, making it impossible to exit a position.</li>
              <li>Technology Risk: Blockchain networks may experience congestion or failure.</li>
            </ul>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-secondary" />
            2. SMART CONTRACT RISKS
          </h2>
          <Card className="terminal-card p-6 bg-zinc-950/50">
            <p className="text-zinc-400 text-sm leading-7 mb-4">
              The 2Wallets Protocol runs on smart contracts executed on the Solana blockchain. 
              While audited, smart contracts are experimental technology and may contain bugs or vulnerabilities.
            </p>
            <div className="border-l-2 border-red-500 pl-4 py-2 my-4 bg-red-500/5">
              <p className="text-red-400 text-xs font-mono">
                WARNING: IN THE EVENT OF A SMART CONTRACT FAILURE, FUNDS MAY BE IRRETRIEVABLE.
              </p>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">3. ORACLE DEPENDENCY</h2>
          <Card className="terminal-card p-6 bg-zinc-950/50">
            <p className="text-zinc-400 text-sm leading-7">
              Our markets settle based on data provided by third-party oracles (e.g., Pyth, Chainlink). 
              We do not control these data feeds. Oracle failure, manipulation, or latency could result 
              in incorrect settlement outcomes. By using the platform, you accept the finality of oracle-based settlements.
            </p>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">4. REGULATORY UNCERTAINTY</h2>
          <Card className="terminal-card p-6 bg-zinc-950/50">
            <p className="text-zinc-400 text-sm leading-7">
              The regulatory environment for cryptocurrencies and prediction markets is evolving. 
              Changes in laws or regulations in your jurisdiction could impact your ability to use the platform 
              or the value of your assets. It is your responsibility to ensure compliance with local laws.
            </p>
          </Card>
        </section>

        <div className="mt-12 p-6 border border-zinc-800 bg-black text-center">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Acknowledgement</p>
          <p className="text-zinc-300 text-sm">
            BY CONNECTING YOUR WALLET AND INTERACTING WITH THE PROTOCOL, YOU ACKNOWLEDGE THAT YOU HAVE READ, 
            UNDERSTOOD, AND ACCEPTED ALL RISKS DESCRIBED HEREIN.
          </p>
        </div>
      </div>
    </div>
  )
}
