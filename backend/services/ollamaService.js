const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3:8b';
    this.lastResponseTime = 0;
    this.requestCount = 0;
  }

  async tutorChat(userInput, context) {
    this.requestCount++;
    const startTime = Date.now();
    
    const prompt = this.buildJapaneseTutorPrompt(userInput, context);
    
    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          repeat_penalty: 1.1,
          num_ctx: 2048,
          num_predict: 800  // Limit response length
        }
      });

      this.lastResponseTime = Date.now() - startTime;
      
      if (!response.data || !response.data.response) {
        throw new Error('Invalid response from Ollama');
      }
      
      return this.postProcessResponse(response.data.response);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama service is not running. Please start with: ollama serve');
      }
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
- Always be encouraging and patient
- Provide practical examples they can use immediately  
- When showing Japanese text, include pronunciation help
- Explain cultural context when relevant
- Keep responses focused and not too long
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
          const content = ref.content.length > 300 ? ref.content.substring(0, 300) + '...' : ref.content;
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
      systemPrompt += `\n\nIMPORTANT: Use the reference materials above to provide accurate, well-informed answers. When possible, cite which source you're drawing information from (e.g., "According to the grammar guide..." or "Based on the Jisho dictionary...").`;
    }

    return `${systemPrompt}

Student Question: "${userInput}"

Please provide a helpful, educational response with proper Japanese characters, using the reference materials when relevant:`;
  }

  postProcessResponse(response) {
    // Clean up the response
    let cleaned = response.trim();
    
    // Remove any system artifacts
    cleaned = cleaned.replace(/^(Assistant:|AI:|Tutor:)\s*/i, '');
    
    // Ensure proper spacing
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned;
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
        avg_response_time: this.lastResponseTime
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

  // Utility method pentru streaming responses (future enhancement)
  async streamChat(userInput, context, onChunk) {
    const prompt = this.buildJapaneseTutorPrompt(userInput, context);
    
    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          repeat_penalty: 1.1,
          num_ctx: 2048
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