# HSK Writing Trainer (HSK 3.0 friendly)

Practice handwriting for the HSK with a tablet-ready React app. Trace characters, drill with spaced repetition, and switch UI languages to match how you study.

![Home](img/1.PNG)
![Flashcard + Pad](img/2.PNG)
![Sentence Practice](img/3.PNG)

## Live demo

Try the hosted version: <https://nis057489.github.io/hsk-3.0-writing-trainer/>

## Why learners like it

- Spaced repetition flashcards plus sentence tracing to mimic HSK writing prompts
- Tracing grid with palm/pinch blocking; optional Pencil hover indicator (M2 iPad Pro + Pencil 2)
- Multi-language UI: English, 简体中文, 繁體中文, Español, Français, Tiếng Việt, Filipino, 한국어, العربية, Русский, Türkçe, हिन्दी, فارسی, Português
- Themes: Light, Dark, High Contrast, or follow system
- Remembers your language/theme/preferences between sessions

## How to use

1) Open the menu (☰) → choose Flashcard or Sentence mode.  
2) Flashcard mode: tap a card to reveal pinyin/meaning, then grade (Again/Hard/Good/Easy). Queue orders itself with spaced repetition.  
3) Sentence mode: paste/type characters and trace each box.  
4) Toggle tracing mode for a light character watermark, and switch Simplified/Traditional display.  
5) Set left-handed layout if you hold the iPad/Pencil on the left.

## Run locally (Docker)

```bash
docker compose up --build
```

Open <http://localhost:5173>. Everything runs inside Docker—no local Node install needed.

## Build / preview (Node)

```bash
npm install
npm run dev      # localhost:5173
npm run build    # outputs dist/
npm run preview  # serves the built app
```

## Deploy free on GitHub Pages

Yes. Vite builds a static site you can host on GitHub Pages for free. Minimal steps:

1) `npm install && npm run build` (or run inside CI).  
2) Publish the `dist/` folder to GitHub Pages (e.g., a `gh-pages` branch or the official Pages GitHub Action).  

- Using Actions: enable Pages → GitHub Actions in repo settings, then add a workflow that runs `npm ci`, `npm run build`, and uploads `dist/` with `actions/upload-pages-artifact` followed by `actions/deploy-pages`.  

3) If serving from a subpath, set `base` in `vite.config.ts` (e.g., `base: "/your-repo/"`).

## Vocabulary

Vocabulary lives in `src/data/hsk.json` (HSK 3.0 list). To swap in your own list, match the fields: `id`, `hanzi`, `pinyin`, `meaning`, and optional `level`/`pos` arrays.

## i18n

- All translations sit in `src/i18n/*.json`; register new locales in `src/i18n/index.ts`.
- The app auto-detects browser language and lets users switch from the drawer.

## Theming tokens

- Theme variables are defined in `src/index.css` (`--bg`, `--surface`, `--text`, `--accent`, etc.). Respect tokens when styling new components.

## Credits

Vocabulary source: [@drkameleon’s HSK lists](https://github.com/drkameleon/complete-hsk-vocabulary/tree/main). Thanks!
