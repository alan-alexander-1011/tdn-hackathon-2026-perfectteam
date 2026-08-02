# Smart Traffic AI

Mobile-first traffic app: Next.js (App Router) + TypeScript + Tailwind + MongoDB + Google Maps + an external Python AI service for route/infra recommendations.

## 1. Push to GitHub

```bash
cd smart-traffic-app
git init
git add .
git commit -m "Initial commit: Smart Traffic AI boilerplate"
git branch -M main
git remote add origin https://github.com/<your-username>/smart-traffic-app.git
git push -u origin main
```

`.env.local` is git-ignored on purpose — never commit real API keys. Use `.env.local.example` as the template.

## 2. Get your Google Maps key wired in

Your friend already has the Google Maps API key working — here's where it plugs in:

1. Copy the template: `cp .env.local.example .env.local`
2. Paste the working key into `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<the key your friend generated>
   ```
3. In Google Cloud Console, make sure these APIs are enabled on that key's project:
   - **Maps JavaScript API**
   - **Directions API** (used by `MapDirections.tsx` for routing)
   - **Places API** (if you later add address autocomplete to the search bar)
4. If your friend also created a **Map ID** (Google Cloud Console → Maps Management), add it too:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_ID=<map id>
   ```
   `app/page.tsx` already reads this env var and falls back to `"DEMO_MAP_ID"` if it's not set, so nothing breaks if you skip it — but a real Map ID is required for custom marker styling (`AdvancedMarker`) to render correctly in production.
5. In Google Cloud Console, restrict the key: **Application restrictions → HTTP referrers**, and add:
   - `http://localhost:3000/*` (local dev)
   - `https://your-vercel-project.vercel.app/*` (prod, add after first deploy)
   - your custom domain, if any

## 3. MongoDB Atlas setup

1. Create a free cluster at https://cloud.mongodb.com
2. Database Access → add a database user with a strong password
3. Network Access → Add IP Address → **Allow Access from Anywhere (0.0.0.0/0)**
   (Vercel serverless functions use dynamic IPs, so this is required unless you use Atlas's Vercel integration for scoped access)
4. Connect → Drivers → copy the connection string, drop it into `.env.local` as `MONGODB_URI`

## 4. Local test run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — you should see the map, search bar, and bottom sheet. Visit `/admin` for the dashboard.

## 5. Deploy to Vercel

1. Go to https://vercel.com/new and import the GitHub repo
2. Framework preset: **Next.js** (auto-detected)
3. Before deploying, add Environment Variables (Project Settings → Environment Variables), for **all** environments (Production/Preview/Development):

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | your friend's working Google Maps key |
   | `NEXT_PUBLIC_GOOGLE_MAPS_ID` | your Map ID (optional but recommended) |
   | `MONGODB_URI` | Atlas connection string |
   | `PYTHON_BACKEND_URL` | base URL of your deployed Python AI service, no trailing slash |

4. Click **Deploy**
5. Once deployed, copy the `https://<project>.vercel.app` domain and add it to the Google Maps key's HTTP referrer restrictions (step 2.5 above) — otherwise the map will fail to load in production with a `RefererNotAllowedMapError`
6. Redeploy (or just wait — referrer restriction changes apply immediately, no redeploy needed)

## Notes on the Python AI backend

`services/aiPythonService.ts` expects your Python service to expose:
- `POST {PYTHON_BACKEND_URL}/analyze-route` → returns `{ recommendedWaypoints, estimatedTimeDelay, upgradeRecommendations }`
- `POST {PYTHON_BACKEND_URL}/propose-upgrades` → returns `{ proposals: string[] }`

If that service isn't deployed yet, `npm run dev` will still run — the search/admin panel will just fail those two fetches until `PYTHON_BACKEND_URL` points somewhere real (Render, Railway, Fly.io, a VM, etc. all work; it just needs to be a publicly reachable HTTPS URL, since Vercel functions can't reach `localhost`).
