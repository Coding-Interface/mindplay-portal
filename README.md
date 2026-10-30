# MindPlay Arcade — game portal

A small game-portal website for the MindPlay cognitive games (Fill the Holes in four worlds, Masala Dabba Sort, Get the Auto Out), with the familiar portal layout:
- a header with logo and search, plus a category bar
- a featured "Play now" banner
- sections of game tiles
- a page for each game, with a 16:9 player, Restart, Fullscreen and New tab buttons, a description, skills and how to play
- a footer

## Run

Serve the folder over http, because the game loads its levels and art as files:

```bash
npx --yes serve .
# open http://localhost:3000
```

Upload the whole folder to any static host (GitHub Pages, Netlify, an S3 bucket, your school server). There is no build step.

## Pages

| Address | Page |
|---|---|
| `#home` | Home: banner, new games, skills, teacher note |
| `#new`, `#planning`, `#spatial`, `#all` | Category lists |
| `#memory` | Memory games (Masala Dabba Sort) |
| `#attention`, `#maths` | "Coming soon" pages for future games |
| `#game-masala`, `#game-autoout`, `#game-pothole`, `#game-kanche`, `#game-fields`, `#game-parking` | Game pages |

## Changing things

- **Site name, tagline and year:** `Catalog.SITE` in `js/Catalog.js`.
- **Add a game:** add an entry to `Catalog.GAMES`, put a 640×360 thumbnail, a 1280×720 wide image and a poster in `thumbs/`, and set the entry's `url` (the game's folder, e.g. `masala/index.html`) and `howTo` steps. Entries without a `url` are Fill the Holes worlds and load `game/index.html?theme=<theme>`. If the game posts a results message, add its type to `ResultStore.TYPES`.
- **Categories:** `Catalog.CATEGORIES`. Mark one `soon: true` to show a "coming soon" page.
- **Colours and fonts:** the tokens at the top of `css/portal.css`. Light and dark mode follow the device setting.

## Last result

When a child finishes a 10-level session, the game sends its summary to the page (`postMessage`, type `fill-the-holes-metrics`, `masala-sort-metrics` or `auto-out-metrics`). The game page then shows "Your last result": stars, planning score and perfect plans. This is saved only in that browser.

## Structure (one class per file)

```
index.html
css/portal.css
js/Catalog.js       site name, categories, games
js/ResultStore.js   saves each game's last result from the game's message
js/TileView.js      tile and section HTML
js/HomeView.js      home page
js/CategoryView.js  category, search and coming-soon pages
js/GameView.js      game page and player (poster → iframe, fullscreen, restart)
js/Router.js        reads the #address
js/PortalApp.js     header, footer, search, renders the chosen page
thumbs/             gameplay screenshots used as tiles, banner and posters
game/               the Fill the Holes game (all four worlds)
```

## Folders

- `game/`: Fill the Holes (all four worlds)
- `masala/`: Masala Dabba Sort
- `autoout/`: Get the Auto Out
Each is a full copy of the game's runtime. To update a game, copy its `index.html`, `css`, `js`, `data` and `assets` over the folder.
