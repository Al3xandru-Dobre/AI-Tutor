const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

class PrivacyAwareHistoryRAGService {
  constructor(conversationService, options = {}) {
    this.conversationService = conversationService;
    this.historyIndex = new Map();
    this.topicIndex = new Map();
    this.vocabularyIndex = new Map();
    this.grammarIndex = new Map();
    this.isInitialized = false;
    
    // Privacy settings
    this.isEnabled = options.enabled || false; // Default disabled
    this.enableEncryption = options.enableEncryption !== false; // Default enabled
    this.saltRounds = 12; // For bcrypt
    this.anonymizationSeed = options.anonymizationSeed || 'japanese-tutor-2024';
    
    // Storage paths
    this.privacyDataPath = path.join(__dirname, '../data/privacy');
    this.settingsPath = path.join(this.privacyDataPath, 'user-settings.json');
    this.encryptedIndexPath = path.join(this.privacyDataPath, 'encrypted-history.json');
    
    // Learning patterns recognition (same as before)
    this.japanesePatterns = {
      vocabulary: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g,
      grammarKeywords: ['particle', 'verb', 'adjective', 'grammar', 'conjugation', 'tense', 'keigo', 'honorific'],
      topicKeywords: ['introduce', 'greeting', 'food', 'direction', 'shopping', 'travel', 'business', 'culture'],
      difficultyIndicators: ['beginner', 'elementary', 'intermediate', 'advanced', 'jlpt', 'n5', 'n4', 'n3', 'n2', 'n1']
    };
  }

  async initialize() {
    try {
      console.log('🔄 Initializing Privacy-Aware HistoryRAGService...');
      
      // Create privacy data directory
      await fs.mkdir(this.privacyDataPath, { recursive: true });
      
      // Load user privacy settings
      await this.loadPrivacySettings();
      
      if (!this.isEnabled) {
        console.log('⚠️  History RAG is disabled by user privacy settings');
        this.isInitialized = true; // Mark as initialized even if disabled
        return;
      }

      console.log('🔐 Privacy-aware mode: encryption enabled');
      await this.buildHistoryIndex();
      this.isInitialized = true;
      
      console.log(`✅ Privacy-Aware HistoryRAGService initialized with ${this.historyIndex.size} anonymized conversations`);
    } catch (error) {
      console.error('❌ PrivacyAwareHistoryRAGService initialization error:', error);
      this.isInitialized = false;
    }
  }

  async loadPrivacySettings() {
    try {
      const settingsData = await fs.readFile(this.settingsPath, 'utf-8');
      const settings = JSON.parse(settingsData);
      this.isEnabled = settings.historyRAGEnabled || false;
      this.enableEncryption = settings.encryptionEnabled !== false;
    } catch (error) {
      // Default settings if file doesn't exist
      await this.savePrivacySettings();
    }
  }

  async savePrivacySettings() {
    const settings = {
      historyRAGEnabled: this.isEnabled,
      encryptionEnabled: this.enableEncryption,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };
    
    await fs.writeFile(this.settingsPath, JSON.stringify(settings, null, 2));
  }

  // Perfect hash function for anonymization
  createPerfectHash(input) {
    return crypto
      .createHmac('sha256', this.anonymizationSeed)
      .update(input)
      .digest('hex')
      .substring(0, 16); // 16-char hash for anonymization
  }

  // Encrypt sensitive content using bcrypt
  async encryptContent(content) {
    if (!this.enableEncryption) return content;
    
    // For demonstration - in production, use proper encryption
    const salt = await bcrypt.genSalt(this.saltRounds);
    const hash = await bcrypt.hash(content, salt);
    return {
      encrypted: true,
      hash: hash,
      salt: salt,
      preview: content.substring(0, 50) + '...' // Keep preview for indexing
    };
  }

