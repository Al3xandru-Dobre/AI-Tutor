// DocumentGenerationService.js - Generate PDF and DOCX documents from conversations and learning materials
const PDFDocument = require('pdfkit');
const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = require('docx');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

class DocumentGenerationService {
  constructor(ollamaService = null, modelProviderService = null) {
    this.outputDir = path.join(__dirname, '../../generated_documents');
    this.fontPath = path.join(__dirname, '../fonts/NotoSansJP-Regular.ttf');
    this.ensureOutputDirectory();
    this.ollamaService = ollamaService; // Keep for backward compatibility
    this.modelProviderService = modelProviderService;

    this.stats = {
      totalGenerated: 0,
      pdfCount: 0,
      docxCount: 0,
      lastGenerated: null,
      llmGenerated: 0
    };

    console.log('📄 Document Generation Service initialized');
    this._checkJapaneseFont();
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputDir}`);
    }
  }

  /**
   * Check if Japanese font exists
   * @private
   */
  _checkJapaneseFont() {
    if (fs.existsSync(this.fontPath)) {
      console.log(`✅ Japanese font loaded: ${path.basename(this.fontPath)}`);
    } else {
      console.warn(`⚠️  Japanese font not found at: ${this.fontPath}`);
      console.warn('   PDFs may not display Japanese characters correctly');
      console.warn('   Download Noto Sans JP from: https://fonts.google.com/noto/specimen/Noto+Sans+JP');
    }
  }

  /**
   * Register Japanese font in PDF document
   * @private
   */
  _registerJapaneseFont(doc) {
    if (fs.existsSync(this.fontPath)) {
      try {
        doc.registerFont('NotoSansJP', this.fontPath);
        doc.font('NotoSansJP');
        console.log('✅ Japanese font registered for PDF');
        this.hasJapaneseFont = true;
        return true;
      } catch (error) {
        console.warn('⚠️  Failed to load Japanese font:', error.message);
        console.warn('   Using default font instead');
        doc.font('Helvetica');
        this.hasJapaneseFont = false;
        return false;
      }
    }
    console.warn('⚠️  Japanese font file not found at:', this.fontPath);
    console.warn('   Using default font instead');
    doc.font('Helvetica');
    this.hasJapaneseFont = false;
    return false;
  }

  /**
   * Set font safely - uses Japanese font if available, otherwise fallback
   * @private
   */
  _setFont(doc, style = 'regular') {
    if (this.hasJapaneseFont) {
      doc.font('NotoSansJP');
    } else {
      // Fallback to Helvetica variants
      const fontMap = {
        'regular': 'Helvetica',
        'bold': 'Helvetica-Bold',
        'italic': 'Helvetica-Oblique'
      };
      doc.font(fontMap[style] || 'Helvetica');
    }
  }

  /**
   * Generate PDF from conversation with modern styling
   * @param {Object} conversation - Conversation object with messages
   * @param {Object} options - Generation options
   * @returns {Promise<string>} - Path to generated PDF
   */
  async generateConversationPDF(conversation, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = options.filename || `conversation_${conversation.id}_${timestamp}.pdf`;
        const filepath = path.join(this.outputDir, filename);

        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 60, bottom: 60, left: 60, right: 60 },
          info: {
            Title: conversation.title || 'Japanese Learning Conversation',
            Author: 'AI Tutor',
            Subject: 'Japanese Language Learning',
            Creator: 'AI Tutor Document Generator'
          }
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Register Japanese font
        this._registerJapaneseFont(doc);

        // Modern color palette
        const colors = {
          primary: '#D32F2F',
          secondary: '#1976D2',
          accent: '#FFA726',
          userBg: '#E3F2FD',
          userBorder: '#2196F3',
          assistantBg: '#F1F8E9',
          assistantBorder: '#8BC34A',
          dark: '#263238',
          text: '#37474F',
          textLight: '#607D8B'
        };

        // Header section
        const headerHeight = 100;
        doc.rect(0, 0, doc.page.width, headerHeight)
           .fill(colors.primary);

        doc.rect(0, headerHeight - 6, doc.page.width, 6)
           .fill(colors.accent);

        // Title
        doc.fontSize(24)
           .fillColor('#FFFFFF');
        this._setFont(doc, 'bold');
        doc.text(conversation.title || 'Japanese Learning Conversation', 60, 30, {
          align: 'center',
          width: doc.page.width - 120
        });

        // Metadata
        doc.fontSize(10)
           .fillColor('#FFFFFF');
        this._setFont(doc, 'regular');
        doc.text(`Generated: ${new Date().toLocaleString()}`, 60, 65, {
          align: 'center',
          width: doc.page.width - 120
        });

        // Move below header
        doc.y = headerHeight + 25;

        // Conversation info box
        if (conversation.createdAt) {
          const infoY = doc.y;
          doc.roundedRect(60, infoY, doc.page.width - 120, 35, 5)
             .fill(colors.userBg);

          doc.fontSize(9)
             .fillColor(colors.textLight);
          this._setFont(doc, 'regular');
          doc.text(
            `Conversation started: ${new Date(conversation.createdAt).toLocaleString()}  •  ${conversation.messages.length} messages`,
            70,
            infoY + 12
          );

          doc.y = infoY + 50;
        }

        // Add messages with modern chat-style bubbles
        conversation.messages.forEach((message, index) => {
          // Check if we need a new page
          if (doc.y > 680) {
            doc.addPage();
            doc.y = 60;
          }

          const isUser = message.role === 'user';
          const bubbleColor = isUser ? colors.userBg : colors.assistantBg;
          const borderColor = isUser ? colors.userBorder : colors.assistantBorder;
          const roleLabel = isUser ? '👤 You' : '🤖 AI Tutor';
          const icon = isUser ? '👤' : '🤖';

          const startY = doc.y;

          // Role indicator with icon
          doc.fontSize(10)
             .fillColor(colors.dark);
          this._setFont(doc, 'bold');
          doc.text(`${icon} ${roleLabel}`, 70, startY);

          doc.moveDown(0.5);

          // Message bubble
          const messageStartY = doc.y;
          const bubbleX = 70;
          const bubbleWidth = doc.page.width - 140;

          // Draw bubble background
          doc.roundedRect(bubbleX, messageStartY - 5, bubbleWidth, 'auto', 8)
             .fillAndStroke(bubbleColor, borderColor)
             .lineWidth(1.5);

          // Message content
          doc.fontSize(11)
             .fillColor(colors.text);
          this._setFont(doc, 'regular');
          doc.text(message.content, bubbleX + 15, messageStartY + 5, {
            width: bubbleWidth - 30,
            align: 'left',
            lineGap: 4
          });

          const bubbleHeight = doc.y - messageStartY + 15;

          // Redraw bubble with correct height
          doc.roundedRect(bubbleX, messageStartY - 5, bubbleWidth, bubbleHeight, 8)
             .fillAndStroke(bubbleColor, borderColor)
             .lineWidth(1.5);

          // Re-render text on top
          doc.fontSize(11)
             .fillColor(colors.text);
          this._setFont(doc, 'regular');
          doc.text(message.content, bubbleX + 15, messageStartY + 5, {
            width: bubbleWidth - 30,
            align: 'left',
            lineGap: 4
          });

          doc.moveDown(1.5);
        });

        // Add footer to all pages
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
          doc.switchToPage(range.start + i);

          // Footer line
          const footerY = doc.page.height - 50;
          doc.moveTo(60, footerY)
             .lineTo(doc.page.width - 60, footerY)
             .lineWidth(1)
             .strokeColor(colors.textLight)
             .stroke();

          // Page number
          doc.fontSize(9)
             .fillColor(colors.textLight);
          this._setFont(doc, 'regular');
          doc.text(
            `Page ${i + 1} of ${range.count}`,
            60,
            footerY + 10,
            { align: 'center', width: doc.page.width - 120 }
          );

          // Branding
          doc.fontSize(8)
             .fillColor(colors.textLight);
          doc.text(
            '✨ Generated by AI Japanese Tutor',
            60,
            footerY + 25,
            { align: 'center', width: doc.page.width - 120 }
          );
        }

        doc.end();

        stream.on('finish', () => {
          this.stats.totalGenerated++;
          this.stats.pdfCount++;
          this.stats.lastGenerated = new Date().toISOString();
          console.log(`✅ PDF generated: ${filename}`);
          resolve(filepath);
        });

        stream.on('error', reject);

      } catch (error) {
        console.error('❌ PDF generation error:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate DOCX from conversation
   * @param {Object} conversation - Conversation object with messages
   * @param {Object} options - Generation options
   * @returns {Promise<string>} - Path to generated DOCX
   */
  async generateConversationDOCX(conversation, options = {}) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = options.filename || `conversation_${conversation.id}_${timestamp}.docx`;
      const filepath = path.join(this.outputDir, filename);

      const sections = [];
      const children = [];

      // Add title
      children.push(
        new Paragraph({
          text: conversation.title || 'Japanese Learning Conversation',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      );

      // Add metadata
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${new Date().toLocaleString()}`,
              italics: true,
              color: '666666',
              size: 18
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );

      if (conversation.createdAt) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Conversation started: ${new Date(conversation.createdAt).toLocaleString()}`,
                color: '999999',
                size: 18
              })
            ],
            spacing: { after: 400 }
          })
        );
      }

      // Add messages
      conversation.messages.forEach((message, index) => {
        const isUser = message.role === 'user';
        const roleLabel = isUser ? '👤 You' : '🤖 AI Tutor';

        // Role heading
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: roleLabel,
                bold: true,
                color: isUser ? '2c3e50' : '1b5e20',
                size: 22
              })
            ],
            spacing: { before: 200, after: 100 }
          })
        );

        // Message content
        children.push(
          new Paragraph({
            text: message.content,
            spacing: { after: 200 }
          })
        );

        // Add separator (except for last message)
        if (index < conversation.messages.length - 1) {
          children.push(
            new Paragraph({
              text: '─'.repeat(50),
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 100 }
            })
          );
        }
      });

      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: children
        }],
        creator: 'AI Tutor Document Generator',
        title: conversation.title || 'Japanese Learning Conversation',
        description: 'Generated conversation from AI Tutor'
      });

      // Generate and save
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filepath, buffer);

      this.stats.totalGenerated++;
      this.stats.docxCount++;
      this.stats.lastGenerated = new Date().toISOString();
      console.log(`✅ DOCX generated: ${filename}`);

      return filepath;

    } catch (error) {
      console.error('❌ DOCX generation error:', error);
      throw error;
    }
  }

  /**
   * Generate study guide PDF from learning materials with modern styling
   * @param {Object} data - Study guide data
   * @returns {Promise<string>} - Path to generated PDF
   */
  async generateStudyGuidePDF(data, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = options.filename || `study_guide_${timestamp}.pdf`;
        const filepath = path.join(this.outputDir, filename);

        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 60, bottom: 60, left: 60, right: 60 }
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Register Japanese font
        this._registerJapaneseFont(doc);

        // Modern color palette (Japanese-inspired)
        const colors = {
          primary: '#D32F2F',      // Red (traditional Japanese red)
          secondary: '#1976D2',    // Blue
          accent: '#FFA726',       // Orange
          dark: '#263238',         // Dark blue-grey
          light: '#ECEFF1',        // Light grey
          success: '#388E3C',      // Green
          text: '#37474F',         // Dark grey for text
          textLight: '#607D8B'     // Light grey for secondary text
        };

        // HEADER SECTION - with gradient-like effect
        const headerHeight = 120;
        doc.rect(0, 0, doc.page.width, headerHeight)
           .fill(colors.primary);

        // Decorative accent bar
        doc.rect(0, headerHeight - 8, doc.page.width, 8)
           .fill(colors.accent);

        // Title
        doc.fontSize(28)
           .fillColor('#FFFFFF');
        this._setFont(doc, 'bold');
        doc.text(data.title || 'Japanese Study Guide', 60, 35, {
          align: 'center',
          width: doc.page.width - 120
        });

        // Subtitle with level badge
        if (data.level) {
          doc.fontSize(14)
             .fillColor('#FFFFFF');
          this._setFont(doc, 'regular');
          doc.text(`${data.level.toUpperCase()} LEVEL`, 60, 75, {
            align: 'center',
            width: doc.page.width - 120
          });
        }

        // Move below header
        doc.y = headerHeight + 30;

        // Info box with topic
        if (data.topic) {
          const infoBoxY = doc.y;
          doc.roundedRect(60, infoBoxY, doc.page.width - 120, 60, 5)
             .fill(colors.light);

          doc.fontSize(10)
             .fillColor(colors.textLight);
          this._setFont(doc, 'bold');
          doc.text('TOPIC:', 75, infoBoxY + 15);

          doc.fontSize(13)
             .fillColor(colors.text);
          this._setFont(doc, 'regular');
          doc.text(data.topic, 75, infoBoxY + 32, {
            width: doc.page.width - 150
          });

          doc.y = infoBoxY + 75;
        }

        doc.moveDown(1);

        // Content sections with modern styling
        if (data.sections && Array.isArray(data.sections)) {
          data.sections.forEach((section, index) => {
            // Check if we need a new page
            if (doc.y > 650) {
              doc.addPage();
              doc.y = 60;
            }

            const sectionStartY = doc.y;

            // Section number badge
            const badgeSize = 35;
            const badgeX = 60;
            const badgeY = sectionStartY;

            // Colored circle badge
            doc.circle(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2)
               .fill(colors.secondary);

            doc.fontSize(16)
               .fillColor('#FFFFFF');
            this._setFont(doc, 'bold');
            doc.text(`${index + 1}`, badgeX, badgeY + 10, {
              width: badgeSize,
              align: 'center'
            });

            // Section heading
            doc.fontSize(18)
               .fillColor(colors.dark);
            this._setFont(doc, 'bold');
            doc.text(section.heading || `Section ${index + 1}`, badgeX + badgeSize + 15, badgeY + 5);

            // Decorative underline
            const lineY = badgeY + 30;
            doc.moveTo(badgeX + badgeSize + 15, lineY)
               .lineTo(doc.page.width - 60, lineY)
               .lineWidth(2)
               .strokeColor(colors.accent)
               .stroke();

            doc.y = lineY + 20;

            // Section content box
            const contentStartY = doc.y;
            const contentPadding = 20;

            // Parse and format content with better styling
            const formattedContent = this._formatContentWithStyle(section.content);

            // First, measure the text height by rendering it temporarily
            const measureY = doc.y;
            doc.fontSize(11)
               .fillColor(colors.text);
            this._setFont(doc, 'regular');
            doc.text(formattedContent, 60 + contentPadding, contentStartY + 5, {
              width: doc.page.width - 120 - (contentPadding * 2),
              align: 'left',
              lineGap: 5
            });

            // Calculate the actual content height
            const contentHeight = doc.y - contentStartY + 20;

            // Now draw the background box with the measured height
            doc.roundedRect(60, contentStartY - 10, doc.page.width - 120, contentHeight, 3)
               .fillOpacity(0.08)
               .fill(colors.light)
               .fillOpacity(1);

            // Re-render the text on top of the background
            doc.fontSize(11)
               .fillColor(colors.text);
            this._setFont(doc, 'regular');
            doc.text(formattedContent, 60 + contentPadding, contentStartY + 5, {
              width: doc.page.width - 120 - (contentPadding * 2),
              align: 'left',
              lineGap: 5
            });

            doc.moveDown(2);
          });
        } else if (data.content) {
          // Single content block with nice formatting
          doc.fontSize(11)
             .fillColor(colors.text);
          this._setFont(doc, 'regular');
          doc.text(data.content, {
            width: doc.page.width - 120,
            align: 'left',
            lineGap: 5
          });
        }

        // Add footer to all pages
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
          doc.switchToPage(range.start + i);

          // Footer line
          const footerY = doc.page.height - 50;
          doc.moveTo(60, footerY)
             .lineTo(doc.page.width - 60, footerY)
             .lineWidth(1)
             .strokeColor(colors.textLight)
             .stroke();

          // Page number
          doc.fontSize(9)
             .fillColor(colors.textLight);
          this._setFont(doc, 'regular');
          doc.text(
            `Page ${i + 1} of ${range.count}`,
            60,
            footerY + 10,
            { align: 'center', width: doc.page.width - 120 }
          );

          // Branding
          doc.fontSize(8)
             .fillColor(colors.textLight);
          doc.text(
            '✨ Generated by AI Japanese Tutor',
            60,
            footerY + 25,
            { align: 'center', width: doc.page.width - 120 }
          );
        }

        doc.end();

        stream.on('finish', () => {
          this.stats.totalGenerated++;
          this.stats.pdfCount++;
          this.stats.lastGenerated = new Date().toISOString();
          console.log(`✅ Study guide PDF generated: ${filename}`);
          resolve(filepath);
        });

        stream.on('error', reject);

      } catch (error) {
        console.error('❌ Study guide PDF generation error:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate markdown document from conversation
   * @param {Object} conversation - Conversation object
   * @returns {Promise<string>} - Path to generated markdown file
   */
  async generateConversationMarkdown(conversation, options = {}) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = options.filename || `conversation_${conversation.id}_${timestamp}.md`;
      const filepath = path.join(this.outputDir, filename);

      let markdown = `# ${conversation.title || 'Japanese Learning Conversation'}\n\n`;
      markdown += `*Generated: ${new Date().toLocaleString()}*\n\n`;

      if (conversation.createdAt) {
        markdown += `*Conversation started: ${new Date(conversation.createdAt).toLocaleString()}*\n\n`;
      }

      markdown += '---\n\n';

      conversation.messages.forEach((message, index) => {
        const isUser = message.role === 'user';
        const roleLabel = isUser ? '**👤 You:**' : '**🤖 AI Tutor:**';

        markdown += `${roleLabel}\n\n${message.content}\n\n`;

        if (index < conversation.messages.length - 1) {
          markdown += '---\n\n';
        }
      });

      fs.writeFileSync(filepath, markdown, 'utf8');

      this.stats.totalGenerated++;
      this.stats.lastGenerated = new Date().toISOString();
      console.log(`✅ Markdown generated: ${filename}`);

      return filepath;

    } catch (error) {
      console.error('❌ Markdown generation error:', error);
      throw error;
    }
  }

  /**
   * Get list of generated documents
   * @returns {Array} - List of generated documents
   */
  getGeneratedDocuments() {
    try {
      const files = fs.readdirSync(this.outputDir);
      return files.map(file => {
        const filepath = path.join(this.outputDir, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          path: filepath,
          size: stats.size,
          created: stats.birthtime,
          extension: path.extname(file)
        };
      }).sort((a, b) => b.created - a.created);
    } catch (error) {
      console.error('Error reading generated documents:', error);
      return [];
    }
  }

  /**
   * Delete a generated document
   * @param {string} filename - Name of the file to delete
   * @returns {boolean} - Success status
   */
  deleteDocument(filename) {
    try {
      const filepath = path.join(this.outputDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`🗑️  Deleted: ${filename}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  /**
   * Generate document using LLM based on user prompt
   * @param {string} prompt - User's request for document generation
   * @param {string} level - User's learning level
   * @param {string} format - Output format (pdf, docx, markdown)
   * @param {Object} options - Generation options (provider, model)
   * @returns {Promise<Object>} - Generated document info
   */
  async generateDocumentWithLLM(prompt, level = 'beginner', format = 'pdf', options = {}) {
    // Use ModelProviderService if available, otherwise fall back to OllamaService
    const useModelProvider = this.modelProviderService && this.modelProviderService.isInitialized;

    if (!useModelProvider && !this.ollamaService) {
      throw new Error('LLM service not available. Please configure a model provider.');
    }

    try {
      const provider = options.provider || 'ollama';
      const model = options.model || null;

      console.log(`🤖 Generating ${format.toUpperCase()} document with ${provider}${model ? `/${model}` : ''} for: "${prompt}"`);

      // Determine optimal token limit based on provider and request complexity
      const tokenLimits = {
        'mistral': 16000,    // Mistral models support up to 32K, using 16K for safety
        'groq': 8000,        // Groq varies by model, 8K is safe default
        'cerebras': 8000,    // Cerebras supports 8K
        'openrouter': 8000,  // Varies by model
        'ollama': 8000       // Depends on model, 8K is safe for most
      };

      const maxTokens = tokenLimits[provider] || 8000;
      console.log(`📊 Using token limit: ${maxTokens} tokens for ${provider}`);

      // Detect if this is a comprehensive request (needs more tokens)
      const isComprehensive = prompt.toLowerCase().includes('comprehensive') ||
                              prompt.toLowerCase().includes('complete') ||
                              prompt.toLowerCase().includes('whole') ||
                              prompt.toLowerCase().includes('n5-n4') ||
                              prompt.toLowerCase().includes('all chapters');

      const effectiveMaxTokens = isComprehensive ? maxTokens : Math.floor(maxTokens * 0.6);
      console.log(`📝 Document complexity: ${isComprehensive ? 'Comprehensive' : 'Standard'} (${effectiveMaxTokens} tokens)`);

      // Create LLM prompt for document generation
      const systemPrompt = `You are a Japanese language expert creating educational materials. Generate a comprehensive, well-structured document based on the user's request.

Format your response as a structured document with:
- A clear title
- Organized sections with headings
- Detailed content for each section
- Examples where appropriate
- Level-appropriate language (current level: ${level})

Make the content educational, engaging, and suitable for ${level} learners.`;

      // Adjust prompt based on comprehensiveness
      let userPrompt;
      if (isComprehensive) {
        userPrompt = `Create a COMPREHENSIVE Japanese learning document about: ${prompt}

This is a large-scale study guide. Please structure the content with:
1. A clear introduction explaining the scope
2. MULTIPLE detailed chapters/sections (at least 5-8), each covering a major topic
3. For EACH chapter, include:
   - Clear explanations with examples
   - Vocabulary lists with translations
   - Grammar points with usage examples
   - Practice exercises with answers
4. Summary and review section at the end

Use markdown headings (## for chapters, ### for subsections) to organize the content clearly.
Make this as detailed and educational as possible within the token limit.`;
      } else {
        userPrompt = `Create a Japanese learning document about: ${prompt}

Please structure the content with:
1. An introduction
2. Main content divided into logical sections (2-4 sections)
3. Practical examples with translations
4. Key takeaways or summary

Format the content in a clear, organized manner suitable for a study guide.`;
      }

      // Generate content using LLM
      let llmResponse;

      if (useModelProvider) {
        // Use ModelProviderService for multi-provider support
        // For cloud providers, use proper message array format with system + user messages
        try {
          if (provider !== 'ollama') {
            // Cloud provider - use message array format
            const messages = [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ];
            llmResponse = await this.modelProviderService.generate(messages, {
              provider: provider,
              model: model,
              temperature: 0.7,
              maxTokens: effectiveMaxTokens
            });
          } else {
            // Ollama - use concatenated prompt format
            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
            llmResponse = await this.modelProviderService.generate(fullPrompt, {
              provider: provider,
              model: model,
              temperature: 0.7,
              maxTokens: effectiveMaxTokens
            });
          }
        } catch (error) {
          // If rate limited or other error with cloud provider, fall back to Ollama
          if (error.status === 429 || error.code === 'rate_limit_exceeded') {
            console.log(`⚠️  ${provider} rate limited, falling back to Ollama`);
            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
            llmResponse = await this.modelProviderService.generate(fullPrompt, {
              provider: 'ollama',
              model: null,
              temperature: 0.7,
              maxTokens: effectiveMaxTokens
            });
          } else {
            throw error; // Re-throw if not a rate limit error
          }
        }
      } else {
        // Fallback to OllamaService
        const ollamaResult = await this.ollamaService.tutorChat(userPrompt, {
          level,
          topic: prompt,
          previous_context: systemPrompt
        });

        // Extract response from Ollama result (may be object with metadata)
        llmResponse = typeof ollamaResult === 'object' && ollamaResult.response
          ? ollamaResult.response
          : ollamaResult;
      }

      // Ensure llmResponse is a string
      const responseText = typeof llmResponse === 'string' ? llmResponse : String(llmResponse);

      // Parse the response to extract title and sections
      const sections = this._parseDocumentContent(responseText);

      // Generate the document based on format
      let filepath;
      const data = {
        title: sections.title || `Japanese Study Guide: ${prompt.substring(0, 50)}`,
        level: level,
        topic: prompt,
        sections: sections.sections,
        content: responseText
      };

      if (format === 'pdf') {
        filepath = await this.generateStudyGuidePDF(data);
      } else if (format === 'docx') {
        filepath = await this._generateStudyGuideDOCX(data);
      } else if (format === 'markdown') {
        filepath = await this._generateStudyGuideMarkdown(data);
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

      this.stats.llmGenerated++;
      console.log(`✅ LLM-generated document created: ${filepath}`);

      return {
        filepath,
        filename: path.basename(filepath),
        format,
        title: data.title,
        content: responseText
      };

    } catch (error) {
      console.error('❌ LLM document generation error:', error);
      throw error;
    }
  }

  /**
   * Format content with improved styling (better line breaks, checkboxes, etc.)
   * @private
   */
  _formatContentWithStyle(content) {
    if (!content) return '';

    // Clean up excessive whitespace
    let formatted = content.trim();

    // Convert markdown-style checkboxes to better format
    formatted = formatted.replace(/\[x\]/gi, '✓');
    formatted = formatted.replace(/\[ \]/g, '☐');

    // Ensure consistent line breaks
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    return formatted;
  }

  /**
   * Parse LLM response into structured sections
   * @private
   */
  _parseDocumentContent(content) {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = null;
    let title = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Extract title (first # heading or similar)
      if (!title && (trimmed.startsWith('# ') || (trimmed.length > 0 && trimmed === trimmed.toUpperCase() && trimmed.length < 100))) {
        title = trimmed.replace(/^#\s*/, '');
        continue;
      }

      // Detect section headings
      if (trimmed.startsWith('##') || trimmed.startsWith('**') && trimmed.endsWith('**')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: trimmed.replace(/^##\s*/, '').replace(/\*\*/g, ''),
          content: ''
        };
      } else if (currentSection && trimmed.length > 0) {
        currentSection.content += line + '\n';
      } else if (!currentSection && trimmed.length > 0) {
        // Content before first section
        if (!currentSection) {
          currentSection = { heading: 'Introduction', content: '' };
        }
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return { title, sections };
  }

  /**
   * Generate DOCX study guide
   * @private
   */
  async _generateStudyGuideDOCX(data) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `study_guide_${timestamp}.docx`;
      const filepath = path.join(this.outputDir, filename);

      const children = [];

      // Title
      children.push(
        new Paragraph({
          text: data.title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        })
      );

      // Metadata
      if (data.level) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Level: ${data.level.toUpperCase()}`,
                bold: true,
                color: 'e74c3c'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          })
        );
      }

      // Sections
      if (data.sections && Array.isArray(data.sections)) {
        data.sections.forEach(section => {
          children.push(
            new Paragraph({
              text: section.heading,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 200 }
            })
          );

          children.push(
            new Paragraph({
              text: section.content.trim(),
              spacing: { after: 300 }
            })
          );
        });
      }

      const doc = new Document({
        sections: [{ properties: {}, children }],
        creator: 'AI Tutor LLM Document Generator',
        title: data.title
      });

      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filepath, buffer);

      this.stats.totalGenerated++;
      this.stats.docxCount++;
      this.stats.lastGenerated = new Date().toISOString();

      return filepath;
    } catch (error) {
      console.error('Error generating DOCX study guide:', error);
      throw error;
    }
  }

  /**
   * Generate Markdown study guide
   * @private
   */
  async _generateStudyGuideMarkdown(data) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `study_guide_${timestamp}.md`;
      const filepath = path.join(this.outputDir, filename);

      let markdown = `# ${data.title}\n\n`;

      if (data.level) {
        markdown += `**Level:** ${data.level.toUpperCase()}\n\n`;
      }

      if (data.topic) {
        markdown += `**Topic:** ${data.topic}\n\n`;
      }

      markdown += `*Generated: ${new Date().toLocaleString()}*\n\n`;
      markdown += '---\n\n';

      if (data.sections && Array.isArray(data.sections)) {
        data.sections.forEach(section => {
          markdown += `## ${section.heading}\n\n`;
          markdown += `${section.content.trim()}\n\n`;
        });
      } else {
        markdown += data.content;
      }

      fs.writeFileSync(filepath, markdown, 'utf8');

      this.stats.totalGenerated++;
      this.stats.lastGenerated = new Date().toISOString();

      return filepath;
    } catch (error) {
      console.error('Error generating Markdown study guide:', error);
      throw error;
    }
  }

  /**
   * Get service statistics
   * @returns {Object} - Service stats
   */
  getStats() {
    return {
      ...this.stats,
      outputDirectory: this.outputDir,
      totalFiles: this.getGeneratedDocuments().length
    };
  }
}

module.exports = DocumentGenerationService;
