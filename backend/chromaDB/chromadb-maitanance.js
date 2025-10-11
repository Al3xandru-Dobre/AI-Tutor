// backend/chromaDB/chromadb-maintenance.js
const { ChromaClient } = require('chromadb');
const fs = require('fs').promises;
const path = require('path');

class ChromaDBMaintenance {
    constructor(client, collectionName) {
        this.client = client;
        this.collectionName = collectionName;
    }

    async healthCheck() {
        try {
            const heartbeat = await this.client.heartbeat();
            const version = await this.client.version();

            console.log('✅ ChromaDB Health Check:');
            console.log(`   Heartbeat: ${heartbeat}`);
            console.log(`   Version: ${version}`);

            return { healthy: true, heartbeat, version };
        } catch (error) {
            console.error('❌ Health check failed:', error);
            return { healthy: false, error: error.message };
        }
    }

    async backupCollection() {
        /**
         * Backup collection data
         */
        try {
            const collection = await this.client.getCollection({ name: this.collectionName });
            const allData = await collection.get();

            const backup = {
                timestamp: new Date().toISOString(),
                collection_name: this.collectionName,
                count: allData.ids.length,
                data: {
                    ids: allData.ids,
                    documents: allData.documents,
                    metadatas: allData.metadatas,
                    embeddings: allData.embeddings
                }
            };

            // Create backups directory if it doesn't exist
            const backupDir = path.join(__dirname, 'backups');
            await fs.mkdir(backupDir, { recursive: true });

            const backupPath = path.join(backupDir, `chroma_${this.collectionName}_${Date.now()}.json`);
            await fs.writeFile(
                backupPath,
                JSON.stringify(backup, null, 2)
            );

            console.log(`✅ Backup created: ${backup.count} documents`);
            console.log(`📁 Saved to: ${backupPath}`);
            return backup;
        } catch (error) {
            console.error('❌ Backup failed:', error);
            throw error;
        }
    }

    async analyzePerformance() {
        /**
         * Analyze query performance
         */
        const testQueries = [
            'particles wa ga',
            'verb conjugation',
            'counting system',
            'keigo honorifics'
        ];

        try {
            const collection = await this.client.getCollection({ name: this.collectionName });
            const results = [];

            console.log('🔍 Running performance analysis...\n');

            for (const query of testQueries) {
                const start = Date.now();

                await collection.query({
                    queryTexts: [query],
                    nResults: 5
                });

                const duration = Date.now() - start;
                results.push({ query, duration });

                console.log(`Query "${query}": ${duration}ms`);
            }

            const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
            console.log(`\n📊 Average query time: ${avgDuration.toFixed(2)}ms`);

            return { results, avgDuration };
        } catch (error) {
            console.error('❌ Performance analysis failed:', error);
            throw error;
        }
    }

    async getCollectionInfo() {
        /**
         * Get detailed collection information
         */
        try {
            const collection = await this.client.getCollection({ name: this.collectionName });
            const count = await collection.count();

            console.log('📊 Collection Information:');
            console.log(`   Name: ${this.collectionName}`);
            console.log(`   Total documents: ${count}`);

            return { name: this.collectionName, count };
        } catch (error) {
            console.error('❌ Failed to get collection info:', error);
            throw error;
        }
    }

    async resetCollection() {
        /**
         * Reset collection (DANGEROUS: deletes all data)
         */
        try {
            console.log('⚠️  WARNING: This will delete all data in the collection!');

            // Delete collection
            await this.client.deleteCollection({ name: this.collectionName });
            console.log('✅ Collection deleted');

            // Recreate collection
            await this.client.createCollection({ name: this.collectionName });
            console.log('✅ Collection recreated');

            return true;
        } catch (error) {
            console.error('❌ Reset failed:', error);
            throw error;
        }
    }
}

// CLI usage
async function main() {
    const command = process.argv[2];

    const client = new ChromaClient({
        path: process.env.CHROMA_DB_URL || 'http://localhost:8000'
    });

    const maintenance = new ChromaDBMaintenance(client, 'japanese_tutor_knowledge');

    try {
        switch (command) {
            case 'health':
                await maintenance.healthCheck();
                break;

            case 'backup':
                await maintenance.backupCollection();
                break;

            case 'analyze':
                await maintenance.analyzePerformance();
                break;

            case 'info':
                await maintenance.getCollectionInfo();
                break;

            case 'reset':
                console.log('⚠️  Are you sure you want to reset the collection?');
                console.log('This will delete all data. Press Ctrl+C to cancel.');
                await new Promise(resolve => setTimeout(resolve, 5000));
                await maintenance.resetCollection();
                break;

            default:
                console.log('ChromaDB Maintenance Tool');
                console.log('\nUsage: node chromadb-maintenance.js <command>');
                console.log('\nCommands:');
                console.log('  health   - Check ChromaDB health');
                console.log('  backup   - Backup collection data');
                console.log('  analyze  - Analyze query performance');
                console.log('  info     - Show collection information');
                console.log('  reset    - Reset collection (DANGEROUS)');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = ChromaDBMaintenance;