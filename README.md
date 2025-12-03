# StrayWatch

Community safety stack for tracking stray dogs, bite incidents, and garbage hotspots across Leh district. The app runs on Astro with React islands, Supabase for auth/storage, and a lightweight API proxy for geocoding.

## Tech stack

- **Astro** for static rendering + island hydration
- **React** islands for the interactive map, auth, and metrics widgets
- **Supabase** (Postgres + Auth) as the backend
- **Leaflet + OpenStreetMap** for map visualization
- **TanStack Query** for client-side data fetching/caching

## Local development

```bash
npm install
npm run dev
```

Create a `.env` file (already gitignored) with your Supabase credentials:

```bash
PUBLIC_SUPABASE_URL=your-project-url
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional fallbacks supported: `VITE_SUPABASE_URL` and `PUBLIC_SUPABASE_KEY`.

### Supabase database

Run the provided migrations before using the map/reporting features:

```bash
supabase db push
```

Tables/views included:

- `reports` main table
- RLS policies + `report_stats` and `daily_report_trends` helper views
- Trigger for `updated_at`

## API routes

- `/api/geocode`: server-side proxy for Nominatim (avoids client-side rate limits)
- `/api/metrics`: aggregates live report stats from Supabase for the landing page widgets

## Deployment (Netlify)

1. Set build command to `npm run build` and publish directory to `dist/`.
2. Configure the same Supabase env vars in Netlify (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`).
3. Add an `ACCESS_TOKEN` or other secrets only if additional APIs are introduced.

Netlify handles the Astro adapter automatically; no Replit-specific config is required anymore.

## Available scripts

| Script | Purpose |
| ------ | ------- |
| `npm run dev` | Start Astro dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run format` | (If configured) format the codebase |

## Contributing

- Duplicate `.env.example` (if created) or copy `.env` instructions above.
- Run `npm run dev` and visit `http://localhost:4321`.
- Use `npm run lint` / `npm run format` if those scripts exist in `package.json`.
- Submit PRs against `main` with clear descriptions.

## License

MIT unless specified otherwise by project owners.