  // Anonymize conversation data
  anonymizeConversation(conversation) {
    const anonymizedId = this.createPerfectHash(conversation.id);
    
    return {
      ...conversation,
      id: anonymizedId,
      originalId: null, // Remove original ID
      anonymized: true,
      anonymizedAt: new Date().toISOString(),
      // Keep title but anonymized
      title: `Learning Session ${anonymizedId.substring(0, 8)}`
    };
  }

  async buildHistoryIndex() {
    if (!this.conversationService.isInitialized) {
      await this.conversationService.initialize();
    }

    if (!this.isEnabled) {
      console.log('📋 History indexing skipped - feature disabled by user');
      return;
    }

    const conversations = await this.conversationService.listConversations();
    
    for (const conversationSummary of conversations) {
      const fullConversation = await this.conversationService.getConversation(conversationSummary.id);
      if (fullConversation && fullConversation.messages.length > 0) {
        const anonymizedConversation = this.anonymizeConversation(fullConversation);
        await this.indexConversation(anonymizedConversation);
      }
    }

    // Save encrypted index to disk
    if (this.enableEncryption) {
      await this.saveEncryptedIndex();
    }
  }


  async indexConversation(conversation) {
    const { id, messages, createdAt } = conversation;
    const conversationDate = new Date(createdAt);
    
    // Calculate conversation age (for weighting recent conversations higher)
    const ageInDays = Math.floor((Date.now() - conversationDate.getTime()) / (1000 * 60 * 60 * 24));
    const recencyWeight = Math.max(0.1, 1 - (ageInDays / 30));
    
    const indexedData = {
      id,
      messages: [],
      topics: new Set(),
      vocabulary: new Set(),
      grammarPoints: new Set(),
      difficultyLevel: 'beginner',
      recencyWeight,
      messageCount: messages.length,
      createdAt,
      anonymized: conversation.anonymized || false
    };

    // Index each message pair (user question + assistant response)
    for (let i = 0; i < messages.length - 1; i += 2) {
      const userMessage = messages[i];
      const assistantMessage = messages[i + 1];
      
      // Add validation to check if messages exist and have content
      if (userMessage && assistantMessage && 
          userMessage.role === 'user' && assistantMessage.role === 'assistant' &&
          userMessage.content && assistantMessage.content) {
        
        const messageContext = await this.extractMessageContextSecure(
          userMessage.content, 
          assistantMessage.content
        );
        indexedData.messages.push(messageContext);
        
        // Add to indices (topics, vocabulary, grammar)
        messageContext.topics.forEach(topic => {
          indexedData.topics.add(topic);
          if (!this.topicIndex.has(topic)) {
            this.topicIndex.set(topic, []);
          }
          this.topicIndex.get(topic).push({
            conversationId: id,
            messageIndex: i,
            content: messageContext,
            weight: recencyWeight,
            anonymized: true
          });
        });

        messageContext.vocabulary.forEach(word => {
          indexedData.vocabulary.add(word);
          if (!this.vocabularyIndex.has(word)) {
            this.vocabularyIndex.set(word, []);
          }
          this.vocabularyIndex.get(word).push({
            conversationId: id,
            messageIndex: i,
            content: messageContext,
            weight: recencyWeight,
            anonymized: true
          });
        });

        messageContext.grammarPoints.forEach(pattern => {
          indexedData.grammarPoints.add(pattern);
          if (!this.grammarIndex.has(pattern)) {
            this.grammarIndex.set(pattern, []);
          }
          this.grammarIndex.get(pattern).push({
            conversationId: id,
            messageIndex: i,
            content: messageContext,
            weight: recencyWeight,
            anonymized: true
          });
        });
      } else {
        console.log(`⚠️  Skipping invalid message pair at index ${i} in conversation ${id}`);
      }
    }

    this.historyIndex.set(id, indexedData);
  }

