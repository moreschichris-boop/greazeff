# Greaze Fantasy Football League

Next.js + Supabase site for the Greaze FFL: season history, standings, all-time
records, owner profiles, and a photo gallery — all editable from a PIN-gated
admin panel.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Once it's created, open **SQL Editor** → New query, paste in the contents
   of `supabase/schema.sql`, and run it.
3. Open a second query, paste in `supabase/seed.sql`, and run it. This loads
   the 12 owners and every season from 2011-12 through 2025-26 (champion,
   runner-up, regular season winner, and Toilet Bowl finisher for each year).
4. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon public** key — you'll need both in step 3 below.

## 2. Push the code to GitHub

1. Create a new empty repo on GitHub (e.g. `greaze-ffl`).
2. Open it in **GitHub Codespaces** (Code → Codespaces → Create codespace).
3. Delete the placeholder files Codespaces adds, then drag/upload everything
   from this zip into the Codespace's file explorer (or use `git` in the
   terminal if you're comfortable with it).
4. In the Codespace terminal:
   ```bash
   npm install
   ```

## 3. Set your environment variables

Copy `.env.local.example` to `.env.local` and fill in the two Supabase values
from step 1.4:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run it locally in the Codespace to check it works:

```bash
npm run dev
```

Codespaces will pop up a "forwarded port" link — open that to preview the
site.

## 4. Commit and push

```bash
git add .
git commit -m "Initial Greaze FFL site"
git push
```

## 5. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project → import the
   GitHub repo you just pushed.
2. Under **Environment Variables**, add the same two Supabase values from
   step 3.
3. Click Deploy. Vercel will give you a live URL, and every future `git push`
   redeploys automatically.

## Admin panel

Visit `/admin` on the live site. Default PIN is **3113** — change it right
away from the Settings tab once you're in (that writes a new PIN hash to
Supabase, no redeploy needed).

From the admin panel you can:

- Edit owner profiles (photo URL, bio, the fun questionnaire)
- Add/edit seasons (champion, runner-up, reg. season winner, Toilet Bowl)
- Enter full standings (wins/losses/points) for any season
- Curate the all-time record book (biggest blowout, best record, etc. — these
  aren't in the source spreadsheet, so add them by hand as you dig them up)
- Add/remove photos by year

Owner and photo images are just URLs — the easiest path is uploading images
to a free image host (or a Supabase Storage bucket, if you want to set one
up) and pasting the link in.

## What's pre-loaded vs. what needs filling in

The source spreadsheet had champion / runner-up / regular season winner /
last-place data for every season back to 2011-12, so that's all seeded in.
It did **not** have weekly scores or full win-loss standings, so:

- The **Standings** tab per season will show "not entered yet" until you fill
  it in from the admin panel.
- The **Records** page ships with placeholder rows (Biggest Blowout, Best
  Record, etc.) — replace the placeholder text with real values once you dig
  them up, or delete rows you don't want to track.

## Season-ending rosters & keeper eligibility

Public **`/rosters`** page shows every team's final roster for a chosen
season, with keeper eligibility badges. Manage it from Admin → Rosters:
pick a season and owner, add each player with position/team, mark whether
they're keeper eligible, and set which round it'll cost to keep them next
year. Keeper cost has enough exceptions in the league rules (free-agent
keepers only last one year, rounds 1-2 aren't eligible, multi-keeper
tiebreaks, etc.) that it's a plain editable field rather than
auto-calculated — enter the round by hand using your rules sheet.

If your Supabase project is already live, run `supabase/migration_002_rosters.sql`
(just the one new table) instead of the full `schema.sql` — SQL Editor → New
query → paste → Run.

## Best available players during the draft

Both the public `/draft` board and the admin pick form now show a **Best
Available** panel: a live, filterable list of everyone left in the player
pool, with position buttons (QB/RB/WR/TE/K/DEF, whatever positions are in
your pool) and a search box. It updates in real time as picks are made — no
refresh needed, same as the board itself. In admin, clicking a player in
that list fills the pick form for you.

## Live draft

There's a public **`/draft`** board (visible to anyone, updates live) and a
**Draft** tab in the admin panel to run it:

1. In admin → Draft, pick the season, set the number of rounds, and set the
   round-1 draft order (it snakes automatically after that).
2. Optionally paste a player pool (`Name, Position, Team`, one per line) —
   this powers autocomplete, but you can always type any name live even
   without it.
3. Add any keepers (owner, round, player) before starting.
4. Hit **Start Draft**. From then on, enter each pick as it happens — the
   `/draft` page updates instantly on everyone's phone via Supabase Realtime,
   no refresh needed. No pick clock, so it just moves at your pace.
5. **Undo Last Pick** if someone fat-fingers an entry. **Delete Draft** to
   scrap it and start over.

This assumes one person (the commissioner, running the admin panel) enters
picks live while everyone else watches the board — same as calling out picks
around the room, just on-screen instead of an Excel sheet.

If your Supabase project already existed before you added the draft tables,
re-run the updated `supabase/schema.sql` — it's safe to run again except for
the two `alter publication supabase_realtime add table ...` lines at the
bottom, which will error if already applied. If you see that error, just
skip those two lines (realtime is already on).

## Tech stack

- Next.js 14 (App Router, TypeScript, Tailwind)
- Supabase (Postgres + REST API via `@supabase/supabase-js`)
- Client-side PIN gate for `/admin` (SHA-256 hash stored in `app_settings`,
  matching the pattern used on the other league sites — not full user auth)
- Deployed via Vercel, connected to GitHub
