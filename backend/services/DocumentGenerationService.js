// DocumentGenerationService.js - Generate PDF and DOCX documents from conversations and learning materials
const PDFDocument = require('pdfkit');
const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = require('docx');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

class DocumentGenerationService {
  constructor(ollamaService = null) {
    this.outputDir = path.join(__dirname, '../../generated_documents');
    this.fontPath = path.join(__dirname, '../fonts/NotoSansJP-Regular.ttf');
    this.ensureOutputDirectory();
    this.ollamaService = ollamaService;

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
   * Generate PDF from conversation
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
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
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

        // Add header
        doc.fontSize(20)
           .fillColor('#2c3e50')
           .text(conversation.title || 'Japanese Learning Conversation', { align: 'center' });

        doc.moveDown(0.5);
        doc.fontSize(10)
           .fillColor('#7f8c8d')
           .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });

        doc.moveDown(1);
        doc.strokeColor('#3498db')
           .lineWidth(2)
           .moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .stroke();

        doc.moveDown(1.5);

        // Add conversation metadata
        if (conversation.createdAt) {
          doc.fontSize(9)
             .fillColor('#95a5a6')
             .text(`Conversation started: ${new Date(conversation.createdAt).toLocaleString()}`);
          doc.moveDown(0.5);
        }

        // Add messages
        conversation.messages.forEach((message, index) => {
          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage();
          }

          const isUser = message.role === 'user';
          const bgColor = isUser ? '#ecf0f1' : '#e8f5e9';
          const textColor = isUser ? '#2c3e50' : '#1b5e20';
          const roleLabel = isUser ? '👤 You' : '🤖 AI Tutor';

          // Message container
          const startY = doc.y;

          doc.fontSize(10)
             .fillColor(textColor);
          this._setFont(doc, 'bold');
          doc.text(roleLabel, { continued: false });

          doc.moveDown(0.3);

          doc.fontSize(11)
             .fillColor('#000000');
          this._setFont(doc, 'regular');
          doc.text(message.content, {
               width: 495,
               align: 'left',
               lineGap: 3
             });

          doc.moveDown(1);

          // Add separator
          if (index < conversation.messages.length - 1) {
            doc.strokeColor('#bdc3c7')
               .lineWidth(0.5)
               .moveTo(50, doc.y)
               .lineTo(545, doc.y)
               .stroke();
            doc.moveDown(1);
          }
        });

        // Add footer to all pages
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
          doc.switchToPage(range.start + i);
          doc.fontSize(8)
             .fillColor('#95a5a6')
             .text(
               `Page ${i + 1} of ${range.count}`,
               50,
               doc.page.height - 40,
               { align: 'center' }
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
   * Generate study guide PDF from learning materials
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
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Register Japanese font
        this._registerJapaneseFont(doc);

        // Title
        doc.fontSize(24)
           .fillColor('#2c3e50');
        this._setFont(doc, 'bold');
        doc.text(data.title || 'Japanese Study Guide', { align: 'center' });

        doc.moveDown(1);
        doc.strokeColor('#3498db')
           .lineWidth(2)
           .moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .stroke();
        doc.moveDown(1.5);

        // Level and topic
        if (data.level) {
          doc.fontSize(12)
             .fillColor('#e74c3c')
             .text(`Level: ${data.level.toUpperCase()}`, { align: 'center' });
          doc.moveDown(0.5);
        }

        if (data.topic) {
          doc.fontSize(11)
             .fillColor('#7f8c8d')
             .text(`Topic: ${data.topic}`, { align: 'center' });
          doc.moveDown(1.5);
        }

        // Content sections
        if (data.sections && Array.isArray(data.sections)) {
          data.sections.forEach((section, index) => {
            if (doc.y > 650) {
              doc.addPage();
            }

            // Section heading
            doc.fontSize(16)
               .fillColor('#3498db');
            this._setFont(doc, 'bold');
            doc.text(section.heading || `Section ${index + 1}`, { underline: true });
            doc.moveDown(0.5);

            // Section content
            doc.fontSize(11)
               .fillColor('#000000');
            this._setFont(doc, 'regular');
            doc.text(section.content, {
                 width: 495,
                 align: 'left',
                 lineGap: 2
               });

            doc.moveDown(1.5);
          });
        } else if (data.content) {
          doc.fontSize(11)
             .fillColor('#000000');
          this._setFont(doc, 'regular');
          doc.text(data.content, {
               width: 495,
               align: 'left',
               lineGap: 2
             });
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
   * @returns {Promise<Object>} - Generated document info
   */
  async generateDocumentWithLLM(prompt, level = 'beginner', format = 'pdf') {
    if (!this.ollamaService) {
      throw new Error('LLM service not available. Please configure Ollama service.');
    }

    try {
      console.log(`🤖 Generating ${format.toUpperCase()} document with LLM for: "${prompt}"`);

      // Create LLM prompt for document generation
      const systemPrompt = `You are a Japanese language expert creating educational materials. Generate a comprehensive, well-structured document based on the user's request.

Format your response as a structured document with:
- A clear title
- Organized sections with headings
- Detailed content for each section
- Examples where appropriate
- Level-appropriate language (current level: ${level})

Make the content educational, engaging, and suitable for ${level} learners.`;

      const userPrompt = `Create a Japanese learning document about: ${prompt}

Please structure the content with:
1. An introduction
2. Main content divided into logical sections
3. Practical examples
4. Key takeaways or summary

Format the content in a clear, organized manner suitable for a study guide.`;

      // Generate content using LLM
      const llmResponse = await this.ollamaService.tutorChat(userPrompt, {
        level,
        topic: prompt,
        previous_context: systemPrompt
      });

      // Parse the response to extract title and sections
      const sections = this._parseDocumentContent(llmResponse);

      // Generate the document based on format
      let filepath;
      const data = {
        title: sections.title || `Japanese Study Guide: ${prompt.substring(0, 50)}`,
        level: level,
        topic: prompt,
        sections: sections.sections,
        content: llmResponse
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
        content: llmResponse
      };

    } catch (error) {
      console.error('❌ LLM document generation error:', error);
      throw error;
    }
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
