*Roadmap for evolving the notebook into an AI-assisted learning system (conversation mining, real-time suggestions, analytics). Phase 1 is implemented — see the status note.*

# Notebook Enhancement Roadmap

## Status

**Phase 1 (SRS foundation + AI-ready data model) is implemented**: full SM-2 scheduling with ease factor, intervals, due dates, and leech detection; review dashboard; vocabulary/notebook services with `conversationId`-style AI-integration fields; analytics and export endpoints. See [CHANGELOG](../../CHANGELOG.md) and the [Notebook guide](../guides/notebook.md) for what exists today.

The remaining phases below are **planned, not built** — treat them as design direction, not feature documentation.

## Vision

An intelligent agent that populates the notebook from conversations (historical and real-time) on top of a complete spaced-repetition foundation: AI extraction of vocabulary and grammar, live "add to notebook" suggestions in chat, learning analytics, and smart study recommendations.

## Planned Phases

### Phase 2 — Intelligent extraction agent

- `VocabularyExtractionService`: LLM-based extraction of japanese/romaji/english/example/level/type from conversations, with confidence scores and duplicate detection
- Grammar-note generation from chat questions, linked to related vocabulary
- Pipeline endpoint `POST /api/notebooks/extract-from-conversation/:conversationId` with a user review step (approve/reject/edit)
- Batch extraction of historical conversations with a job-queue and progress endpoint

### Phase 3 — Real-time integration

- Inline "Add to Notebook" suggestions in chat responses; one-click save with context (source messages, conversation link)
- Collapsible notebook sidebar in chat: recent items, due cards, mini review widget
- User preferences: auto-extraction on/off, confidence threshold, conservative/balanced/aggressive modes, auto-add vs suggest-only

### Phase 4 — Intelligence & analytics

- ChromaDB semantic search over notebook content ("find similar notes", meaning-based duplicate detection, topic-related suggestions)
- Analytics dashboard: learning curve, retention heatmap, mastery distribution, weak points
- Smart study suggestions and daily study plans based on SRS schedule + weak areas
- Anki export (`.apkg`) preserving SM-2 progress

### Phase 5 — Polish & monetization (aspirational)

- Tier system (free / premium / pro) with usage tracking and Stripe billing hooks
- Quiz generation (multiple-choice, fill-in-the-blank, matching) with adaptive difficulty
- Mobile/PWA optimizations, push notifications for reviews
- PostgreSQL migration path via a repository abstraction (JSON kept as fallback)

## Data Model Additions (planned)

Beyond the shipped SRS fields (`easeFactor`, `interval`, `nextReviewDate`, `lapses`, `masteryLevel`):

- `conversationId` — link entries back to the source conversation
- `extractedBy` — `manual | ai | hybrid`; `confidence` — 0–1 AI score
- `metadata.extractionContext` — provenance excerpt

## Technical Notes

- New services go in `backend/services/` alongside `vocabService.js` / `notebookService.js`
- AI extraction should use `ModelProviderService` so any provider (local Ollama or cloud) can power it
- Cost controls for cloud LLMs: cache extractions in ChromaDB, batch messages per call, use a small local model for confidence pre-screening
- Scaling: JSON storage is fine for ~100 users; PostgreSQL + background job queue recommended beyond ~1,000 (a full SQL schema sketch exists in the archived original: [docs/history/NOTEBOOK_ENHANCEMENT_ROADMAP.md](../history/NOTEBOOK_ENHANCEMENT_ROADMAP.md))

## References

- [SM-2 algorithm (SuperMemo)](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Anki's modified SM-2](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html)
- [ChromaDB documentation](https://docs.trychroma.com/)
