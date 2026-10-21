# armusic-basecamp-sync

Pulls Basecamp 2 calendar events (account-wide, recurrences included) and writes a public-safe `out/calendar.json` for the armusic.mx calendar.

## Setup

1. Register an app at https://launchpad.37signals.com/integrations with redirect URI `http://localhost:4567/callback`.
2. `cp .env.example .env` and fill in client ID/secret and `BASECAMP_USER_AGENT`.
3. `npm install && npm run auth`, open the printed URL, approve, then copy the printed account ID into `.env`.
4. All projects are published; private and deleted events are skipped.
5. `npm run sync` writes `out/calendar.json`.

## Output

`{ generatedAt, events[], latestUpdates[] }`. `latestUpdates` is the 20 most recently edited events.
Basecamp links, emails and internal people data are never written.

## Not built yet

- Delivery to GoDaddy (depends on hosting type) and a schedule (cron / GitHub Actions).
- Detecting deleted/moved events (sync rebuilds the full file each run, so they simply disappear).
