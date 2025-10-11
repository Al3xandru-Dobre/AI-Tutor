const EnhancedRAGService = require('../services/enhancedRAGService');
const { ChromaClient } = require('chromadb');

async function addCustomData() {
  const ragService = new EnhancedRAGService({
    chromaPath: 'http://localhost:8000',
    useChromaDB: true
  });

   await ragService.initialize();
  const documents = [
    {
      title: 'Japanese Days of the Week',
      content: `月曜日 (getsuyoubi) - Monday
火曜日 (kayoubi) - Tuesday
水曜日 (suiyoubi) - Wednesday
木曜日 (mokuyoubi) - Thursday
金曜日 (kinyoubi) - Friday
土曜日 (doyoubi) - Saturday
日曜日 (nichiyoubi) - Sunday`,
      metadata: { level: 'beginner', category: 'vocabulary', tags: ['days', 'time', 'calendar'] }
    },
    {
      title: 'Japanese Months',
      content: `一月 (ichigatsu) - January
二月 (nigatsu) - February
三月 (sangatsu) - March
四月 (shigatsu) - April
五月 (gogatsu) - May
六月 (rokugatsu) - June
七月 (shichigatsu) - July
八月 (hachigatsu) - August
九月 (kugatsu) - September
十月 (juugatsu) - October
十一月 (juuichigatsu) - November
十二月 (juunigatsu) - December`,
      metadata: { level: 'beginner', category: 'vocabulary', tags: ['months', 'time', 'calendar'] }
    }
  ];

  for (const doc of documents) {
    const docId = await ragService.addDocument(doc.title, doc.content, doc.metadata);
    console.log(`✅ Added: ${doc.title} (ID: ${docId})`);
  }

  console.log('🎉 All documents added!');
}

addCustomData().catch(console.error);