CREATE TYPE "public"."bet_side" AS ENUM('A', 'B');--> statement-breakpoint
CREATE TYPE "public"."bet_status" AS ENUM('PENDING', 'SETTLED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('UPCOMING', 'LIVE', 'ENDED', 'SETTLED');--> statement-breakpoint
CREATE TYPE "public"."match_timeframe" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY');--> statement-breakpoint
CREATE TABLE "bet_pools" (
	"id" text PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"pool_a" real DEFAULT 0 NOT NULL,
	"pool_b" real DEFAULT 0 NOT NULL,
	"total_pool" real DEFAULT 0 NOT NULL,
	"house_fee_bps" integer DEFAULT 250 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bet_pools_match_id_unique" UNIQUE("match_id")
);
--> statement-breakpoint
CREATE TABLE "bets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"match_id" text NOT NULL,
	"side" "bet_side" NOT NULL,
	"amount" real NOT NULL,
	"odds_snapshot" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" "bet_status" DEFAULT 'PENDING' NOT NULL,
	"payout_amount" real,
	"tx_signature" text
);
--> statement-breakpoint
CREATE TABLE "match_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"current_balance_a" real NOT NULL,
	"current_balance_b" real NOT NULL,
	"pnl_a" real NOT NULL,
	"pnl_b" real NOT NULL,
	"token_count_a" integer DEFAULT 0 NOT NULL,
	"token_count_b" integer DEFAULT 0 NOT NULL,
	"total_trades_a" integer DEFAULT 0 NOT NULL,
	"total_trades_b" integer DEFAULT 0 NOT NULL,
	"trades_24h_a" integer DEFAULT 0 NOT NULL,
	"trades_24h_b" integer DEFAULT 0 NOT NULL,
	"win_rate_a" real DEFAULT 0 NOT NULL,
	"win_rate_b" real DEFAULT 0 NOT NULL,
	"volume_a" real DEFAULT 0 NOT NULL,
	"volume_b" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "match_stats_match_id_unique" UNIQUE("match_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_a_id" text NOT NULL,
	"wallet_b_id" text NOT NULL,
	"timeframe" "match_timeframe" NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"status" "match_status" DEFAULT 'UPCOMING' NOT NULL,
	"initial_balance_a" real,
	"initial_balance_b" real,
	"winner_wallet_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" text PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"final_pnl_a" real NOT NULL,
	"final_pnl_b" real NOT NULL,
	"winner_wallet_id" text NOT NULL,
	"settled_at" timestamp DEFAULT now() NOT NULL,
	"tx_hash" text,
	"proof_ref" text,
	CONSTRAINT "settlements_match_id_unique" UNIQUE("match_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"wallet_address" text NOT NULL,
	"encrypted_private_key" text NOT NULL,
	"public_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"kyc_status" text DEFAULT 'NONE' NOT NULL,
	"region" text,
	"role" text DEFAULT 'USER' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"chain" text NOT NULL,
	"address" text NOT NULL,
	"label" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"risk_tier" text DEFAULT 'MEDIUM' NOT NULL,
	"pnl_pct" real,
	"pnl_usd" real,
	"max_drawdown" real,
	"volatility" real,
	"win_rate" real,
	"sharpe_approx" real,
	"last_updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "bet_pools" ADD CONSTRAINT "bet_pools_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_stats" ADD CONSTRAINT "match_stats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_wallet_a_id_wallets_id_fk" FOREIGN KEY ("wallet_a_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_wallet_b_id_wallets_id_fk" FOREIGN KEY ("wallet_b_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_wallet_id_wallets_id_fk" FOREIGN KEY ("winner_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;