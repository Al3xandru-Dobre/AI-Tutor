# 🎨 Japanese AI Tutor - Visual Feature Overview

## 🎯 Feature Icons & Meanings

When you see these icons in the chat, here's what they mean:

| Icon | Feature | What It Does |
|------|---------|--------------|
| 📚 | **Knowledge Base** | Searched local Japanese learning materials using ChromaDB vector database |
| 🌐 | **Internet** | Searched the web for current information and examples |
| 🧠 | **History** | Referenced your past conversations for context |
| ✨ | **Personalized** | Adapted the response to your learning patterns |

---

## 🔄 How Features Work Together

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ASKS A QUESTION                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              TUTOR ORCHESTRATOR SERVICE                      │
│         (Coordinates all search sources)                     │
└──────┬────────────┬───────────────┬──────────────┬──────────┘
       │            │               │              │
       ▼            ▼               ▼              ▼
   ┌────────┐  ┌─────────┐   ┌──────────┐   ┌─────────────┐
   │   📚   │  │   🌐    │   │    🧠    │   │     ✨      │
   │ ChromaDB│  │Internet │   │ History  │   │Personalize │
   │  Search │  │ Search  │   │   RAG    │   │   Engine   │
   └────┬───┘  └────┬────┘   └─────┬────┘   └──────┬──────┘
        │           │              │               │
        └───────────┴──────────────┴───────────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │   COMBINED RESULTS     │
                │  (weighted & ranked)   │
                └────────┬───────────────┘
                         │
                         ▼
                ┌────────────────────────┐
                │    OLLAMA LLM          │
                │  (generates response)  │
                └────────┬───────────────┘
                         │
                         ▼
                ┌────────────────────────┐
                │  RESPONSE TO USER      │
                │  + Feature badges      │
                └────────────────────────┘
```

---

## 🎬 Example Interactions

### Scenario 1: Grammar Question

**User:** "What's the difference between は and が?"

**System Processing:**
1. 📚 ChromaDB finds relevant grammar explanations
2. 🌐 Internet searches for contemporary examples
3. 🧠 History checks if user asked about particles before
4. ✨ Personalizer adjusts explanation to user's level

**Response Shows:**
```
Assistant: [Detailed explanation]

Features: 📚 Knowledge Base | 🌐 Internet | 🧠 History | ✨ Personalized
```

---

### Scenario 2: Follow-up Question

**User:** "Can you give me more examples?"

**System Processing:**
1. 📚 ChromaDB retrieves example sentences
2. 🧠 History remembers we were discussing は/が
3. ✨ Personalizer tailors examples to user's vocabulary level

**Response Shows:**
```
Assistant: [Examples relevant to previous discussion]

Features: 📚 Knowledge Base | 🧠 History | ✨ Personalized
```

---

### Scenario 3: Current Event Question

**User:** "How do I say 'AI technology' in Japanese?"

**System Processing:**
1. 🌐 Internet searches for current terminology
2. 📚 ChromaDB provides pronunciation and usage patterns
3. ✨ Personalizer adds context based on user's level

**Response Shows:**
```
Assistant: [Modern terminology with context]

Features: 📚 Knowledge Base | 🌐 Internet | ✨ Personalized
```

---

## 🎛️ Control Panel (Settings)

### Visual Status Indicators

```
⚙️ SETTINGS
├─ 📊 Current Configuration
│  ├─ Model: llama3:8b ✅
│  ├─ RAG Mode: 🔷 CHROMADB (Active)
│  ├─ Internet Search: 🌐 Enabled
│  ├─ History RAG: 🔒 Enabled (Encrypted)
│  └─ Level: Beginner (auto-detected)
│
├─ 🔒 Privacy & Personalization
│  ├─ Toggle: [ON] Enable History-Based Personalization
│  ├─ Status: ✅ Enabled
│  ├─ Encryption: ✅ Active (bcrypt)
│  ├─ Anonymization: ✅ Active (crypto hash)
│  └─ Indexed Conversations: 42
│
└─ ℹ️ Feature Guide
   ├─ 📚 Knowledge Base: Vector semantic search
   ├─ 🌐 Internet Search: Real-time web search
   ├─ 🧠 History: Past conversation context
   └─ ✨ Personalized: Adaptive learning patterns
```

---

## 🔐 Privacy Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  YOUR CONVERSATION                       │
│   "What is the て-form used for?"                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │   PRIVACY LAYER (Optional)   │
         │                              │
         │  1. Perfect Hash (ID)        │
         │     crypto HMAC SHA-256      │
         │     12345 → a3f7b2c...       │
         │                              │
         │  2. Encrypt (Content)        │
         │     bcrypt 12 rounds         │
         │     "text" → $2b$12$...      │
         │                              │
         │  3. Anonymize (Metadata)     │
         │     Remove timestamps        │
         │     Remove user IDs          │
         └─────────────┬────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │   ENCRYPTED STORAGE          │
         │   (local filesystem)         │
         │                              │
         │   {                          │
         │     id: "a3f7b2c...",        │
         │     content: "$2b$12$...",   │
         │     patterns: [encrypted]    │
         │   }                          │
         └──────────────────────────────┘

✅ Your identity: PROTECTED
✅ Your conversations: ENCRYPTED
✅ Your data: STAYS LOCAL
❌ No external servers
❌ No tracking
❌ No analytics
```

---

## 📊 Feature Availability Matrix

| Feature | Requires | Status | Fallback |
|---------|----------|--------|----------|
| 📚 Knowledge Base | ChromaDB running | ✅ Active | Legacy keyword search |
| 🌐 Internet Search | Internet connection + API key | ✅ Active | Local RAG only |
| 🧠 History | Conversations saved | ✅ Active | Fresh context only |
| ✨ Personalized | History RAG enabled | ⚠️ Optional | Standard responses |

