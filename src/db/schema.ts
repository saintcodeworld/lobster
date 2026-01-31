import { pgTable, text, timestamp, real, integer, boolean, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const matchTimeframeEnum = pgEnum('match_timeframe', ['DAILY', 'WEEKLY', 'MONTHLY'])
export const matchStatusEnum = pgEnum('match_status', ['UPCOMING', 'LIVE', 'ENDED', 'SETTLED'])
export const betSideEnum = pgEnum('bet_side', ['A', 'B'])
export const betStatusEnum = pgEnum('bet_status', ['PENDING', 'SETTLED', 'CANCELLED'])

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  walletAddress: text('wallet_address').notNull().unique(),
  encryptedPrivateKey: text('encrypted_private_key').notNull(),
  publicKey: text('public_key').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  kycStatus: text('kyc_status').default('NONE').notNull(),
  region: text('region'),
  role: text('role').default('USER').notNull(),
})

export const wallets = pgTable('wallets', {
  id: text('id').primaryKey(),
  chain: text('chain').notNull(),
  address: text('address').notNull(),
  label: text('label'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  riskTier: text('risk_tier').default('MEDIUM').notNull(),
  pnlPct: real('pnl_pct'),
  pnlUsd: real('pnl_usd'),
  maxDrawdown: real('max_drawdown'),
  volatility: real('volatility'),
  winRate: real('win_rate'),
  sharpeApprox: real('sharpe_approx'),
  lastUpdatedAt: timestamp('last_updated_at'),
})

export const matches = pgTable('matches', {
  id: text('id').primaryKey(),
  walletAId: text('wallet_a_id').notNull().references(() => wallets.id),
  walletBId: text('wallet_b_id').notNull().references(() => wallets.id),
  timeframe: matchTimeframeEnum('timeframe').notNull(),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  status: matchStatusEnum('status').default('UPCOMING').notNull(),
  initialBalanceA: real('initial_balance_a'),
  initialBalanceB: real('initial_balance_b'),
  initialPortfolioValueA: real('initial_portfolio_value_a'),
  initialPortfolioValueB: real('initial_portfolio_value_b'),
  winnerWalletId: text('winner_wallet_id').references(() => wallets.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const betPools = pgTable('bet_pools', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id).unique(),
  poolA: real('pool_a').default(0).notNull(),
  poolB: real('pool_b').default(0).notNull(),
  totalPool: real('total_pool').default(0).notNull(),
  houseFeeBps: integer('house_fee_bps').default(250).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const bets = pgTable('bets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  matchId: text('match_id').notNull().references(() => matches.id),
  side: betSideEnum('side').notNull(),
  amount: real('amount').notNull(),
  oddsSnapshot: real('odds_snapshot').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  status: betStatusEnum('status').default('PENDING').notNull(),
  payoutAmount: real('payout_amount'),
  txSignature: text('tx_signature'),
})

export const settlements = pgTable('settlements', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id).unique(),
  finalPnlA: real('final_pnl_a').notNull(),
  finalPnlB: real('final_pnl_b').notNull(),
  winnerWalletId: text('winner_wallet_id').notNull(),
  settledAt: timestamp('settled_at').defaultNow().notNull(),
  txHash: text('tx_hash'),
  proofRef: text('proof_ref'),
})

export const matchStats = pgTable('match_stats', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id).unique(),

  currentBalanceA: real('current_balance_a').notNull(),
  currentBalanceB: real('current_balance_b').notNull(),

  currentPortfolioValueA: real('current_portfolio_value_a').notNull(),
  currentPortfolioValueB: real('current_portfolio_value_b').notNull(),

  pnlA: real('pnl_a').notNull(),
  pnlB: real('pnl_b').notNull(),

  tokenCountA: integer('token_count_a').default(0).notNull(),
  tokenCountB: integer('token_count_b').default(0).notNull(),

  totalTradesA: integer('total_trades_a').default(0).notNull(),
  totalTradesB: integer('total_trades_b').default(0).notNull(),

  trades24hA: integer('trades_24h_a').default(0).notNull(),
  trades24hB: integer('trades_24h_b').default(0).notNull(),

  winRateA: real('win_rate_a').default(0).notNull(),
  winRateB: real('win_rate_b').default(0).notNull(),

  volumeA: real('volume_a').default(0).notNull(),
  volumeB: real('volume_b').default(0).notNull(),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  dailyPnlA: real('daily_pnl_a').default(0).notNull(),
  dailyPnlB: real('daily_pnl_b').default(0).notNull(),
  dailyInitialPortfolioValueA: real('daily_initial_portfolio_value_a').default(0),
  dailyInitialPortfolioValueB: real('daily_initial_portfolio_value_b').default(0),
  lastDailyResetAt: timestamp('last_daily_reset_at').defaultNow(),
})

