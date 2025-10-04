const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL;
    this.lastResponseTime = 0;
    this.requestCount = 0;
    
    // Context window presets for different task types
    this.contextPresets = {
      // Maximum context for complex educational tasks
      'detailed_explanation': {
        num_ctx: 16384,      // 16K context - full conversation history
        num_predict: 8192,    // 8K generation - comprehensive explanations
        temperature: 0.8,
        description: 'Grammar deep-dives, cultural explanations, comprehensive lessons'
      },
      
      // Large context for exercises and examples
      'exercise_generation': {
        num_ctx: 12288,      // 12K context - moderate history
        num_predict: 8192,    // 4K generation - multiple examples
        temperature: 0.85,
        description: 'Practice exercises, multiple examples, lesson creation'
      },
      
      // Standard context for general teaching
      'standard_teaching': {
        num_ctx: 8192,       // 8K context - good balance
        num_predict: 4096,    // 3K generation - detailed but focused
        temperature: 0.8,
        description: 'General explanations, translations, vocabulary'
      },
      
      // Moderate context for quick queries
      'quick_answer': {
        num_ctx: 6144,       // 6K context - recent history
        num_predict: 3072,    // 3K generation - concise but complete
        temperature: 0.75,
        description: 'Quick translations, simple questions, definitions'
      },
      
      // Minimal context for very simple queries
      'simple_query': {
        num_ctx: 4096,       // 4K context - minimal history
        num_predict: 2048,    // 2K generation - brief answers
        temperature: 0.7,
        description: 'Single word translations, yes/no questions'
      }
    };
  }

  /**
   * Analyze query to determine optimal context window
   */
  analyzeQueryComplexity(userInput, context = {}) {
    const input = userInput.toLowerCase();
    const { exercise_type, rag_context = [], internet_context = [], level = 'beginner' } = context;
    
    // Count available reference materials
    const totalReferences = (rag_context?.length || 0) + (internet_context?.length || 0);
    
    // Complexity scoring
    let complexityScore = 0;
    let taskType = 'standard_teaching';
    let reasoning = [];

    // 1. Check for explicit detailed requests
    const detailedKeywords = [
      'explain in detail', 'comprehensive', 'deep dive', 'elaborate',
      'full explanation', 'thoroughly', 'teach me about', 'lesson on',
      'how does', 'why does', 'what is the difference between',
      'compare', 'contrast', 'breakdown', 'step by step'
    ];
    
    if (detailedKeywords.some(kw => input.includes(kw))) {
      complexityScore += 40;
      reasoning.push('Explicit detailed explanation request');
    }

    // 2. Check for exercise/practice requests
    const exerciseKeywords = [
      'exercise', 'practice', 'quiz', 'test', 'example sentences',
      'give me examples', 'create', 'generate', 'make me',
      'multiple examples', 'various examples', 'different ways'
    ];
    
    if (exerciseKeywords.some(kw => input.includes(kw)) || exercise_type) {
      complexityScore += 30;
      reasoning.push('Exercise/example generation needed');
    }

    // 3. Grammar complexity indicators
    const grammarKeywords = [
      'grammar', 'particle', 'conjugation', 'verb form', 'adjective',
      'keigo', 'honorific', 'casual vs formal', 'て form', 'ます form',
      'potential form', 'causative', 'passive', 'conditional'
    ];
    
    if (grammarKeywords.some(kw => input.includes(kw))) {
      complexityScore += 25;
      reasoning.push('Complex grammar topic');
    }

    // 4. Cultural/contextual explanations
    const culturalKeywords = [
      'culture', 'custom', 'tradition', 'etiquette', 'when to use',
      'appropriate', 'polite', 'impolite', 'context', 'situation',
      'why do japanese', 'cultural'
    ];
    
    if (culturalKeywords.some(kw => input.includes(kw))) {
      complexityScore += 20;
      reasoning.push('Cultural context needed');
    }

    // 5. Advanced level content
    if (level === 'advanced' || level === 'intermediate') {
      complexityScore += 15;
      reasoning.push(`${level} level - more nuanced explanations`);
    }

    // 6. Multiple reference materials available
    if (totalReferences >= 3) {
      complexityScore += 20;
      reasoning.push(`${totalReferences} reference materials to synthesize`);
    }

    // 7. Question length (longer questions = more complex)
    if (userInput.length > 100) {
      complexityScore += 10;
      reasoning.push('Lengthy/complex question');
    }

    // 8. Multiple questions or topics
    const questionMarks = (input.match(/\?/g) || []).length;
    const andCount = (input.match(/\band\b/gi) || []).length;
    
    if (questionMarks > 1 || andCount > 2) {
      complexityScore += 15;
      reasoning.push('Multiple questions/topics');
    }

    // 9. Simple query indicators (reduce complexity)
    const simpleKeywords = [
      'what is', 'translate', 'how do you say', 'meaning of',
      'define', 'definition', 'what does', 'romaji for'
    ];
    
    const isSimpleQuery = simpleKeywords.some(kw => input.startsWith(kw)) && 
                         userInput.length < 50 && 
                         questionMarks <= 1;
    
    if (isSimpleQuery) {
      complexityScore = Math.max(0, complexityScore - 30);
      reasoning.push('Simple lookup query detected');
    }

    // Determine task type based on score
    if (complexityScore >= 60) {
      taskType = 'detailed_explanation';
    } else if (complexityScore >= 40) {
      taskType = 'exercise_generation';
    } else if (complexityScore >= 20) {
      taskType = 'standard_teaching';
    } else if (complexityScore >= 10) {
      taskType = 'quick_answer';
    } else {
      taskType = 'simple_query';
    }

    const preset = this.contextPresets[taskType];

    return {
      taskType,
      complexityScore,
      reasoning,
      preset,
      metadata: {
        queryLength: userInput.length,
        referenceCount: totalReferences,
        level,
        questionCount: questionMarks
      }
    };
  }

  async tutorChat(userInput, context) {
    this.requestCount++;
    const startTime = Date.now();
    
    console.log('🤖 Starting Ollama request...');
    console.log(`   Model: ${this.model}`);
    console.log(`   Base URL: ${this.baseURL}`);
    
    // Analyze query and select optimal context
    const analysis = this.analyzeQueryComplexity(userInput, context);
    
    console.log('\n🧠 Query Analysis:');
    console.log(`   Task Type: ${analysis.taskType}`);
    console.log(`   Complexity Score: ${analysis.complexityScore}`);
    console.log(`   Context Window: ${analysis.preset.num_ctx} tokens`);
    console.log(`   Max Generation: ${analysis.preset.num_predict} tokens`);
    console.log(`   Reasoning:`);
    analysis.reasoning.forEach(reason => console.log(`     • ${reason}`));
    
    const prompt = this.buildJapaneseTutorPrompt(userInput, context);
    
    console.log('\n📝 Prompt Stats:');
    console.log(`   Length: ${prompt.length} characters (~${Math.ceil(prompt.length / 4)} tokens)`);
    console.log(`   First 150 chars: ${prompt.substring(0, 150)}...`);
    
    try {
      console.log('\n📡 Sending request to Ollama...');
      
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: analysis.preset.temperature,
          top_p: 0.95,
          repeat_penalty: 1.15,
          num_ctx: analysis.preset.num_ctx,
          num_predict: analysis.preset.num_predict,
          tfs_z: 0.95,
          mirostat: 2,
          mirostat_tau: 5,
          mirostat_eta: 0.1
        }
      }, {
        timeout: 180000 // 3 minute timeout for detailed explanations
      });

      this.lastResponseTime = Date.now() - startTime;
      
      console.log(`\n✅ Ollama responded in ${this.lastResponseTime}ms`);
      
      if (!response.data || !response.data.response) {
        console.error('❌ Invalid response from Ollama:', response.data);
        throw new Error('Invalid response from Ollama - no response field');
      }
      
      const responseLength = response.data.response.length;
      const estimatedTokens = Math.ceil(responseLength / 4);
      
      console.log(`📤 Generated Response:`);
      console.log(`   Characters: ${responseLength}`);
      console.log(`   Estimated Tokens: ${estimatedTokens}`);
      console.log(`   Utilization: ${((estimatedTokens / analysis.preset.num_predict) * 100).toFixed(1)}%`);
      
      // Log if we're approaching context limits
      if (estimatedTokens > analysis.preset.num_predict * 0.9) {
        console.warn(`⚠️  Response approaching generation limit (${analysis.preset.num_predict} tokens)`);
        console.warn(`   Consider using 'detailed_explanation' preset for this query type`);
      }
      
      return {
        response: this.postProcessResponse(response.data.response),
        metadata: {
          taskType: analysis.taskType,
          complexityScore: analysis.complexityScore,
          contextUsed: analysis.preset.num_ctx,
          tokensGenerated: estimatedTokens,
          responseTime: this.lastResponseTime,
          reasoning: analysis.reasoning
        }
      };
      
    } catch (error) {
      console.error('\n❌❌❌ OLLAMA SERVICE ERROR ❌❌❌');
      console.error('Error type:', error.code || error.name);
      console.error('Error message:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.error('🚨 Ollama is not running!');
        console.error('   Start it with: ollama serve');
        throw new Error('Ollama service is not running. Please start with: ollama serve');
      }
      
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        console.error('🚨 Ollama request timed out!');
        console.error(`   Query was categorized as: ${analysis.taskType}`);
        console.error(`   Context window: ${analysis.preset.num_ctx} tokens`);
        throw new Error(`Request timed out (${analysis.taskType}). The model may need more time for this complexity.`);
      }
      
      if (error.response?.status === 404) {
        console.error(`🚨 Model not found: ${this.model}`);
        console.error('   Available models: run "ollama list" to see installed models');
        throw new Error(`Model "${this.model}" not found. Run "ollama list" to see available models.`);
      }
      
      console.error('Full error:', error);
      console.error('========================================\n');
      
      throw new Error(`Ollama service error: ${error.message}`);
    }
  }

  buildJapaneseTutorPrompt(userInput, context) {
    const { 
      level = 'beginner', 
      topic, 
      exercise_type, 
      previous_context, 
      rag_context = [], 
      internet_context = [],
      combined_sources = ''
    } = context;
    
    // Level-specific instructions
    const levelInstructions = {
      'beginner': 'Use simple English explanations, basic vocabulary, and include romanization (romaji) for all Japanese text. Show hiragana: ひらがな, katakana: カタカナ, basic kanji: 漢字',
      'elementary': 'Provide clear explanations with some intermediate vocabulary, include furigana for complex kanji. Example: 食べる(たべる)',
      'intermediate': 'Give detailed explanations, introduce more complex grammar patterns, mix hiragana/katakana/kanji appropriately. Use natural Japanese examples.',
      'advanced': 'Provide nuanced explanations, discuss exceptions and variations, use authentic Japanese expressions with complex kanji.'
    };
    
    let systemPrompt = `You are an expert Japanese language tutor with years of teaching experience. You are helping a ${level} level student.

IMPORTANT GUIDELINES:
- ${levelInstructions[level]}
- Always show Japanese characters properly: ひらがな (hiragana), カタカナ (katakana), 漢字 (kanji)
- Format Japanese text clearly with proper Unicode support
- Be thorough and educational - this is a learning environment, so detailed explanations are valued
- Always be encouraging and patient
- Provide practical examples they can use immediately  
- When showing Japanese text, include pronunciation help
- Show kanji with furigana when appropriate
- If the user requests exercises, provide them with answers and explanations
- Use a mix of English and Japanese as appropriate for the student's level
- Reference previous context if relevant: ${previous_context ? previous_context : 'None'}
- Tailor examples to the topic if provided: ${topic ? topic : 'General topics'}
- Explain cultural context when relevant
- If the question is complex, break down your explanation into clear sections
- If the question is unclear, ask for clarification
- Use the reference materials provided to give accurate, well-sourced answers

Current context: ${topic ? `Topic: ${topic}` : 'General Japanese learning'}`;

    // Add combined sources summary if available
    if (combined_sources) {
      systemPrompt += `\n\nAVAILABLE RESOURCES: ${combined_sources}`;
    }

    // Add local RAG context if available
    if (rag_context && rag_context.length > 0) {
      systemPrompt += `\n\nLOCAL REFERENCE MATERIALS:`;
      rag_context.forEach((ref, index) => {
        systemPrompt += `\n${index + 1}. ${ref.title || 'Grammar Reference'}`;
        if (ref.content) {
          // Truncate content to prevent prompt overflow
          const content = ref.content.length > 500 ? ref.content.substring(0, 500) + '...' : ref.content;
          systemPrompt += `\n   Content: ${content}`;
        }
        if (ref.source) {
          systemPrompt += `\n   Source: ${ref.source}`;
        }
        systemPrompt += `\n   Relevance Score: ${(ref.score || 0.5).toFixed(2)}`;
      });
    }

    // Add internet context if available
    if (internet_context && internet_context.length > 0) {
      systemPrompt += `\n\nINTERNET REFERENCE MATERIALS:`;
      internet_context.forEach((ref, index) => {
        systemPrompt += `\n${index + 1}. ${ref.title}`;
        if (ref.snippet) {
          systemPrompt += `\n   Summary: ${ref.snippet}`;
        }
        if (ref.source_url) {
          systemPrompt += `\n   Source: ${ref.domain || ref.source_url}`;
        }
        systemPrompt += `\n   Relevance Score: ${(ref.score || 0.5).toFixed(2)}`;
      });
    }

    // Add instruction for using references
    if ((rag_context && rag_context.length > 0) || (internet_context && internet_context.length > 0)) {
      systemPrompt += `\n\nIMPORTANT: Use the reference materials above to provide accurate, well-informed answers. When possible, cite which source you're drawing information from (e.g., "According to the grammar guide..." or "Based on the reference materials...").`;
    }

    return `${systemPrompt}

Student Question: "${userInput}"

Please provide a helpful, educational response with proper Japanese characters, using the reference materials when relevant. Be as detailed as necessary to ensure the student fully understands:`;
  }

  postProcessResponse(response) {
    // If response is an object with metadata, extract just the text
    if (typeof response === 'object' && response.response) {
      response = response.response;
    }
    
    // Clean up the response
    let cleaned = response.trim();
    
    // Remove any system artifacts
    cleaned = cleaned.replace(/^(Assistant:|AI:|Tutor:)\s*/i, '');
    
    // Ensure proper spacing
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned;
  }

  /**
   * Get statistics about context window usage
   */
  getContextStats() {
    return {
      presets: this.contextPresets,
      requestCount: this.requestCount,
      avgResponseTime: this.lastResponseTime
    };
  }

  async checkStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      const models = response.data.models || [];
      
      const currentModelExists = models.some(m => m.name === this.model);
      
      return {
        status: 'healthy',
        ollama_url: this.baseURL,
        current_model: this.model,
        model_exists: currentModelExists,
        available_models: models.map(m => ({
          name: m.name,
          size: this.formatBytes(m.size),
          modified: m.modified_at
        })),
        request_count: this.requestCount,
        avg_response_time: this.lastResponseTime,
        context_presets: Object.keys(this.contextPresets)
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return {
          status: 'error',
          error: 'Ollama service not running. Start with: ollama serve',
          ollama_url: this.baseURL
        };
      }
      return {
        status: 'error',
        error: error.message,
        ollama_url: this.baseURL
      };
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Utility method for streaming responses (future enhancement)
  async streamChat(userInput, context, onChunk) {
    const analysis = this.analyzeQueryComplexity(userInput, context);
    const prompt = this.buildJapaneseTutorPrompt(userInput, context);
    
    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt,
        stream: true,
        options: {
          temperature: analysis.preset.temperature,
          top_p: 0.95,
          repeat_penalty: 1.15,
          num_ctx: analysis.preset.num_ctx,
          num_predict: analysis.preset.num_predict,
          tfs_z: 0.95,
          mirostat: 2,
          mirostat_tau: 5,
          mirostat_eta: 0.1
        }
      }, {
        responseType: 'stream'
      });

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              onChunk(data.response);
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      });

    } catch (error) {
      throw new Error(`Streaming error: ${error.message}`);
    }
  }
}

module.exports = OllamaService;