  async extractMessageContextSecure(userContent, assistantContent) {
    // Add safety checks for undefined/null content
    if (!userContent || !assistantContent) {
      console.warn('⚠️  Received undefined/null content in extractMessageContextSecure');
      return {
        userQuery: { encrypted: false, preview: '' },
        assistantResponse: { encrypted: false, preview: '' },
        topics: [],
        vocabulary: [],
        grammarPoints: [],
        difficultyLevel: 'beginner',
        keywords: [],
        timestamp: new Date().toISOString(),
        privacyMode: this.enableEncryption
      };
    }

    // Ensure content is string type
    const userContentStr = String(userContent);
    const assistantContentStr = String(assistantContent);
    
    const combined = `${userContentStr} ${assistantContentStr}`.toLowerCase();
    
    // Encrypt the actual content if encryption is enabled
    const encryptedUser = this.enableEncryption 
      ? await this.encryptContent(userContentStr)
      : userContentStr;
      
    // Safely truncate assistant content
    const truncatedAssistant = assistantContentStr.length > 300 
      ? assistantContentStr.substring(0, 300) + '...'
      : assistantContentStr;
      
    const encryptedAssistant = this.enableEncryption
      ? await this.encryptContent(truncatedAssistant)
      : truncatedAssistant;
    
    return {
      userQuery: encryptedUser,
      assistantResponse: encryptedAssistant,
      topics: this.extractTopics(combined),
      vocabulary: this.extractVocabulary(assistantContentStr),
      grammarPoints: this.extractGrammarPoints(combined),
      difficultyLevel: this.detectDifficultyLevel(combined),
      keywords: this.extractKeywords(combined),
      timestamp: new Date().toISOString(),
      privacyMode: this.enableEncryption
    };
  }
  // Save the entire index to disk in encrypted form
  
  

  async saveEncryptedIndex() {
    try {
      const indexData = {
        historyIndex: Object.fromEntries(this.historyIndex),
        topicIndex: Object.fromEntries(this.topicIndex),
        vocabularyIndex: Object.fromEntries(this.vocabularyIndex),
        grammarIndex: Object.fromEntries(this.grammarIndex),
        encrypted: true,
        createdAt: new Date().toISOString()
      };

      const encryptedData = await this.encryptContent(JSON.stringify(indexData));
      await fs.writeFile(this.encryptedIndexPath, JSON.stringify(encryptedData, null, 2));
      
      console.log('🔐 Encrypted history index saved');
    } catch (error) {
      console.error('❌ Failed to save encrypted index:', error);
    }
  }

  // Add a new conversation to the index in real-time
  async addNewConversationToIndex(conversationId) {
    if (!this.isEnabled || !this.isInitialized) {
      return; // Skip if disabled or not initialized
    }

    try {
      const conversation = await this.conversationService.getConversation(conversationId);
      if (conversation && conversation.messages.length > 0) {
        const anonymizedConversation = this.anonymizeConversation(conversation);
        await this.indexConversation(anonymizedConversation);
        
        // Save updated encrypted index
        if (this.enableEncryption) {
          await this.saveEncryptedIndex();
        }
        
        console.log(`📋 Added conversation ${conversationId} to privacy-aware history index`);
      }
    } catch (error) {
      console.error(`❌ Error adding conversation ${conversationId} to history index:`, error);
    }
  }

  // Enable/disable the service
  // Ar trebui să existe în jurul liniei 290-310:


