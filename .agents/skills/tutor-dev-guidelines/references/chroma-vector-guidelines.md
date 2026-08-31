# ChromaDB / Vector Guidelines — retrieval in this project

Distilled from the Chroma docs, AltexSoft's production experience report, and vector-DB practice — mapped onto this codebase's RAG stack. Companion project docs: `docs/guides/chromadb.md`, `docs/architecture.md`, `chromaDB-development_and_AI_stuff/README.md` (fine-tuning pipeline).

## 1. Topology

- Chroma runs as a **server** on `:8000` (`CHROMA_DB_URL`, default `http://localhost:8000`), optional token auth via `CHROMA_AUTH_TOKEN` (the client in `enhancedRAGService.js` already supports both).
- Main collection: `japanese_tutor_knowledge` (grammar/learning content), HNSW `cosine` space with tuned ef/M values recorded in collection metadata.
- The browser never talks to Chroma — all vector I/O is server-side inside RAG services.
- Treat Chroma as a **rebuildable index**: the source content lives in files (`backend/data/grammar/`, notebooks); losing the collection should mean a re-index, not data loss. (Today it means re-indexing on every boot — landmine #2 in SKILL.md.)

## 2. Collection lifecycle — the cardinal rules

1. **Get-or-create is the normal path.** `initializeChromaDB()` already implements: `getCollection` → on miss → `createCollection` with metadata. Follow it.
2. **Never delete/recreate a collection in request or startup paths.** `deleteAndRecreateCollection()` (`enhancedRAGService.js:130`, invoked unconditionally at `:68`) wipes all embeddings on every boot. Until that's fixed, do not copy this call anywhere; if a task legitimately needs a reset (embedding model change, dev re-seed), gate it explicitly:

```js
if (process.env.CHROMA_RESET === 'true' && process.env.NODE_ENV !== 'production') {
  await this.deleteAndRecreateCollection();
}
```

3. First-run seeding is tracked by `backend/data/migration-status.json` — use that state file pattern for any new ingestion pipeline, so restarts don't re-ingest.
4. Dimension-mismatch handling: the code catches a failed `getCollection` compatibility check and recreates — that's the only sanctioned auto-recreate, because a dimension mismatch makes the index unusable anyway.

## 3. Embedding consistency — the #1 vector-DB rule

**The model that wrote the vectors must be the model that queries them.** Mixing models silently corrupts retrieval quality (vectors live in incompatible spaces; cosine similarity becomes noise).

- Collection metadata records `embedding_model` and `embedding_dimension`; `checkEmbeddingDimensionCompatibility()` enforces it at init — keep using it.
- This repo has multiple embedding services (`customEmbbedingsService`, `TransformerEmbeddingService` — all-MiniLM-L6-v2, `MultilingualEmbeddingService` — multilingual-e5-base, `FineTunnedEmbeddingService` — fine-tuned Japanese BERT, 384-dim). They are **not interchangeable** against the same collection. Know which one `setupCustomEmbedding()` wired up before adding ingestion or query paths.
- Changing the embedding model = deliberately re-embed everything: reset the collection (guarded, §2), re-ingest from source files, update the recorded metadata. Never partial re-embeds.
- E5-style models expect `query:`/`passage:` prefixes when the docs for the model say so — if retrieval quality tanks, check the prefixes before anything else.

## 4. Ingestion

- **Batch upserts.** Add documents in batches (dozens, not thousands per call), and don't `await` per item inside a loop — `Promise.all` over small batches. Large single payloads spike Chroma memory; per-item awaits are slow.
- **Deterministic IDs prevent duplicates** on re-ingestion — e.g., `${sourceFile}:${chunkIndex}` or a hash of `source + content`. Chroma upserts by ID; random IDs re-add the same content forever.
- **Metadata on every document**: at minimum `source`, `type`/`topic`, `createdAt` — metadata is what makes `where` filters (§5) possible later. Keep metadata values primitive (string/number/bool).
- Chunk with overlap, keep chunks roughly uniform (a few hundred tokens), and store the original source reference so RAG answers can cite where content came from.

## 5. Querying

- `n_results` 5–10 is the sane range for RAG context windows; more just dilutes the prompt and costs latency.
- **Scope queries with `where` filters** when the corpus has multiple content types (grammar vs notebook vs future corpora): `{ corpus: { $eq: 'grammar' } }`. Don't retrieve across corpora and filter afterwards.
- Request `metadatas` + `documents` + `distances`, and use a distance threshold to decide what's actually relevant enough to inject into the LLM prompt — unrelated chunks degrade answers.
- Query-time latency is dominated by embedding the query; batch user queries if a feature needs several searches.

## 6. User content & privacy in the vector store

- Shared learning content (grammar, curated material) belongs in `japanese_tutor_knowledge`.
- **User-authored content (notebooks, conversation history) must be scoped per user** if vector-indexed: either a `userId` metadata field with a **mandatory** `where: { userId }` filter on every query, or a per-user collection. A missing filter leaks one user's notes into another's retrieval — this is the RAG equivalent of an IDOR. `HistoryRAGService` (privacy-aware) is the established precedent; follow its pattern.
- `docs/plans/notebook-roadmap.md` plans notebook semantic search + caching LLM extractions in Chroma — when implementing, that's the user-scoping requirement in play.

## 7. Where new vector code goes

Plug into the existing pipeline instead of adding ad-hoc `ChromaClient`s:

- `enhancedRAGService.js` — base retrieval (keyword + vector, always-on), owns the collection lifecycle.
- `IntegratedRAGService.js` — hybrid search, query expansion (Kuromoji), cross-encoder re-ranking.
- `HistoryRAGService.js` — privacy-aware conversation memory.
- `TutoreOrchestratorService.js` — combines RAG + internet augmentation + context for the LLM.

New retrieval features = new methods/services that consume these, mounted behind existing routes/controllers — never a `ChromaClient` constructed inside a controller.

## 8. Operations

- Health: `heartbeat()` at init, exposed via `/api/chromadb/health`; stats via `/api/rag/chroma-stats`. Reuse those endpoints rather than adding probes.
- Init failure already falls back to legacy keyword mode (`useChromaDB = false`) — preserve graceful degradation; the readiness middleware keeps `/api` from serving before init completes.
- Back up the Chroma server's data directory if re-indexing source files is expensive; otherwise the source-files-are-truth model is the backup.
- Scale expectations (AltexSoft's production write-up): Chroma is comfortable at this project's scale (thousands–low hundreds of thousands of vectors); watch query latency and server memory as notebook indexing grows, and keep Chroma on an internal network only (`:8000` must never be publicly reachable).

## Sources

- [Chroma documentation](https://docs.trychroma.com/)
- [AltexSoft — Good and Bad of ChromaDB for RAG (production experience)](https://www.altexsoft.com/blog/chroma-pros-and-cons/)
- [DataQuest — Vector databases using ChromaDB (ANN indexing)](https://www.dataquest.io/blog/introduction-to-vector-databases-using-chromadb/)
- [DataCamp — ChromaDB step-by-step tutorial](https://www.datacamp.com/tutorial/chromadb-tutorial-step-by-step-guide)
- Project docs: `docs/guides/chromadb.md`, `docs/architecture.md`, `chromaDB-development_and_AI_stuff/README.md`
