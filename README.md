# Garden Coil

An original, mobile-first HTML5 snake puzzle game built with HTML, CSS and vanilla JavaScript.

## Run locally

Because this project uses a service worker, serve it over HTTP rather than opening `index.html` directly.

Examples:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy to Vercel

1. Put this folder in a Git repository.
2. Import the repository into Vercel.
3. Framework preset: **Other** / static.
4. Build command: none.
5. Output directory: `.`.
6. Deploy.

The root `index.html` is the entry point.

## Install as a PWA

Open the deployed site in a supported Android browser and use the browser's **Install app / Add to Home screen** option. The manifest uses standalone display and portrait orientation.

## Android WebView

Load the deployed URL in an Android WebView, or package the same static files locally. Enable JavaScript and DOM storage. For a production wrapper, expose only the capabilities you need.

The game does not require a backend.

## Architecture

- `index.html` — screens and reusable UI markup.
- `style.css` — responsive mobile UI, game board and animations.
- `levels.js` — deterministic level generation with a guaranteed route.
- `save.js` — versioned localStorage save data and energy regeneration.
- `audio.js` — optional Web Audio effects and vibration helpers.
- `ui.js` — menus, level cards, shop, inventory, settings, rewards and achievements.
- `game.js` — movement, collision, pathfinding hints, undo, retry, victory and sharing.
- `manifest.json` — PWA metadata.
- `service-worker.js` — offline caching.
- `assets/icons/icon.svg` — original app icon.

## Adding levels

`levels.js` generates 36 deterministic playable levels. Increase the `Array.from({length:36...})` count to create more, or replace `makeLevel()` with hand-authored level objects using the same `{id,w,h,start,goal,obstacles,collectibles,par,star3,star2,reward}` structure.

## Notes

- No real-money purchases.
- No external ads are required.
- Reward buttons are local in-game rewards.
- Share uses the Web Share API only when available.
- Save data is local to the device/browser.