    // ADD this method to Privacy-Aware HistoryRAGService.js
// Place it after the getPrivacyStatus() method

/**
 * Enable or disable the History RAG service
 * @param {boolean} enabled - Whether to enable the service
 * @returns {Promise<object>} Privacy status after change
 */
async setEnabled(enabled) {
  console.log(`🔄 Setting History RAG: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  
  const wasEnabled = this.isEnabled;
  this.isEnabled = enabled;
  
  // Save settings to disk
  await this.savePrivacySettings();
  
  if (enabled && !wasEnabled) {
    // Re-initialize when enabling
    console.log('📚 Re-initializing History RAG...');
    await this.initialize();
  } else if (!enabled && wasEnabled) {
    // Clear data when disabling
    console.log('🗑️ Clearing History RAG data...');
    this.clearAllData();
  }
  
  const status = this.getPrivacyStatus();
  console.log('✅ History RAG status updated:', status);
  
  return status;
}

/**
 * Get privacy status
 * @returns {object} Current privacy configuration
 */
getPrivacyStatus() {
  return {
    enabled: this.isEnabled,
    encryption_enabled: this.enableEncryption,
    data_anonymized: true,
    total_conversations: this.historyIndex.size,
    last_updated: new Date().toISOString()
  };
}

/**
 * Clear all indexed data
 */
clearAllData() {
  this.historyIndex.clear();
  this.topicIndex.clear();
  this.vocabularyIndex.clear();
  this.grammarIndex.clear();
  this.isInitialized = false;
  console.log('🗑️ History RAG data cleared due to privacy settings');
}

  clearAllData() {
    this.historyIndex.clear();
    this.topicIndex.clear();
    this.vocabularyIndex.clear();
    this.grammarIndex.clear();
    console.log('🗑️  History RAG data cleared due to privacy settings');
  }

  getPrivacyStatus() {
    return {
      enabled: this.isEnabled,
      encryptionEnabled: this.enableEncryption,
      dataAnonymized: true,
      totalConversations: this.historyIndex.size,
      lastUpdated: new Date().toISOString()
    };
  }

  // Export anonymized data for training (future feature prep)
  async exportAnonymizedData(includeContent = false) {
    if (!this.isEnabled) {
      throw new Error('History RAG is disabled. Cannot export data.');
    }

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        anonymized: true,
        contentIncluded: includeContent
      },
      statistics: {
        totalConversations: this.historyIndex.size,
        totalTopics: this.topicIndex.size,
        totalVocabulary: this.vocabularyIndex.size,
        totalGrammar: this.grammarIndex.size
      },
      learningPatterns: this.analyzeLearningPatternsAnonymized(),
      // Content will be added in future implementation
      conversations: includeContent ? 'PLACEHOLDER_FOR_FUTURE' : null
    };

    return exportData;
  }

  analyzeLearningPatternsAnonymized() {
    const patterns = {
      topicDistribution: this.getMostFrequentItems(this.topicIndex),
      vocabularyFrequency: this.getMostFrequentItems(this.vocabularyIndex, 10),
      grammarPatterns: this.getMostFrequentItems(this.grammarIndex),
      conversationLengths: Array.from(this.historyIndex.values()).map(conv => conv.messageCount),
      difficultyProgression: this.estimateUserLevel()
    };

    return patterns;
  }

  // Existing methods adapted for privacy (same logic, but respects privacy settings)
  async searchHistoryContext(query, currentLevel = 'beginner', maxResults = 3) {
    if (!this.isEnabled || !this.isInitialized) {
      return []; // Return empty if disabled
    }

    return this.performHistorySearch(query, currentLevel, maxResults);
  }

  async performHistorySearch(query, currentLevel, maxResults) {
    // Same search logic as before, but with privacy-aware results
    const queryLower = query.toLowerCase();
    const queryKeywords = this.extractKeywords(queryLower);
    const queryTopics = this.extractTopics(queryLower);
    const queryVocab = this.extractVocabulary(query);
    const queryGrammar = this.extractGrammarPoints(queryLower);
    
    const results = [];

    for (const [conversationId, indexedData] of this.historyIndex) {
      let relevanceScore = 0;
      const matchingMessages = [];

      // Topic overlap scoring
      const topicOverlap = queryTopics.filter(topic => 
        Array.from(indexedData.topics).includes(topic)
      ).length;
      relevanceScore += topicOverlap * 0.4;

      // Vocabulary overlap scoring
      const vocabOverlap = queryVocab.filter(word =>
        Array.from(indexedData.vocabulary).includes(word)
      ).length;
      relevanceScore += vocabOverlap * 0.3;

      // Grammar point overlap scoring
      const grammarOverlap = queryGrammar.filter(pattern =>
        Array.from(indexedData.grammarPoints).includes(pattern)
      ).length;
      relevanceScore += grammarOverlap * 0.3;

      // Keyword matching in messages (with privacy protection)
      indexedData.messages.forEach((messageContext, index) => {
        let messageScore = 0;
        
        // Only use preview data for matching if encrypted
        const searchableText = messageContext.privacyMode 
          ? `${messageContext.userQuery.preview || ''} ${messageContext.assistantResponse.preview || ''}`.toLowerCase()
          : `${messageContext.userQuery} ${messageContext.assistantResponse}`.toLowerCase();
        
        queryKeywords.forEach(keyword => {
          if (searchableText.includes(keyword)) {
            messageScore += 0.1;
          }
        });

        if (messageScore > 0.2) {
          matchingMessages.push({
            ...messageContext,
            score: messageScore,
            messageIndex: index,
            privacyProtected: messageContext.privacyMode
          });
        }
      });

      relevanceScore *= indexedData.recencyWeight;

      if (relevanceScore > 0.1 || matchingMessages.length > 0) {
        results.push({
          conversationId,
          relevanceScore,
          topics: Array.from(indexedData.topics),
          vocabulary: Array.from(indexedData.vocabulary).slice(0, 5),
          grammarPoints: Array.from(indexedData.grammarPoints),
          matchingMessages: matchingMessages.sort((a, b) => b.score - a.score).slice(0, 2),
          recencyWeight: indexedData.recencyWeight,
          createdAt: indexedData.createdAt,
          privacyProtected: true
        });
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)
      .map(result => ({
        content: this.formatHistoryContextSecure(result),
        source: `Previous conversation (${this.formatDate(result.createdAt)}) [Privacy Protected]`,
        title: `Past discussion about: ${result.topics.slice(0, 2).join(', ') || 'Japanese learning'}`,
        level: currentLevel,
        score: result.relevanceScore,
        source_type: 'history_private',
        topics: result.topics,
        vocabulary_covered: result.vocabulary,
        grammar_points: result.grammarPoints,
        privacyMode: true
      }));
  }

  formatHistoryContextSecure(result) {
    let context = `Previously discussed topics: ${result.topics.join(', ')}\n`;
    
    if (result.vocabulary.length > 0) {
      context += `Vocabulary covered: ${result.vocabulary.join('、')}\n`;
    }
    
    if (result.grammarPoints.length > 0) {
      context += `Grammar points: ${result.grammarPoints.join(', ')}\n`;
    }
    
    if (result.matchingMessages.length > 0) {
      context += `\nRelevant past topics (privacy protected):\n`;
      const topMessage = result.matchingMessages[0];
      
      if (topMessage.privacyProtected) {
        context += `Previous discussion covered similar topics and vocabulary\n`;
      } else {
        context += `User asked: "${topMessage.userQuery.substring(0, 100)}..."\n`;
        context += `We discussed: "${topMessage.assistantResponse.substring(0, 200)}..."\n`;
      }
    }
    
    return context;
  }

  // Include all the existing utility methods (extractTopics, extractVocabulary, etc.)
  
  extractTopics(text) {
    const topics = new Set();
    
    this.japanesePatterns.topicKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        topics.add(keyword);
      }
    });

    if (text.includes('introduce') || text.includes('introduction')) topics.add('introductions');
    if (text.includes('greeting') || text.includes('hello') || text.includes('おはよう')) topics.add('greetings');
    if (text.includes('particle') || text.includes('は') || text.includes('が')) topics.add('particles');
    if (text.includes('verb') || text.includes('conjugat')) topics.add('verbs');
    if (text.includes('count') || text.includes('number')) topics.add('counting');
    if (text.includes('food') || text.includes('eat') || text.includes('restaurant')) topics.add('food');

    return Array.from(topics);
  }

  extractVocabulary(text) {
    const vocabulary = new Set();
    const japaneseMatches = text.match(this.japanesePatterns.vocabulary) || [];
    
    japaneseMatches.forEach(word => {
      if (word.length >= 2) {
        vocabulary.add(word);
      }
    });

    return Array.from(vocabulary).slice(0, 20);
  }

  extractGrammarPoints(text) {
    const grammarPoints = new Set();
    
    this.japanesePatterns.grammarKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        grammarPoints.add(keyword);
      }
    });

    if (text.includes('です') || text.includes('desu')) grammarPoints.add('polite_copula');
    if (text.includes('ます') || text.includes('masu')) grammarPoints.add('polite_verbs');
    if (text.includes('は') || text.includes('wa_particle')) grammarPoints.add('topic_marker');
    if (text.includes('を') || text.includes('wo_particle')) grammarPoints.add('object_marker');
    
    return Array.from(grammarPoints);
  }

  detectDifficultyLevel(text) {
    for (const level of ['advanced', 'intermediate', 'elementary', 'beginner']) {
      if (text.includes(level)) return level;
    }
    
    if (text.includes('n1')) return 'advanced';
    if (text.includes('n2')) return 'intermediate';
    if (text.includes('n3')) return 'intermediate';
    if (text.includes('n4')) return 'elementary';
    if (text.includes('n5')) return 'beginner';
    
    return 'beginner';
  }

  extractKeywords(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'today';
    if (diffDays === 2) return 'yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getUserLearningProfile(userId = 'default') {
    if (!this.isEnabled) {
      return { error: 'Learning profile disabled for privacy' };
    }

    const profile = {
      totalConversations: this.historyIndex.size,
      mostDiscussedTopics: this.getMostFrequentItems(this.topicIndex),
      vocabularyEncountered: this.getMostFrequentItems(this.vocabularyIndex, 10),
      grammarPointsCovered: this.getMostFrequentItems(this.grammarIndex),
      estimatedLevel: this.estimateUserLevel(),
      learningProgression: this.analyzeLearningProgression(),
      privacyMode: true,
      dataAnonymized: true
    };

    return profile;
  }

  getMostFrequentItems(indexMap, limit = 5) {
    return Array.from(indexMap.entries())
      .map(([item, references]) => ({
        item,
        frequency: references.length,
        lastMentioned: Math.max(...references.map(ref => new Date(ref.content.timestamp).getTime()))
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
      .map(entry => entry.item);
  }

  estimateUserLevel() {
    const levelCounts = { beginner: 0, elementary: 0, intermediate: 0, advanced: 0 };
    
    for (const [_, indexedData] of this.historyIndex) {
      indexedData.messages.forEach(message => {
        levelCounts[message.difficultyLevel]++;
      });
    }
    
    return Object.entries(levelCounts).reduce((a, b) => levelCounts[a[0]] > levelCounts[b[0]] ? a : b)[0];
  }

  analyzeLearningProgression() {
    const conversations = Array.from(this.historyIndex.values())
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    if (conversations.length < 2) return 'insufficient_data';
    
    const recentTopics = conversations.slice(-3).map(conv => Array.from(conv.topics)).flat();
    const uniqueRecentTopics = [...new Set(recentTopics)].length;
    
    if (uniqueRecentTopics > 5) return 'exploring_diverse_topics';
    if (uniqueRecentTopics > 2) return 'building_foundation';
    return 'focused_learning';
  }

  getStats() {
    return {
      initialized: this.isInitialized,
      enabled: this.isEnabled,
      privacyMode: this.enableEncryption,
      total_conversations_indexed: this.historyIndex.size,
      total_topics: this.topicIndex.size,
      total_vocabulary_items: this.vocabularyIndex.size,
      total_grammar_points: this.grammarIndex.size,
      data_anonymized: true,
      encryption_enabled: this.enableEncryption,
      user_profile: this.isEnabled ? this.getUserLearningProfile() : { disabled: true }
    };
  }
}

module.exports = PrivacyAwareHistoryRAGService;