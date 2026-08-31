*How to use the notebook: vocabulary with SM-2 spaced repetition, exercises, study guides, analytics, and export.*

# Notebook Guide

Open the notebook at <http://localhost:3000/notebook.html> (also linked from the app sidebar). Data is stored server-side per user in `backend/data/` (JSON files), with a localStorage fallback so the page still works if the backend is briefly unavailable.

## Vocabulary

Add, edit, search, and filter vocabulary entries. Each entry holds the Japanese word, romaji reading, English meaning, JLPT level (N5–N1), word type, an example sentence, notes, and tags.

Example entry (stored fields):

```json
{
  "japanese": "日本語",
  "romaji": "nihongo",
  "english": "Japanese language",
  "level": "N5",
  "type": "noun",
  "example": "日本語を勉強しています",
  "tags": ["language", "basic"],
  "masteryLevel": 0,
  "easeFactor": 2.5,
  "interval": 1,
  "nextReviewDate": "2026-01-02T00:00:00Z"
}
```

## Spaced Repetition (SM-2)

Reviews use the SM-2 algorithm:

- After each review you rate difficulty (1–5); the scheduler computes the next interval and ease factor.
- `GET /api/notebooks/vocabulary/review/due` returns today's due cards — surfaced in the **Review Dashboard** section of the notebook.
- Mastery is tracked on a 0–5 scale.
- **Leeches** (cards failed 8+ times, via `/api/notebooks/vocabulary/review/leeches`) are flagged so you can re-study or suspend them.

## Exercises & Study Guides

- **Exercises** (`/api/notebooks/exercises`) — practice items you create and track.
- **Guides** (`/api/notebooks/guides`) — study notes, linkable to related vocabulary entries.
- Notebook entries support types (note/exercise/guide), categories, difficulty, tags, vocabulary links (`/api/notebooks/:id/link-vocabulary`), and practice-session recording (`/api/notebooks/:id/practice`).

## Analytics & Export

- **Analytics:** vocabulary stats, notebook stats, and a combined learning overview (`/api/notebooks/stats/overview`).
- **Export:** `/api/notebooks/export/vocabulary` and `/api/notebooks/export/notebooks` download your data as JSON.

## API Summary

| Group | Endpoints |
|-------|-----------|
| Health | `GET /api/notebooks/health` |
| Vocabulary CRUD | `GET/POST /api/notebooks/vocabulary`, `GET/PUT/DELETE /api/notebooks/vocabulary/:id` |
| Review | `POST /api/notebooks/vocabulary/:id/review`, `GET .../review/due`, `GET .../review/leeches` |
| Notebooks CRUD | `GET/POST /api/notebooks/`, `GET/PUT/DELETE /api/notebooks/:id` |
| Linking & practice | `POST/DELETE /api/notebooks/:id/link-vocabulary`, `GET /api/notebooks/:id/vocabulary`, `POST /api/notebooks/:id/practice` |
| Exercises & guides | `GET/POST /api/notebooks/exercises`, `GET/POST /api/notebooks/guides` |
| Analytics | `GET /api/notebooks/stats/vocabulary`, `GET /api/notebooks/stats/notebooks`, `GET /api/notebooks/stats/overview` |
| Export | `GET /api/notebooks/export/vocabulary`, `GET /api/notebooks/export/notebooks` |

Quick check from a terminal:

```bash
curl http://localhost:3000/api/notebooks/health
curl -X POST http://localhost:3000/api/notebooks/vocabulary \
  -H "Content-Type: application/json" \
  -d '{"japanese":"こんにちは","romaji":"konnichiwa","english":"hello"}'
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Health check fails | Check server logs for service initialization errors. |
| Data not persisting | Verify write permissions on `backend/data/vocabulary/` and `backend/data/notebooks/`. |
| Frontend errors | Check the browser console; the page falls back to localStorage when the API is unreachable. |

Planned improvements (AI extraction from conversations, quizzes, Anki export, etc.) are tracked in the [notebook roadmap](../plans/notebook-roadmap.md).