export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  bets: many(bets),
}))

export const walletsRelations = relations(wallets, ({ many }) => ({
  matchesAsA: many(matches, { relationName: 'walletA' }),
  matchesAsB: many(matches, { relationName: 'walletB' }),
  wonMatches: many(matches, { relationName: 'winner' }),
}))

export const matchesRelations = relations(matches, ({ one, many }) => ({
  walletA: one(wallets, {
    fields: [matches.walletAId],
    references: [wallets.id],
    relationName: 'walletA',
  }),
  walletB: one(wallets, {
    fields: [matches.walletBId],
    references: [wallets.id],
    relationName: 'walletB',
  }),
  winner: one(wallets, {
    fields: [matches.winnerWalletId],
    references: [wallets.id],
    relationName: 'winner',
  }),
  betPool: one(betPools),
  bets: many(bets),
  settlement: one(settlements),
  stats: one(matchStats),
}))

export const betPoolsRelations = relations(betPools, ({ one }) => ({
  match: one(matches, {
    fields: [betPools.matchId],
    references: [matches.id],
  }),
}))

export const betsRelations = relations(bets, ({ one }) => ({
  user: one(users, {
    fields: [bets.userId],
    references: [users.id],
  }),
  match: one(matches, {
    fields: [bets.matchId],
    references: [matches.id],
  }),
}))

export const settlementsRelations = relations(settlements, ({ one }) => ({
  match: one(matches, {
    fields: [settlements.matchId],
    references: [matches.id],
  }),
}))

export const matchStatsRelations = relations(matchStats, ({ one }) => ({
  match: one(matches, {
    fields: [matchStats.matchId],
    references: [matches.id],
  }),
}))

export const roundStatusEnum = pgEnum('round_status', ['ACTIVE', 'ENDED'])

export const rounds = pgTable('rounds', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id),
  roundNumber: integer('round_number').notNull(),
  startAt: timestamp('start_at').defaultNow().notNull(),
  endAt: timestamp('end_at'),
  status: roundStatusEnum('status').default('ACTIVE').notNull(),
  finalPnlA: real('final_pnl_a'),
  finalPnlB: real('final_pnl_b'),
  winnerWalletId: text('winner_wallet_id').references(() => wallets.id),
  poolA: real('pool_a').default(0).notNull(),
  poolB: real('pool_b').default(0).notNull(),
  totalPool: real('total_pool').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const roundDeposits = pgTable('round_deposits', {
  id: text('id').primaryKey(),
  roundId: text('round_id').notNull().references(() => rounds.id),
  userId: text('user_id').notNull().references(() => users.id),
  side: betSideEnum('side').notNull(),
  amount: real('amount').notNull(),
  oddsSnapshot: real('odds_snapshot').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  txSignature: text('tx_signature'),
})

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  match: one(matches, {
    fields: [rounds.matchId],
    references: [matches.id],
  }),
  winner: one(wallets, {
    fields: [rounds.winnerWalletId],
    references: [wallets.id],
  }),
  deposits: many(roundDeposits),
}))

export const roundDepositsRelations = relations(roundDeposits, ({ one }) => ({
  round: one(rounds, {
    fields: [roundDeposits.roundId],
    references: [rounds.id],
  }),
  user: one(users, {
    fields: [roundDeposits.userId],
    references: [users.id],
  }),
}))
