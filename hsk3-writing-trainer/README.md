# HSK 3 Writing Trainer (React + TypeScript + Docker)

A simple handwriting practice web app (canvas) optimized for tablet use (iPad + Apple Pencil works in Safari).

## Dev (Docker)
```bash
docker compose up --build
```
Open http://localhost:5173

## Prod (Docker)
```bash
docker build -t hsk3-writing-trainer --target prod .
docker run --rm -p 8080:80 hsk3-writing-trainer
```
Open http://localhost:8080

## Edit vocabulary
Replace `src/data/hsk3.sample.json` with your own list, keeping fields:
`id`, `hanzi`, `pinyin`, `meaning`.
