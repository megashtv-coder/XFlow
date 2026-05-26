# Deployment Guide - X-Flow

## Deploy to Vercel (Recommended - Fastest Way)

### Option 1: Deploy via Vercel Dashboard (Quick & Easy)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub (or create account)
3. Click "Import Project"
4. Select your GitHub repository: `megashtv-coder/XFlow`
5. Click "Import"
6. Configure environment variables (if needed):
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_KEY` - Your Supabase public API key
7. Click "Deploy"
8. Wait for deployment to complete (usually 1-2 minutes)
9. Your live URL will be displayed!

### Option 2: Deploy via Vercel CLI (Command Line)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Link your project:
   ```bash
   vercel
   ```
   Follow the prompts to link to your Vercel account

3. Deploy to production:
   ```bash
   vercel --prod
   ```

4. Your app will be live at the URL shown in the console

### Option 3: Automatic Deployment via GitHub Actions

1. Go to your GitHub repository settings: https://github.com/megashtv-coder/XFlow/settings/secrets/actions

2. Add three secrets:
   - `VERCEL_TOKEN`: Get from https://vercel.com/account/tokens
   - `VERCEL_ORG_ID`: Get from your Vercel dashboard (Team ID)
   - `VERCEL_PROJECT_ID`: Get from your Vercel dashboard (Project ID)

3. Every push to `main` will now automatically deploy!

## Environment Variables

If your app uses Supabase (for the backend API), make sure to configure these in Vercel:

1. In Vercel Project Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL=your_supabase_url`
   - `VITE_SUPABASE_KEY=your_supabase_public_key`

## Your Live URL

Once deployed, your app will be available at:
- `https://xflow-production.vercel.app` (or your custom domain)

## Rollback to Previous Version

If something goes wrong:
1. Go to Vercel dashboard
2. Click on your project
3. Go to "Deployments"
4. Click the three dots on a previous deployment
5. Click "Promote to Production"

## Custom Domain

To add a custom domain:
1. In Vercel project settings → Domains
2. Add your domain name
3. Follow the DNS setup instructions

---

**Need Help?** Check the [Vercel Documentation](https://vercel.com/docs)
