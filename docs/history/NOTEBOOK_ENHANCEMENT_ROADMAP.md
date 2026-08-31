# 📚 Notebook Enhancement Roadmap - Intelligent Agent Integration

**Project**: Japanese Tutor AI
**Feature**: Intelligent Notebook with AI Auto-Population
**Philosophy**: Kaizen (Continuous Incremental Improvement)
**Timeline**: 10 weeks (incremental releases)
**Last Updated**: January 2025

---

## 🎯 Vision

Build an intelligent agent that automatically populates the notebook from conversations (both historical and real-time), with a complete SRS (Spaced Repetition System) foundation for effective learning.

**Key Features**:
- ✅ Complete SM-2 spaced repetition algorithm
- 🤖 AI agent extracts vocabulary & grammar from conversations
- ⚡ Real-time suggestions during chat
- 📊 Learning analytics & progress tracking
- 🎯 Smart study recommendations
- 💰 Premium tier with unlimited AI features

---

## 📅 Implementation Plan

### **Phase 1: Foundation & SRS Completion** (Week 1-2)
**Goal**: Complete the spaced repetition system and prepare data structures for AI integration

#### Tasks:

**1. Complete SM-2 Algorithm** (2-3 days)
- [ ] Add `easeFactor` field (1.3-2.5, starts at 2.5)
- [ ] Add `interval` field (days until next review)
- [ ] Add `nextReviewDate` field (exact date/time for next review)
- [ ] Add `lapses` field (number of times card failed)
- [ ] Implement full SM-2 with proper interval calculation:
  ```
  If score >= 3 (good):
    interval = interval * easeFactor
    easeFactor = max(1.3, easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02)))
  Else (poor):
    interval = 1
    easeFactor = max(1.3, easeFactor - 0.2)
    lapses++
  ```
- [ ] Add daily review limits (new cards: 20, reviews: 100)
- [ ] Implement leeches detection (lapses >= 8)
- [ ] Add "suspend card" feature for leeches

**2. Enhance Data Models for AI** (1-2 days)
- [ ] Add `conversationId` field to vocabulary schema
- [ ] Add `conversationId` field to notebook entries schema
- [ ] Add `extractedBy` field ('manual' | 'ai' | 'hybrid')
- [ ] Add `confidence` score (0-1) for AI extractions
- [ ] Add `metadata.extractionContext` for provenance tracking
- [ ] Update import/export to handle new fields

**3. UI Polish for Review System** (2 days)
- [ ] Daily review dashboard showing due cards
- [ ] Progress visualization with Chart.js:
  - Learning curve (vocab growth over time)
  - Retention heatmap (calendar view)
  - Mastery distribution pie chart
- [ ] Review session interface with keyboard shortcuts:
  - `1` = Again, `2` = Hard, `3` = Good, `4` = Easy
  - `Space` = Flip card
  - `Esc` = Exit review
- [ ] Statistics panel:
  - Retention rate (% remembered)
  - Learning velocity (words/day)
  - Streak counter
- [ ] Session summary after review (accuracy, time spent)

**Deliverable**: Complete SRS that rivals Anki + data structures ready for AI

---

### **Phase 2: Intelligent Extraction Agent** (Week 3-4)
**Goal**: Build AI agent that extracts vocabulary and notes from conversations

#### Tasks:

**1. Vocabulary Extraction Service** (3-4 days)
- [ ] Create `backend/services/VocabularyExtractionService.js`
- [ ] Use LLM (via ModelProviderService) to extract Japanese vocabulary
- [ ] Extract fields:
  - `japanese` (word/phrase)
  - `romaji` (reading)
  - `english` (meaning)
  - `example` (sentence from conversation)
  - `level` (JLPT level: N5-N1)
  - `type` (noun, verb, adjective, etc.)
- [ ] Support batch extraction (process multiple messages at once)
- [ ] Add confidence scoring (0-1 based on LLM certainty)
- [ ] Implement duplicate detection (check existing vocabulary)
- [ ] Add extraction prompt templates (optimized for different LLMs)

