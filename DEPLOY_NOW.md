# 🚀 COMPLETE VERCEL DEPLOYMENT GUIDE

## Environment Variables for Vercel

Copy these **EXACT** values to Vercel Dashboard → Settings → Environment Variables:

### Database (Supabase)
```
DATABASE_URL
postgresql://postgres.kxvxxcofneicrrtdgnvm:vvxzEupW08C0VHPE@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Redis (Upstash)
```
UPSTASH_REDIS_URL
https://clean-porpoise-26046.upstash.io
```

```
UPSTASH_REDIS_TOKEN
AWW-AAIncDJmM2RmZmZmMTBkY2Y0YmI2YTZkMDczOTI5OGU1NmFmNHAyMjYwNDY
```

### Solana RPC (Helius) - CRITICAL FOR BETTING
```
NEXT_PUBLIC_SOLANA_RPC_URL
https://mainnet.helius-rpc.com/?api-key=0ea40bdc-d3f4-4541-b6bd-9b6ee85007a1
```

```
NEXT_PUBLIC_SOLANA_NETWORK
mainnet-beta
```

### Treasury Wallet (for betting)
```
NEXT_PUBLIC_TREASURY_WALLET
ArLNcJPEZF3r1ETCJA6hbFaGTSk8GgcFX4c9wjvsRiNa
```

```
TREASURY_SECRET
Jqk8MHL6CxKRjcUCoHTCZm0YlrhEvJgZPCIhat0scuOSXIvufyKngq2GvRJGHrTtPpTNdBhk1GwG6vHRXk0KJw==
```

### NextAuth Configuration
```
NEXTAUTH_SECRET
hki/ne6ATar6mWJjU+yr5aJDgmg8O00OsWkIhNp1BnU=
```

### App URLs (Update AFTER first deployment)
```
NEXT_PUBLIC_APP_URL
https://your-app-name.vercel.app
```

```
NEXTAUTH_URL
https://your-app-name.vercel.app
```

```
NODE_ENV
production
```

---

## Deployment Steps

### 1. Commit and Push
```bash
git add -A
git commit -m "Complete 2Wallets platform - ready for production"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `mike2505/2wallets`
3. Framework Preset: **Next.js** (auto-detected)
4. **Add all environment variables above** (copy/paste each one)
5. Click **Deploy**

### 3. After First Deployment

Once deployed, update these environment variables with your actual Vercel URL:

```bash
NEXT_PUBLIC_APP_URL=https://your-actual-app.vercel.app
NEXTAUTH_URL=https://your-actual-app.vercel.app
```

Then click **Redeploy** in Vercel.

### 4. Verify Deployment

Visit these URLs to test:
- `https://your-app.vercel.app` - Landing page
- `https://your-app.vercel.app/arena` - Arena (should show matches)
- `https://your-app.vercel.app/api/health` - Should return {"status":"ok"}
- `https://your-app.vercel.app/admin` - Admin panel (password: admin123)

---

## Post-Deployment Checklist

- [ ] Visit the app and test the UI
- [ ] Connect wallet (Phantom/Solflare)
- [ ] Try viewing a match
- [ ] Check leaderboard loads
- [ ] Check portfolio (after connecting wallet)
- [ ] Test placing a bet with a small amount (0.01 SOL)
- [ ] Verify transaction appears in admin panel
- [ ] Check Solscan link works

---

## Troubleshooting

### Build Fails
- Check that all environment variables are set
- Ensure `DATABASE_URL` is correct

### "403 Forbidden" when placing bets
- Verify `NEXT_PUBLIC_SOLANA_RPC_URL` has your Helius API key
- Try using devnet for testing first

### Database errors
- Ensure database schema is pushed: `pnpm db:push` (locally with production DATABASE_URL)
- Run seed: `pnpm db:seed`

### Admin panel shows 0 balance
- Wait a few minutes for Solana network sync
- Verify `NEXT_PUBLIC_TREASURY_WALLET` is correct

---

## 🎉 You're Ready!

Your app is production-ready with:
- ✅ Real SOL betting
- ✅ Supabase database
- ✅ Upstash Redis caching
- ✅ Professional UI
- ✅ Admin panel
- ✅ Toast notifications
- ✅ Documentation pages
- ✅ Cookie consent

Good luck! 🚀
