# Mineral Hunter

An iPhone app (built with Expo / React Native) for finding mine and mineral sites from the
[USGS Mineral Resources Data System (MRDS)](https://mrdata.usgs.gov/mrds/).

- **Map** — USGS sites as color-coded pins by mineral, with filters by mineral group and site
  type, satellite/hybrid map layers, and a detail page for each site (commodities, distance,
  directions, full USGS record).
- **Finder** — point your camera around and nearby sites float over the view in the direction
  they lie, with distance, a top-down radar, and the nearest site called out.

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
    (tabs)/            One file per tab: Map, Finder
    site/[id].tsx      Site detail page
    filters.tsx        Filters sheet
  features/            The actual screen code, one folder per feature
    map/  finder/  site/  filters/
  data/                Where sites come from
    types.ts           MineralSite and the SiteSource interface
    sites.ts           fetchSites(): tries each source in order, caches results
    mrds/              USGS sources (ArcGIS GeoJSON first, OGC WFS as fallback)
  state/               Shared hooks: filters, location, compass heading, site loading
  config/              Mineral groups & colors (commodities.ts), theme colors
  lib/                 Geo math (distance, bearing, formatting)
```

### Adding things later

- **A new feature tab** — add `src/features/<name>/<Name>Screen.tsx`, a one-line route file in
  `src/app/(tabs)/`, and a `Tabs.Screen` entry in `src/app/(tabs)/_layout.tsx`.
- **A new data source** (e.g. a state geological survey, your own saved spots) — implement
  `SiteSource` from `src/data/types.ts` and add it to `SOURCES` in `src/data/sites.ts`.
- **Change pin colors or mineral groups** — edit `src/config/commodities.ts`.

## Checks

```bash
npm run typecheck
```

## Notes

- Site data is loaded live for the area on screen (up to 500 sites per view on the map). Zoom in
  if a view says it's capped.
- Many MRDS sites are on private land or are abandoned workings. Get permission and stay out of
  mine openings.
