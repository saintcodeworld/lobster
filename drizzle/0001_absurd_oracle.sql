ALTER TABLE "match_stats" ADD COLUMN "current_portfolio_value_a" real NOT NULL;--> statement-breakpoint
ALTER TABLE "match_stats" ADD COLUMN "current_portfolio_value_b" real NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "initial_portfolio_value_a" real;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "initial_portfolio_value_b" real;