**2. Grammar Note Generation Service** (2-3 days)
- [ ] Create `backend/services/GrammarNoteGenerationService.js`
- [ ] Detect grammar patterns from user questions
- [ ] Generate explanations with:
  - Grammar rule description
  - Examples from conversation context
  - Usage guidelines
  - Common mistakes
- [ ] Link generated notes to relevant vocabulary
- [ ] Support custom note templates

**3. Conversation → Notebook Pipeline** (2-3 days)
- [ ] Add endpoint: `POST /api/notebooks/extract-from-conversation/:conversationId`
- [ ] Process conversation messages to extract:
  - Vocabulary items
  - Grammar notes
  - Study exercises (optional)
- [ ] Store with `conversationId` linkage
- [ ] Handle duplicate detection (don't re-add existing)
- [ ] Return extraction summary (added, skipped, confidence scores)
- [ ] Add user review step (approve/reject/edit extractions)

**4. Historical Batch Processing** (1 day)
- [ ] Add endpoint: `POST /api/notebooks/batch-extract`
- [ ] Accept date range or conversation IDs
- [ ] Process past conversations in background (job queue)
- [ ] Progress tracking endpoint: `GET /api/notebooks/batch-extract/status/:jobId`
- [ ] Send notification when complete (via WebSocket or polling)

**Deliverable**: AI agent that can mine conversations for learning content

---

### **Phase 3: Real-Time Integration** (Week 5-6)
**Goal**: Automatically suggest notebook additions during live conversations

#### Tasks:

**1. Real-Time Vocabulary Detection** (2-3 days)
- [ ] Hook into chat API response pipeline
- [ ] Detect new vocabulary in AI responses (before sending to user)
- [ ] Show inline "Add to Notebook" suggestions in chat UI:
  ```
  AI Response: "...learn the word 食べる (taberu)..."
  [💾 Add "食べる" to Notebook]
  ```
- [ ] Quick-add with one click (saves with AI-generated metadata)
- [ ] Edit modal for reviewing before final save
- [ ] Toast notifications for successful additions

**2. Smart Context Preservation** (2 days)
- [ ] When saving from chat, include:
  - Full message text (user question + AI response)
  - Surrounding context (previous 2-3 messages)
  - Conversation topic/title
- [ ] Link vocabulary to specific message exchange
- [ ] Enable "Show in conversation" feature:
  - Jump back to source message
  - Highlight vocabulary in context
- [ ] Store extraction timestamp and conversation state

**3. Notebook Sidebar in Chat** (2-3 days)
- [ ] Add collapsible sidebar to chat interface (right side)
- [ ] Show sections:
  - Recently added items (last 10)
  - Due for review (next 5 cards)
  - Today's stats (added, reviewed, streak)
- [ ] Quick review widget:
  - Mini flashcard interface
  - Review directly from chat
  - Updates stats in real-time
- [ ] Search notebook from chat
- [ ] Drag-and-drop text to notebook

**4. User Preferences** (1 day)
- [ ] Add settings panel for notebook preferences:
  - Toggle auto-extraction (on/off)
  - Confidence threshold (0-1, default: 0.7)
  - Extraction aggressiveness:
    - Conservative (only obvious vocabulary)
    - Balanced (default)
    - Aggressive (extract everything possible)
  - Auto-add vs. suggest-only mode
  - Daily review notification time
- [ ] Save preferences to user profile
- [ ] Apply preferences during extraction

**Deliverable**: Seamless chat ↔ notebook integration with real-time suggestions

---

### **Phase 4: Intelligence & Analytics** (Week 7-8)
**Goal**: Make the agent smarter and provide actionable insights

#### Tasks:

**1. ChromaDB Semantic Search** (2-3 days)
- [ ] Create ChromaDB collection for notebook content
- [ ] Index vocabulary entries (japanese, english, example)
- [ ] Index notebook entries (title, content)
- [ ] Add endpoint: `GET /api/notebooks/search/semantic?query=...`
- [ ] Implement "Find similar notes" feature
- [ ] Semantic vocabulary search (meaning-based, not just text)
- [ ] Recommended content based on current conversation:
  - Detect topic from last 5 messages
  - Find related vocabulary/notes
  - Show in sidebar: "Related to current topic"
- [ ] Duplicate detection (semantic, not just text match)

**2. Learning Analytics Dashboard** (2-3 days)
- [ ] Create new page: `/notebook/analytics`
- [ ] Charts with Chart.js:
  - **Learning curve**: Vocabulary growth over time (line chart)
  - **Retention heatmap**: Calendar view showing review activity
  - **Mastery distribution**: Pie chart (new, learning, mature, leeches)
  - **Study time**: Bar chart by day/week/month
  - **Weak points**: Topics/grammar with low retention
- [ ] Conversation mining stats:
  - Extractions per conversation
  - Auto-add accuracy (user edit rate)
  - Most productive conversations
- [ ] Export analytics as PDF report (future)

**3. Smart Study Suggestions** (2 days)
- [ ] AI recommends what to study next based on:
  - **SRS schedule**: Cards due for review
  - **Weak areas**: Low retention topics/grammar
  - **Recent conversation topics**: Contextual learning
  - **Learning goals**: User-defined targets
- [ ] Study session generator:
  - Create themed sessions (e.g., "Food vocabulary")
  - Mix new cards + reviews
  - Adaptive difficulty
- [ ] Daily study plan (morning summary):
  - "Good morning! Today you have:"
  - X new cards, Y reviews
  - Suggested focus: [topic]
  - Estimated time: Z minutes

**4. Export to Anki** (1 day)
- [ ] Add endpoint: `GET /api/notebooks/export/anki`
- [ ] Generate Anki deck (.apkg format) using genanki or similar
- [ ] Preserve SRS progress:
  - Map interval → Anki interval
  - Map easeFactor → Anki ease
  - Map lapses → Anki lapses
- [ ] Support deck customization:
  - Card template (front/back design)
  - Include/exclude fields
  - Filter by tags, level, date range
- [ ] Future: Two-way sync (import Anki progress back)

**Deliverable**: Smart agent that knows what you should study and when

---

### **Phase 5: Polish & Premium Features** (Week 9-10)
**Goal**: Prepare for monetization and production deployment

#### Tasks:

**1. Premium AI Features** (3 days)
- [ ] Implement tier system:
  - **Free**: Manual entry, 10 AI extractions/month, basic SRS
  - **Premium** ($4.99/month): Unlimited AI, real-time suggestions, analytics, export
  - **Pro** ($9.99/month): All Premium + custom agents, API access
- [ ] Usage tracking:
  - Count AI extractions per user per month
  - Reset counter on billing cycle
  - Show usage in settings: "7/10 extractions used"
- [ ] Upgrade prompts:
  - "You've used all free extractions. Upgrade to Premium?"
  - Show feature comparison table
- [ ] Billing integration hooks (Stripe):
  - Checkout page
  - Subscription management
  - Webhook handlers (payment success/failure)
- [ ] Admin dashboard:
  - User usage stats
  - Conversion metrics
  - Revenue tracking

**2. Quiz Generation** (2-3 days)
- [ ] Auto-generate quizzes from vocabulary:
  - **Multiple-choice**: 4 options, 1 correct
  - **Fill-in-the-blank**: From example sentences
  - **Matching**: Japanese ↔ English pairs
  - **True/False**: Grammar statements
- [ ] Adaptive difficulty:
  - Easy quizzes for new cards (masteryLevel < 3)
  - Hard quizzes for mature cards (masteryLevel >= 5)
  - Mix difficulty levels in practice mode
- [ ] Score tracking:
  - Quiz history (date, score, time)
  - Accuracy by topic/level
  - Improvement over time
- [ ] Wrong answer review:
  - Save incorrect answers
  - Create review session for mistakes
  - Spaced repetition for missed items

**3. Mobile Optimizations** (2 days)
- [ ] Touch-friendly review interface:
  - Larger tap targets
  - Swipe gestures:
    - Swipe left = Again
    - Swipe right = Good
    - Tap = Flip card
- [ ] Responsive layout for all notebook pages
- [ ] Offline-first with service worker (basic PWA):
  - Cache vocabulary data
  - Sync when back online
  - Show offline indicator
- [ ] Push notifications for daily reviews (opt-in):
  - Request permission on first use
  - Schedule notification for user's preferred time
  - "You have 12 cards due for review!"

**4. PostgreSQL Migration Prep** (2 days)
- [ ] Create migration scripts:
  - Export JSON to SQL INSERT statements
  - Schema definition (CREATE TABLE)
  - Foreign key relationships
- [ ] Add database abstraction layer:
  - Create `VocabularyRepository` interface
  - Implement `JSONVocabularyRepository` (current)
  - Implement `PostgreSQLVocabularyRepository` (new)
  - Switch via config flag
- [ ] Test with your separate PostgreSQL work
- [ ] Keep JSON as fallback:
  - Auto-fallback if PostgreSQL unavailable
  - Smooth transition path
- [ ] Performance benchmarks (JSON vs. PostgreSQL)

**Deliverable**: Production-ready notebook with premium AI features

---

## 🔮 Future Phases (Post-Launch)

### **Phase 6: Advanced AI Agent** (Month 3-4)
- Multi-agent system:
  - Vocabulary extraction agent
  - Grammar explanation agent
  - Kanji learning agent
  - Pronunciation coach agent
- Personalized learning path generation
- Predictive analytics (forecast when you'll reach N3/N2 level)
- Collaborative study groups with shared notebooks
- Voice input/output for pronunciation practice

### **Phase 7: Ecosystem Integration** (Month 5-6)
- Browser extension for mining any Japanese content:
  - Highlight unknown words
  - One-click add to notebook
  - Works on YouTube, news sites, Twitter, etc.
- Mobile app (React Native?):
  - Native iOS/Android app
  - Full offline mode
  - Sync with web version
- API for third-party integrations:
  - RESTful API with authentication
  - Webhooks for events
  - Developer documentation
- Community marketplace:
  - User-created vocabulary decks
  - Share and import decks
  - Rating and reviews

---

## 🎯 Success Metrics

### **Phase 1-2**: Foundation
- ✅ SRS retention rate > 85% (industry standard)
- ✅ AI extraction accuracy > 90% (vocabulary)
- ✅ Average 50+ vocabulary extracted per conversation
- ✅ User completes daily reviews 5+ days/week

### **Phase 3-4**: Integration
- ✅ 80% of users enable auto-extraction
- ✅ Average daily review rate > 20 cards/day
- ✅ User engagement +50% (time spent in notebook)
- ✅ Conversation → Notebook conversion rate > 60%

### **Phase 5**: Monetization
- ✅ 15-20% conversion to premium (industry avg: 2-5%, we aim higher)
- ✅ Average LTV: $30-50/user (if $5/month × 6-10 months avg)
- ✅ Churn rate < 10%/month
- ✅ Net Promoter Score (NPS) > 50

---

## 💰 Premium Tier Structure

### **Free Tier**
- ✅ Manual vocabulary addition (unlimited)
- ✅ Basic SRS (SM-2 algorithm)
- ✅ 10 AI extractions per month
- ✅ Basic statistics
- ✅ Export to CSV/JSON
- ⚠️ Daily review limit: 50 cards

### **Premium** ($4.99/month or $49.99/year)
- ✅ **Unlimited AI extractions**
- ✅ Real-time notebook suggestions in chat
- ✅ Advanced analytics dashboard
- ✅ Quiz generation (unlimited)
- ✅ Export to Anki format
- ✅ Priority support
- ✅ ChromaDB semantic search
- ✅ No daily review limits
- ✅ Custom card templates
- ✅ Push notifications

### **Pro** ($9.99/month or $99.99/year)
- ✅ **All Premium features**
- ✅ Multi-agent study planning
- ✅ Custom learning paths
- ✅ Collaboration features (future):
  - Study groups
  - Shared decks
  - Teacher dashboard
- ✅ API access (1000 requests/day)
- ✅ Advanced export options (PDF, Quizlet, Memrise)
- ✅ Priority AI processing (faster extractions)
- ✅ Early access to new features

---

## 🛠️ Technical Architecture

### **Backend Services**

```
backend/services/
├── vocabService.js                  [EXISTING] Basic vocabulary CRUD
├── notebookService.js               [EXISTING] Basic notebook CRUD
├── VocabularyExtractionService.js   [NEW] AI vocabulary extraction
├── GrammarNoteGenerationService.js  [NEW] AI grammar note generation
└── SRSService.js                    [NEW] Spaced repetition logic (optional refactor)
```

### **Data Models**

#### **Vocabulary Entry (Enhanced)**
```javascript
{
  id: string,
  japanese: string,
  romaji: string,
  english: string,
  level: 'N5'|'N4'|'N3'|'N2'|'N1',
  type: 'noun'|'verb'|'adjective'|'adverb'|'particle',
  example: string,
  notes: string,
  tags: string[],

  // SRS Fields
  addedDate: ISO8601,
  reviewCount: number,
  masteryLevel: number,      // Legacy (backwards compat)
  easeFactor: number,         // 1.3-2.5 (SM-2)
  interval: number,           // Days until next review
  nextReviewDate: ISO8601,
  lastReviewed: ISO8601,
  lapses: number,             // Failed review count

  // AI Integration Fields
  conversationId: string,     // Link to source conversation
  extractedBy: 'manual'|'ai'|'hybrid',
  confidence: number,         // 0-1 (AI extraction confidence)

  // Metadata
  metadata: {
    extractionContext: string,  // Conversation excerpt
    audioUrl: string,           // Future: pronunciation audio
    imageUrl: string            // Future: visual aid
  }
}
```

#### **Notebook Entry (Enhanced)**
```javascript
{
  id: string,
  title: string,
  content: string,
  type: 'note'|'exercise'|'guide',
  category: 'grammar'|'kanji'|'culture'|'general',
  difficulty: 'beginner'|'intermediate'|'advanced',
  tags: string[],

  // Linking
  vocabularyIds: string[],
  conversationId: string,

  // SRS for notes (optional)
  masteryLevel: number,
  practiceCount: number,
  lastPracticed: ISO8601,

  // AI Integration
  extractedBy: 'manual'|'ai'|'hybrid',
  confidence: number,

  // Timestamps
  createdAt: ISO8601,
  updatedAt: ISO8601,

  // Metadata
  metadata: object
}
```

### **PostgreSQL Schema (Future)**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  tier VARCHAR(20) DEFAULT 'free', -- free, premium, pro
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  japanese TEXT NOT NULL,
  romaji TEXT,
  english TEXT NOT NULL,
  level VARCHAR(10),
  type VARCHAR(50),
  example TEXT,
  notes TEXT,
  tags TEXT[],

  -- SRS fields
  added_date TIMESTAMP DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  mastery_level INTEGER DEFAULT 0,
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  next_review_date TIMESTAMP,
  last_reviewed TIMESTAMP,
  lapses INTEGER DEFAULT 0,

  -- AI fields
  conversation_id UUID REFERENCES conversations(id),
  extracted_by VARCHAR(20) DEFAULT 'manual',
  confidence DECIMAL(3,2) DEFAULT 1.0,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  CONSTRAINT unique_vocab_per_user UNIQUE(user_id, japanese, english)
);

CREATE INDEX idx_vocab_user_id ON vocabulary(user_id);
CREATE INDEX idx_vocab_next_review ON vocabulary(user_id, next_review_date);
CREATE INDEX idx_vocab_level ON vocabulary(level);
CREATE INDEX idx_vocab_tags ON vocabulary USING GIN(tags);

CREATE TABLE notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  content TEXT,
  type VARCHAR(50),
  category VARCHAR(50),
  difficulty VARCHAR(20),
  tags TEXT[],

  -- Linking
  vocabulary_ids UUID[],
  conversation_id UUID,

  -- SRS
  mastery_level INTEGER DEFAULT 0,
  practice_count INTEGER DEFAULT 0,
  last_practiced TIMESTAMP,

  -- AI
  extracted_by VARCHAR(20) DEFAULT 'manual',
  confidence DECIMAL(3,2) DEFAULT 1.0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX idx_notebooks_category ON notebooks(category);
CREATE INDEX idx_notebooks_tags ON notebooks USING GIN(tags);

-- Full-text search (Japanese + English)
ALTER TABLE vocabulary ADD COLUMN search_vector tsvector;
UPDATE vocabulary SET search_vector =
  to_tsvector('english', coalesce(english,'') || ' ' || coalesce(romaji,''));
CREATE INDEX idx_vocab_search ON vocabulary USING GIN(search_vector);
```

### **AI Cost Optimization** (for cloud)

**Strategies:**
1. **Cache LLM extractions** in ChromaDB
   - Store: query → extracted vocabulary mapping
   - Reuse for similar conversations
   - Save ~70% of API calls

2. **Batch processing**
   - Extract from 5-10 messages at once (not individually)
   - Single LLM call instead of 10
   - Save ~80% of API costs

3. **Model tiering**
   - Free tier: Local Llama 3.2 (via Ollama) - $0
   - Premium: GPT-4o-mini - ~$0.15 per 1M input tokens
   - Pro: GPT-4o - ~$2.50 per 1M input tokens

4. **Confidence scoring**
   - Use smaller local model for confidence (free)
   - Only send to cloud LLM if confidence > 0.5
   - Save ~50% of API calls

5. **Prompt optimization**
   - Compress prompts (remove fluff)
   - Use structured output (JSON mode)
   - Typical extraction: ~500 tokens input + 200 output = $0.0001 per conversation

**Estimated Costs** (100 users, 50 conversations/month each):
- Total conversations: 5,000/month
- API cost (GPT-4o-mini): 5000 × $0.0001 = **$0.50/month**
- With caching: ~**$0.15/month**
- Revenue (15% conversion × $4.99): **$75/month**
- Profit margin: **99.8%** (excluding infrastructure)

### **Scalability Considerations**

#### **For 100 users:**
- Current JSON files: ✅ Fine
- PostgreSQL: Overkill but good practice
- ChromaDB: ✅ Recommended (semantic search value)

#### **For 1,000 users:**
- PostgreSQL: ✅ Recommended
- Redis caching: ✅ Recommended (session data)
- Background jobs: ✅ Required (Bull/BullMQ for batch extraction)
- CDN: Optional

#### **For 10,000+ users:**
- PostgreSQL with read replicas
- Redis cluster
- Background job queue (Bull)
- CDN for static assets (CloudFlare)
- Rate limiting (100 req/hour free, unlimited premium)
- Horizontal scaling (multiple server instances)

---

## 🚀 Getting Started

### **Next Sprint (Week 1-2): Phase 1**

**Priority Tasks:**
1. ✅ Complete SM-2 SRS algorithm (most impactful for learning)
2. ✅ Add conversationId linking to data models
3. ✅ Basic stats dashboard with Chart.js
4. ✅ Polish review UI (make it addictive!)

**Success Criteria:**
- Users can review vocabulary with proper SRS scheduling
- Retention rate measurable (compare before/after)
- Data model ready for Phase 2 AI integration

---

## 📚 Resources

### **SRS Algorithm References:**
- [SM-2 Algorithm Specification](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2) (SuperMemo)
- [Anki's Modified SM-2](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html)
- [FSRS (Free Spaced Repetition Scheduler)](https://github.com/open-spaced-repetition/fsrs4anki) - Next-gen SRS

### **AI Extraction:**
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [LangChain Extraction Chains](https://python.langchain.com/docs/use_cases/extraction/)

### **ChromaDB:**
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Semantic Search Tutorial](https://www.pinecone.io/learn/semantic-search/)

### **PostgreSQL + JSON:**
- [JSONB in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)
- [Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)

---

## 📝 Notes

**Development Philosophy:**
- **Kaizen** (改善): Continuous incremental improvement
- **Mottainai** (もったいない): Don't waste (reuse existing infrastructure)
- **Omotenashi** (おもてなし): User-first design (anticipate needs)

**Testing Strategy:**
- Unit tests for SRS algorithm (critical path)
- Integration tests for AI extraction
- E2E tests for review flow
- User acceptance testing (UAT) after each phase

**Deployment:**
- Incremental releases (every 2 weeks)
- Feature flags for new functionality
- A/B testing for UI changes
- Gradual rollout (10% → 50% → 100%)

---

**Ready to start Phase 1? Let's build something amazing! 🚀**
