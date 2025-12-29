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

1) If serving from a subpath, set `base` in `vite.config.ts` (e.g., `base: "/your-repo/"`).

## Vocabulary

Vocabulary lives in `src/data/hsk.json` (HSK 3.0 list). To swap in your own list, match the fields: `id`, `hanzi`, `pinyin`, `meaning`, and optional `level`/`pos` arrays.

## Meaning translations (via PRs)

The vocabulary meanings in `src/data/hsk.json` are English by default. Community translations can be contributed through PRs.

How it works:

- Create or edit a file in `src/data/meanings/<lang>.json` (for example `src/data/meanings/es.json`).
- The file is a JSON object mapping card `id` → translated meaning string.
- Only include entries you actually translate. Missing keys automatically fall back to the English meaning.

Example:

```json
{
 "hsk-03630": "en otras palabras"
}
```

Local checks:

- `npm run meanings:validate` (valid JSON, ids exist, no empty values)
- `npm run build`

## i18n

- All translations sit in `src/i18n/*.json`; register new locales in `src/i18n/index.ts`.
- The app auto-detects browser language and lets users switch from the drawer.

## Contributing

Thanks for helping improve the HSK Writing Trainer! This file explains the most common ways to contribute: bug reports, feature requests, fixes, and translations.

### Found a bug or missing content?

- Open an issue using the repo Issues tab. Provide a short summary, steps to reproduce, your device/browser (e.g., iPad Pro M2, Safari iPadOS 17), and a screenshot if helpful.

### Want to submit a fix or feature?

1. Fork the repo and create a topic branch from `main` (e.g., `fix/drawing-pad-touch` or `feat/i18n-fr`).
2. Run the app locally and verify your change.

Run in Docker (no Node install required):

```bash
docker compose up --build
```

Or run locally with Node:

```bash
npm install
npm run dev
```

1. Keep changes focused and include a clear PR description explaining what you changed and why.

### Translation contributions

- Translations live in `src/i18n/*.json`. Add a new file named after the language code (e.g., `es.json`) and mirror keys from `en.json`.
- Register the new locale in `src/i18n/index.ts` by importing the JSON and adding it to the `resources` map.
- If you submit translations, say which variant they are (Simplified/Traditional where applicable) and include a short reviewer note.

### UI / Theming

- Use CSS theme tokens in `src/index.css` (`--bg`, `--surface`, `--text`, `--accent`, `--focus`) when adding components or styles to keep themes consistent.

### Tests & Linting

- There is no extensive test suite yet; focus on manual verification. Keep TypeScript types and minimal linting in mind.

### Deploying / Pages

- The app builds to static files via Vite (`dist/`) and can be deployed to GitHub Pages. We include a `.github/workflows/pages.yml` action that builds `dist/` and publishes it.

### PR checklist

- [ ] Follows existing code style
- [ ] Runs locally (Docker or `npm run dev`)
- [ ] Includes translation updates if UI strings changed
- [ ] Short description in PR body and reference to any related issue

Thanks — we love help from learners and translators. If you want mentorship for your first PR, open an issue and tag it `help wanted`.
