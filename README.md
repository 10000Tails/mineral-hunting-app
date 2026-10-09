# Mineral Hunter

An iPhone app (built with Expo / React Native) for finding mine and mineral sites from the
[USGS Mineral Resources Data System (MRDS)](https://mrdata.usgs.gov/mrds/).

- **Welcome** — the mountain artwork with tilt-driven parallax; the Mineral Hunter logo and the
  Create Account / Log In buttons fade in together over it.
- **Map** — USGS sites as color-coded pins by mineral, with filters by mineral group and site
  type, zoom buttons, and satellite/hybrid layers. Tapping a pin opens a pop-up with coordinates
  and location, development status, commodity type, economic information (operation type,
  production size, deposit type) and other minerals reported at the site, pulled from the full
  USGS record.
- **Finder** — point your camera around and nearby sites float over the view in the direction
  they lie, with distance, a top-down radar, and the nearest site called out.
- **Favorites** — tap the heart on any site to save it. Favorites are stored on the phone, and
  tapping one shows it on the map.

## Run it on your iPhone

You need a computer (Mac or Windows) with [Node.js](https://nodejs.org) 20+ and the free
**Expo Go** app on your iPhone.

```bash
git clone https://github.com/10000Tails/mineral-hunting-app
cd mineral-hunting-app
npm install
npx expo start
```

Scan the QR code with the iPhone camera; it opens in Expo Go. If the phone and computer aren't
on the same Wi-Fi, use `npx expo start --tunnel`.

## How the code is organized

```
src/
  app/                 Screens and navigation (Expo Router — every file is a route)
    index.tsx          Welcome screen (first screen on launch)
    create-account.tsx, log-in.tsx
    (tabs)/            One file per tab: Map, Finder, Favorites
    site/[id].tsx      Site detail page
    filters.tsx        Filters sheet
  features/            The actual screen code, one folder per feature
    welcome/  auth/  map/  finder/  favorites/  site/  filters/
  data/                Where sites come from
    auth.ts            Account functions (placeholder until a provider is chosen)
    types.ts           MineralSite and the SiteSource interface
    sites.ts           fetchSites(): tries each source in order, caches results
    mrds/              USGS sources (ArcGIS GeoJSON first, OGC WFS as fallback);
                       details.ts fetches one site's full record for the pop-up
  state/               Shared state: filters, favorites, location, compass, site loading
  config/              Branding (brand.ts), mineral groups & colors (commodities.ts), theme
  lib/                 Geo math (distance, bearing, formatting)
```

### Adding things later

- **A new feature tab** — add `src/features/<name>/<Name>Screen.tsx`, a one-line route file in
  `src/app/(tabs)/`, and a `Tabs.Screen` entry in `src/app/(tabs)/_layout.tsx`.
- **A new data source** (e.g. a state geological survey, your own saved spots) — implement
  `SiteSource` from `src/data/types.ts` and add it to `SOURCES` in `src/data/sites.ts`.
- **Real accounts** — fill in `createAccount` and `logIn` in `src/data/auth.ts`. Until then the
  forms validate input and then offer a way through to the map.
- **Change pin colors or mineral groups** — edit `src/config/commodities.ts`.

## Checks

```bash
npm run typecheck
npm run lint
```

## Notes

- The full-screen mountain launch screen only shows in a real build (`eas build`); Expo Go shows
  its own loading screen first, then the welcome screen.

- Site data is loaded live for the area on screen (up to 500 sites per view on the map). Zoom in
  if a view says it's capped.
- Many MRDS sites are on private land or are abandoned workings. Get permission and stay out of
  mine openings.
