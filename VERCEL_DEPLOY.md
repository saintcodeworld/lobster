# 🚀 Vercel Deployment Checklist

## Prerequisites
- [x] Supabase database set up
- [x] Upstash Redis configured
- [ ] Helius RPC API key (REQUIRED for transactions)
- [ ] GitHub repository

## Step 1: Get Helius API Key (REQUIRED)

**This is critical - without it, betting will fail with 403 errors.**

1. Go to [helius.dev](https://helius.dev)
2. Sign up (free)
3. Create a project
4. Copy your API key

## Step 2: Prepare Environment Variables

Copy these to Vercel (all required):

```bash
# Database (from Supabase)
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Redis (from Upstash)
UPSTASH_REDIS_URL="https://xxxxx.upstash.io"
UPSTASH_REDIS_TOKEN="AxxxxxxxxxxxQ=="

# Solana RPC (from Helius - REQUIRED!)
NEXT_PUBLIC_SOLANA_RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR-HELIUS-KEY"
NEXT_PUBLIC_SOLANA_NETWORK="mainnet-beta"

# Treasury Wallet (for betting)
NEXT_PUBLIC_TREASURY_WALLET="ArLNcJPEZF3r1ETCJA6hbFaGTSk8GgcFX4c9wjvsRiNa"
TREASURY_SECRET="Jqk8MHL6CxKRjcUCoHTCZm0YlrhEvJgZPCIhat0scuOSXIvufyKngq2GvRJGHrTtPpTNdBhk1GwG6vHRXk0KJw=="

# App URLs (update with your Vercel domain)
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SOCKET_URL="https://your-app.vercel.app"
NEXTAUTH_URL="https://your-app.vercel.app"

# Auth Secret (generate new one)
NEXTAUTH_SECRET="your-secret-here"

NODE_ENV="production"
```

## Step 3: Push to GitHub

```bash
git add .
git commit -m "Complete 2Wallets platform with real SOL betting"
git push origin main
```

## Step 4: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. **Add ALL environment variables** (copy from above)
5. Click **Deploy**

## Step 5: After First Deployment

Run this locally to seed your production database:

```bash
# Pull production env vars
vercel env pull .env.production

# Run seed with production DB
DATABASE_URL="your-production-db-url" pnpm db:seed
```

## Step 6: Update App URLs

After deployment, update these in Vercel:
```bash
NEXT_PUBLIC_APP_URL="https://your-actual-domain.vercel.app"
NEXT_PUBLIC_SOCKET_URL="https://your-actual-domain.vercel.app"
NEXTAUTH_URL="https://your-actual-domain.vercel.app"
```

Then **redeploy**.

## ⚠️ CRITICAL: Keep Treasury Secret Safe!

The `TREASURY_SECRET` holds all user funds. In production:
1. Store it in Vercel environment variables (encrypted)
2. Never commit it to git
3. Consider using a hardware wallet for the treasury in the future

## Verification Checklist

After deployment:
- [ ] Visit `https://your-app.vercel.app`
- [ ] Check `/api/health` endpoint
- [ ] Connect wallet on `/arena`
- [ ] View leaderboard at `/leaderboard`
- [ ] Test placing a bet (with devnet first!)
- [ ] Check admin panel at `/admin` (password: `admin123`)
- [ ] Verify treasury balance shows up

## Troubleshooting

**Build fails?**
- Check all env vars are set
- Verify DATABASE_URL is correct

**Can't place bets?**
- Ensure NEXT_PUBLIC_SOLANA_RPC_URL has your Helius key
- Check NEXT_PUBLIC_TREASURY_WALLET is set

**Admin panel empty?**
- Seed the database: `pnpm db:seed`
