# 🎓 Japanese AI Tutor - User Guide

Welcome to your personal Japanese AI tutor! This guide will help you make the most of all available features.

## 🚀 Quick Start

1. **Start the Application**
   ```bash
   # Start ChromaDB (required for knowledge base)
   cd backend/chromaDB && docker compose up -d
   
   # Start the server
   npm start
   ```

2. **Open Your Browser**
   - Navigate to `http://localhost:3000`
   - You'll see the main chat interface with a sidebar

3. **Start Learning!**
   - Type your question in the input box
   - Press Enter or click the send button
   - Watch the AI tutor respond with personalized help

---

## 🎯 Core Features

### 📚 Knowledge Base (ChromaDB Semantic Search)
**What it does:** Searches through your local Japanese learning materials using advanced AI vector search.

**When to use:**
- Grammar questions (particles, conjugations, sentence patterns)
- Vocabulary lookups
- Example sentences
- Cultural context

**How it works:**
- Your PDFs and documents are converted into semantic vectors
- Questions are matched using meaning, not just keywords
- Results are more accurate than traditional search

**Visual indicator:** When you see 📚 **Knowledge Base** in a response, the AI used local materials.

---

### 🌐 Internet Search
**What it does:** Searches the web for current information, recent examples, and up-to-date resources.

**When to use:**
- Current events in Japanese
- Recent language trends or slang
- Contemporary usage examples
- Real-world context

**How to control:**
- Click the globe icon (🌐) in the input bar to toggle on/off
- When active, the globe appears solid blue
- When inactive, the globe appears crossed out

**Visual indicator:** When you see 🌐 **Internet** in a response, the AI used web search.

---

### 🧠 Conversation History
**What it does:** Remembers your past conversations to provide contextual responses.

**When to use:**
- Follow-up questions ("What did we discuss about particles?")
- Continuing previous topics
- Referencing earlier examples

**How it works:**
- Automatically saves all conversations locally
- View past chats in the left sidebar
- Click any conversation to reload it
- Delete individual conversations or clear all

**Visual indicator:** When you see 🧠 **History** in a response, the AI referenced past conversations.

---

### ✨ Personalized Learning (Privacy-Aware)
**What it does:** Adapts teaching style and content based on your learning patterns.

**When to use:**
- You want the AI to remember your weak points
- You want tailored difficulty levels
- You want recommendations based on your progress

**How it works:**
- Analyzes your conversation history (encrypted & anonymized)
- Identifies topics you struggle with or frequently ask about
- Adjusts explanations to match your learning style
- **Privacy-first:** All data is encrypted and anonymized

**How to enable:**
1. Click the ⚙️ Settings icon (top-right)
2. Toggle "Enable History-Based Personalization"
3. Your data remains on your device, encrypted

**Visual indicator:** When you see ✨ **Personalized** in a response, the AI adapted to your learning style.

---

## 🎨 Understanding Visual Indicators

Each AI response shows which features were used:

```
Assistant: [Response text here]

Features: 📚 Knowledge Base | 🌐 Internet | 🧠 History | ✨ Personalized
```

- **📚 Knowledge Base** = Used local learning materials
- **🌐 Internet** = Searched the web
- **🧠 History** = Referenced past conversations
- **✨ Personalized** = Adapted to your learning style

This helps you understand where the information came from!

---

## ⚙️ Settings Guide

### Privacy & Data Control

**Enable History-Based Personalization**
- Toggle on/off anytime
- Status shows encryption and anonymization state
- View indexed conversation count

**Privacy Details Button**
- Shows exactly what data is collected
- Explains encryption and anonymization
- Lists what is NOT stored

**Clear All Data Button**
- Permanently deletes all conversations
- Removes learning profile
- Cannot be undone

---

### System Status

The settings panel shows:

- **Model:** Which AI model is running (e.g., llama2, mistral)
- **RAG Mode:** 🔷 CHROMADB (advanced) or 📁 LEGACY (basic)
- **Internet Search:** Current status
- **History RAG:** Enabled/Disabled with encryption status
- **Level:** Auto-detected or manual
- **Language:** Response language (English explanations)

---

## 💡 Tips & Tricks

### Getting Better Responses

1. **Be Specific**
   ```
   ❌ "Tell me about particles"
   ✅ "What's the difference between は and が particles?"
   ```

2. **Mention Your Level**
   ```
   "I'm a beginner. How do I say 'I want to go to Japan'?"
   ```

3. **Ask for Examples**
   ```
   "Show me example sentences using ～ている"
   ```

4. **Request Different Formats**
   ```
   "Can you explain the て-form as a simple table?"
   ```

### Using History Effectively

- **Start new conversations** for different topics (use "New Chat" button)
- **Name your conversations** by starting with a topic (e.g., "Particles practice")
- **Reference past topics**: "Earlier you explained は. How does it work with adjectives?"

### Combining Features

The AI works best when features combine:

