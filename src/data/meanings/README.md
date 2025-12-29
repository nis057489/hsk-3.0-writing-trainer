# Meaning translations (community PRs)

This folder holds optional community translations for the vocabulary `meaning` field.

## File format

Create a JSON file named after the UI locale code, for example:

- `es.json`
- `fr.json`
- `pt.json`
- `zh-Hant.json`

Each file is a simple map from card `id` (from `src/data/hsk.json`) to the translated meaning string:

```json
{
  "hsk-03630": "in other words"
}
```

## Guidelines

- Only include entries you have actually translated. Missing keys fall back to the English meaning in `src/data/hsk.json`.
- Don’t add empty strings. If you don’t know a translation yet, omit the key.
- Keep the existing meaning structure when possible (multiple senses separated by `;`).

## Validation

Run:

- `npm run meanings:validate`

This checks that all keys exist in `src/data/hsk.json` and all values are non-empty strings.
