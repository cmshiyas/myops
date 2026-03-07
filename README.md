# OpportunityFinder — Deployment Guide

Follow these steps in order. Each step takes 5–15 minutes.
Total time to go live: ~1.5 hours.

---

## STEP 1 — Get your Anthropic API Key (5 min)

1. Go to https://console.anthropic.com
2. Sign in or create an account
3. Click **API Keys** in the left sidebar
4. Click **Create Key**, give it a name (e.g. "opportunity-finder")
5. Copy the key — it starts with `sk-ant-...`
6. **Keep this secret. Never share it or put it in your code.**

---

## STEP 2 — Set up Supabase (database + auth) (15 min)

1. Go to https://supabase.com and sign up (free)
2. Click **New Project**, give it a name, choose a region close to you
3. Wait ~2 minutes for it to set up

**Run the database schema:**
4. In your Supabase dashboard, click **SQL Editor** in the left sidebar
5. Click **New query**
6. Open the file `supabase-schema.sql` from this project folder
7. Copy the entire contents and paste into the SQL editor
8. Click **Run** — you should see "Success"

**Get your API keys:**
9. Go to **Settings → API** in your Supabase dashboard
10. Copy the **Project URL** (looks like `https://xxxx.supabase.co`)
11. Copy the **anon / public** key (long string starting with `eyJ...`)

---

## STEP 3 — Set up the project on your computer (10 min)

You need Node.js installed. Check by running:
```
node --version
```
If you don't have it, download from https://nodejs.org (choose "LTS" version)

**Install the project:**
```bash
# Install dependencies
npm install
```

**Create your secrets file:**
```bash
# Copy the example env file
cp .env.local.example .env.local
```

Now open `.env.local` in any text editor and fill in your three values:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

**Test it locally:**
```bash
npm run dev
```
Open http://localhost:3000 — your app should be running!

---

## STEP 4 — Deploy to Vercel (free) (15 min)

**Create a GitHub repository:**
1. Go to https://github.com and sign in (create a free account if needed)
2. Click the **+** icon → **New repository**
3. Name it `opportunity-finder`, set it to **Private**, click **Create**
4. Follow the instructions to push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/opportunity-finder.git
git push -u origin main
```

**Deploy on Vercel:**
5. Go to https://vercel.com and sign in with your GitHub account
6. Click **Add New → Project**
7. Find your `opportunity-finder` repo and click **Import**
8. Click **Deploy** (leave all settings as default)

**Add your environment variables to Vercel:**
9. After deploying, go to your project in Vercel
10. Click **Settings → Environment Variables**
11. Add each of the three variables from your `.env.local` file:
    - `ANTHROPIC_API_KEY`
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
12. Click **Save**, then go to **Deployments** and click **Redeploy**

Your app is now live at `https://your-project-name.vercel.app` 🎉

---

## STEP 5 — (Optional) Add a custom domain (10 min + $12/year)

1. Buy a domain at https://namecheap.com (e.g. `opportunityfinder.com`)
2. In Vercel → your project → **Settings → Domains**
3. Type your domain and click **Add**
4. Vercel will show you DNS records to add
5. In Namecheap → **Domain List → Manage → Advanced DNS**
6. Add the records Vercel shows you
7. Wait 5–30 minutes for it to go live with HTTPS ✓

---

## Troubleshooting

**"Cannot find module" error:**
→ Run `npm install` again

**Auth not working:**
→ Double-check your Supabase URL and anon key in `.env.local`
→ Make sure you ran the SQL schema in Supabase

**AI analysis not working:**
→ Check your Anthropic API key is correct
→ Make sure you have credits at console.anthropic.com

**Changes not showing on Vercel:**
→ Push to GitHub: `git add . && git commit -m "update" && git push`
→ Vercel auto-deploys on every push

---

## Project Structure

```
opportunity-finder/
├── app/
│   ├── api/
│   │   ├── analyze/route.js   ← Secure Claude AI proxy
│   │   ├── auth/route.js      ← Signup / login
│   │   └── profile/route.js   ← Save / load user profile
│   ├── layout.js              ← HTML wrapper
│   └── page.jsx               ← Full application UI
├── lib/
│   └── supabase.js            ← Database client
├── supabase-schema.sql        ← Run this in Supabase once
├── .env.local.example         ← Copy to .env.local and fill in
├── .gitignore                 ← Keeps secrets out of GitHub
└── package.json
```
# myops