- 📚 + 🌐 = Local grammar + current usage examples
- 📚 + 🧠 = Textbook knowledge + your conversation context
- 🌐 + ✨ = Current information + your learning level
- All four = Comprehensive, personalized, contextual responses

---

## 🔒 Privacy & Security

### What You Should Know

✅ **Your data is safe:**
- All data stored locally on your computer
- Never sent to external servers (except Ollama/LLM)
- Encrypted with bcrypt (military-grade encryption)
- Anonymized with cryptographic hashing

✅ **You have control:**
- Disable personalization anytime
- Delete conversations individually or all at once
- Export your data (coming soon)
- No tracking or analytics

❌ **What we DON'T collect:**
- Personal information
- Raw conversation content (when encrypted)
- User identifiers
- IP addresses

### Privacy-Aware Personalization

When enabled:
1. Conversations are **hashed** (your identity is removed)
2. Content is **encrypted** (cannot be read in storage)
3. Only **patterns** are analyzed (grammar topics, vocabulary)
4. Original conversations remain untouched

---

## 🐛 Troubleshooting

### "Knowledge Base not available"
- Ensure ChromaDB is running: `cd backend/chromaDB && docker compose up -d`
- Check status in Settings: should show 🔷 CHROMADB

### "No response from AI"
- Verify Ollama is running: `ollama list`
- Check server logs for errors
- Try a simpler question first

### "Internet search failed"
- Check your internet connection
- Toggle internet search off/on
- Feature will gracefully fall back to local knowledge

### "History RAG errors"
- Check privacy settings status
- Try clearing all data (if comfortable)
- Disable and re-enable personalization

### ChromaDB connection issues
```bash
# Check if ChromaDB is running
docker ps | grep chroma

# Restart ChromaDB
cd backend/chromaDB
docker compose down
docker compose up -d
```

---

## 🎯 Common Use Cases

### Beginner Learner
```
User: "I'm new to Japanese. How do I say hello?"
AI: [Uses 📚 Knowledge Base for basics]

User: "What about informal greetings?"
AI: [Uses 📚 + 🌐 for textbook + current usage]
```

### Intermediate Practice
```
User: "Explain ～てしまう grammar"
AI: [Uses 📚 Knowledge Base]

User: "Show me how it's used in real sentences"
AI: [Uses 📚 + 🌐 + 🧠 for examples + your context]
```

### Advanced Study
```
User: "What's the difference between 見る and 観る?"
AI: [Uses 📚 + 🌐 for nuanced explanations + current usage]

User: "Earlier we discussed kanji. How do these relate?"
AI: [Uses 📚 + 🌐 + 🧠 + ✨ for comprehensive, contextual response]
```

---

## 📊 Feature Comparison

| Feature | ChromaDB Mode | Legacy Mode |
|---------|--------------|-------------|
| Semantic Search | ✅ Advanced | ❌ Keywords only |
| Accuracy | ✅ High | ⚠️ Medium |
| Context Understanding | ✅ Excellent | ⚠️ Basic |
| Speed | ✅ Fast | ✅ Fast |
| Setup Required | ⚠️ Docker | ✅ None |

**Recommendation:** Use ChromaDB mode for best results!

---

## 🚀 Advanced Features

### Keyboard Shortcuts
- **Enter:** Send message
- **Shift + Enter:** New line in message
- **Ctrl + /** (coming soon): Toggle sidebar

### Command Hints
- Prefix questions with your level: "As a beginner..."
- Request specific formats: "As a table", "With romaji", "In hiragana"
- Ask for multiple examples: "Give me 5 examples"

---

## 🆘 Getting Help

### Built-in Help
- Click **❓ Help** in the top-right corner
- View **About** section for quick reference

### Documentation
- `README.md` - Project overview
- `ENHANCED_RAG_INTEGRATION.md` - Technical details
- `ENHANCED_RAG_QUICK_REFERENCE.md` - Developer quick reference
- `HISTORY_CUSTOMIZATION_VERIFICATION.md` - Privacy feature details

### Check System Health
```bash
# Test all features
./test-enhanced-rag.sh

# Check API health
curl http://localhost:3000/api/health
```

---

## 🎓 Learning Best Practices

1. **Start with fundamentals** - Build a strong foundation
2. **Practice daily** - Consistency beats intensity
3. **Use all features** - Each provides unique value
4. **Review history** - Revisit past conversations
5. **Experiment** - Try different question styles
6. **Stay curious** - Ask "why" and "how" questions

---

## 🔮 Coming Soon

- [ ] Export conversation history
- [ ] Custom conversation tags
- [ ] Spaced repetition reminders
- [ ] Voice input/output
- [ ] Mobile app
- [ ] Multi-language support

---

## 📝 Feedback

Your feedback helps improve the tutor! If you encounter issues or have suggestions:

1. Check the troubleshooting section
2. Review the documentation
3. Create an issue on GitHub (if applicable)
4. Check console logs for errors

---

**Happy Learning! 頑張って！** 🎌
