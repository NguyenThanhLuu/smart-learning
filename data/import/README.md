# Import data

Place optional legacy exports here using these exact names:

- `users.json` (required)
- `articles.json`
- `vocabulary.json`

Each file can be a JSON array or an object shaped as `{ "data": [...] }`.
The importer accepts both the existing camelCase fields (`userId`,
`timesReviewed`, `reviewDate`, `highlightTo`) and snake_case equivalents.

Run `npm run import:data`. To import from another directory, run:

```bash
npm run import:data -- --dir=D:\path\to\exports
```

The import is idempotent when the source rows include their original `id`.
JSON export files in this folder are ignored by Git because they can contain
private data and login codes.
