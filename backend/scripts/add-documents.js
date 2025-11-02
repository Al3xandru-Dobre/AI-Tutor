const { ChromaClient } = require('chromadb');

async function addDirectly() {
  const client = new ChromaClient({
    path: 'http://localhost:8000'
  });

  const collection = await client.getCollection({
    name: 'japanese_tutor_knowledge'
  });

  // Add a single document
  await collection.add({
    ids: ['custom_doc_1'],
    documents: ['This is the text content of my document'],
    metadatas: [{
      title: 'My Custom Document',
      level: 'beginner',
      category: 'grammar',
      created_at: new Date().toISOString()
    }]
  });

  console.log('✅ Document added directly to ChromaDB');
}