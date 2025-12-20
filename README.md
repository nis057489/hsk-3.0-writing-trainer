# HSK 3 Writing Trainer (React + TypeScript + Docker)

A simple handwriting practice web app (canvas) optimized for tablet use (iPad + Apple Pencil works in Safari).

The HSK 3.0 test requires handwriting at all levels. I didn't find a good handwriting practice app out there so I vibe coded this one.

## Features

- Flashcard + sentence tracing modes with spaced repetition scheduling
- i18n with English/中文 (add more in `src/i18n/*.json`)
- Light/Dark/High-Contrast themes with a user-selectable toggle
- Tablet-friendly drawing pad with palm/pinch blocking

## Dev (Docker)

```bash
docker compose up --build
```

Open <http://localhost:5173>

> Everything runs in Docker; no local Node install is required. Add dependencies by editing `package.json` and rebuilding.

## Prod (Docker)

```bash
docker build -t hsk3-writing-trainer --target prod .
docker run --rm -p 8080:80 hsk3-writing-trainer
```

Open <http://localhost:8080>

## Edit vocabulary

Replace `src/data/hsk3.sample.json` with your own list, keeping fields:
`id`, `hanzi`, `pinyin`, `meaning`.

## i18n

- Translations live in `src/i18n/en.json` and `src/i18n/zh.json`.
- To add a language, create `src/i18n/<lang>.json` mirroring the keys and register it in `src/i18n/index.ts`.
- Language can be switched from the drawer dropdown; browser language is detected by default.

## Theming

- Theme tokens are defined in `src/index.css` (`--bg`, `--surface`, `--text`, `--accent`, etc.).
- Supported themes: Light, Dark, High Contrast, and System. Switch themes from the drawer dropdown.
- Focus outlines use `--focus`; ensure new components respect tokenized colors and borders.

## Acknowledgements

Shout out to @drkameleon for the [JSON HSK word lists](https://github.com/drkameleon/complete-hsk-vocabulary/tree/main) - that made this much easier and better!