---

## 🎯 UI Elements Guide

### Main Chat Interface

```
┌──────────────────────────────────────────────────────────┐
│  ☰ Sidebar        Japanese AI Tutor         ⚙️ ❓      │
├──────────────────────────────────────────────────────────┤
│ ┌──────────────┐ │                                      │
│ │ 📝 New Chat  │ │  User: What is は particle?         │
│ ├──────────────┤ │                                      │
│ │ 💬 Previous  │ │  Assistant: The は particle...       │
│ │    Chats     │ │                                      │
│ │              │ │  Features: 📚 🌐 🧠 ✨             │
│ │ • Particles  │ │                                      │
│ │ • Verbs      │ │  User: Give me examples              │
│ │ • Kanji      │ │                                      │
│ └──────────────┘ │  Assistant: Here are examples...     │
│                   │                                      │
│                   │  Features: 📚 🧠                     │
├──────────────────────────────────────────────────────────┤
│ 🌐 [Internet] 💬 Ask me anything...  [Send ➤]          │
└──────────────────────────────────────────────────────────┘
```

**Elements:**
- **☰** Toggle sidebar
- **⚙️** Open settings
- **❓** Show help
- **🌐** Toggle internet search (blue = on, gray = off)
- **Feature badges** under each response

---

### Settings Modal

```
┌─────────────────────────────────────────────────┐
│  ⚙️ Settings                              [X]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  🔒 Privacy & Personalization                   │
│  ═══════════════════════════════════════        │
│                                                 │
│  [✓] Enable History-Based Personalization       │
│                                                 │
│  📊 Privacy Status:                             │
│  • Status: Enabled                              │
│  • Data Encryption: Yes                         │
│  • Anonymization: Yes                           │
│  • Indexed Conversations: 42                    │
│                                                 │
│  [View Privacy Details] [Clear All Data]        │
│                                                 │
│ ─────────────────────────────────────────────   │
│                                                 │
│  📊 Current Configuration                       │
│  ═══════════════════════════════════════        │
│                                                 │
│  • Model: llama3:8b                             │
│  • RAG Mode: 🔷 CHROMADB                        │
│  • Internet Search: Enabled                     │
│  • History RAG: Enabled (Encrypted)             │
│  • Level: Beginner (auto-detected)              │
│                                                 │
│ ─────────────────────────────────────────────   │
│                                                 │
│  ℹ️ Feature Guide                               │
│  ═══════════════════════════════════════        │
│                                                 │
│  📚 Knowledge Base                              │
│     Vector semantic search through local        │
│     Japanese learning materials                 │
│                                                 │
│  🌐 Internet Search                             │
│     Real-time web search for current info       │
│                                                 │
│  🧠 History                                     │
│     References past conversations               │
│                                                 │
│  ✨ Personalized                                │
│     Adapts to your learning patterns            │
│                                                 │
├─────────────────────────────────────────────────┤
│                       [Done]                    │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Visual Flow

```
START
  │
  ▼
┌─────────────────┐
│ 1. Start Docker │  cd backend/chromaDB
│    ChromaDB     │  docker compose up -d
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Start Server │  npm start
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Open Browser │  http://localhost:3000
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Enable       │  Click ⚙️ → Toggle
│    Features     │  Personalization
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Start        │  Type your question
│    Learning!    │  and press Enter
└─────────────────┘
```

---

## 🎓 Learning Flow Example

```
Session 1: First Time User
├─ User enables personalization
├─ Asks about basic particles (は, が, を)
├─ System uses: 📚 + 🌐
└─ Conversation saved & encrypted

Session 2: Follow-up Questions
├─ User asks: "What were those particles again?"
├─ System uses: 📚 + 🧠 + ✨
│  └─ 🧠 Remembers previous particle discussion
│  └─ ✨ Notices user struggles with particles
└─ Response adjusted for reinforcement

Session 3: Advanced Topic
├─ User asks about て-form
├─ System uses: 📚 + 🌐 + 🧠 + ✨
│  └─ 🧠 Links to previous particle knowledge
│  └─ ✨ Adjusts examples to familiar vocabulary
└─ Learning pathway optimized

Result: Personalized, contextual learning journey
```

---

## 📈 System Status Indicators

### Healthy System
```
✅ Server: Running (port 3000)
✅ Ollama: Connected (llama3:8b)
✅ ChromaDB: Active (🔷 mode)
✅ Internet: Connected
✅ History RAG: Enabled (encrypted)
```

### Degraded Mode
```
✅ Server: Running (port 3000)
✅ Ollama: Connected (llama3:8b)
⚠️ ChromaDB: Unavailable (📁 legacy fallback)
✅ Internet: Connected
✅ History RAG: Enabled (encrypted)
```

### Offline Mode
```
✅ Server: Running (port 3000)
✅ Ollama: Connected (llama3:8b)
✅ ChromaDB: Active (🔷 mode)
❌ Internet: Disconnected (local RAG only)
⚠️ History RAG: Disabled (no conversations)
```

---

## 🎨 Color Coding

In the UI, features are color-coded:

- **📚 Knowledge Base** = Blue (#4CAF50)
- **🌐 Internet** = Green (#2196F3)
- **🧠 History** = Purple (#9C27B0)
- **✨ Personalized** = Gold (#FFC107)

These colors appear in:
- Feature badges on messages
- Status indicators in settings
- System health display

---

**Made with ❤️ for Japanese learners**
