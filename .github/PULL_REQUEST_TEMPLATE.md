## Summary
<!-- What does this PR do? One or two sentences. -->


## Type of Change
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] ⚡ Performance improvement
- [ ] 🎨 UI / branding
- [ ] 🔒 Security fix
- [ ] 🗄️ Database / schema change
- [ ] ♻️ Refactor

---

## General Checklist
- [ ] Tested locally (`npm run dev`)
- [ ] No console errors or warnings
- [ ] Mobile layout checked (hamburger menu, stacked grids)
- [ ] Tested while logged out and logged in

---

## Frontend
- [ ] No broken links or missing `href`s
- [ ] Loading and error states handled
- [ ] Plan-based access enforced (Silver / Gold / Platinum views correct)
- [ ] New copy matches Lumivo brand tone

---

## API / Backend
- [ ] `userId` validated server-side (no anonymous access)
- [ ] Plan fetched from DB — not trusted from client
- [ ] Token usage checked before calling Claude API
- [ ] Supabase queries use `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- [ ] New routes added to correct folder under `app/api/`

---

## Database (tick if applicable)
- [ ] `supabase-schema.sql` updated with new tables / columns
- [ ] RLS policies reviewed for new tables
- [ ] Migrations tested in Supabase SQL editor
- [ ] No breaking changes to existing columns

---

## Stripe (tick if applicable)
- [ ] Webhook events handled correctly
- [ ] Tested with Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)
- [ ] `STRIPE_WEBHOOK_SECRET` up to date in Vercel env vars
- [ ] Redirect URLs use `NEXT_PUBLIC_APP_URL` (not hardcoded)

---

## Auth / Supabase (tick if applicable)
- [ ] Google OAuth redirect URL updated in Supabase dashboard
- [ ] `Site URL` and `Redirect URLs` correct in Supabase → Auth → URL Configuration
- [ ] Session persistence tested (refresh page while logged in)

---

## Environment Variables
- [ ] Any new env vars added to `.env.local.example`
- [ ] New env vars added to Vercel dashboard before deploying
- [ ] No secrets hardcoded in source files

---

## Screenshots
<!-- For UI changes — drag and drop before/after screenshots here -->

| Before | After |
|--------|-------|
|        |       |

---

## Deploy Notes
<!-- Anything the reviewer needs to do after merging, e.g. run SQL, update Stripe, set env vars -->

