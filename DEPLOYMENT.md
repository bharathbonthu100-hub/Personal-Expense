# Supabase and Vercel setup

This dashboard uses one shared Supabase `expenses` table. Anyone with the deployed URL can view, add, edit, and delete shared expenses, as requested.

## Supabase

1. Create a Supabase project.
2. Open **SQL Editor**, paste the contents of `supabase.sql`, and run it.
3. Open **Project Settings → API** and copy the **Project URL** and public **anon key**.

## Local environment

Copy `.env.example` to `.env.local` and fill in:

```text
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Run `npm run dev` to test the shared board locally.

## Vercel

1. Import this project into Vercel.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Project Settings → Environment Variables**.
3. Deploy with `npm run build` as the build command.

Only the public anon key belongs in the browser. Never add the Supabase service-role key to this project.
