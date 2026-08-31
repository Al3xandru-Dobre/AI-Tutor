const tf = require('@tensorflow/tfjs-node');
const { env, pipeline } = require('@xenova/transformers');
const path = require('path');

// Note: Global transformer configuration is set in backend/config/transformers.config.js
// Configure Hugging Face authentication if provided
if (process.env.HUGGING_FACE_HUB_TOKEN) {
  env.accessToken = process.env.HUGGING_FACE_HUB_TOKEN;
}
class CustomJapaneseEmbedding {
    constructor() {
        // Numele modelului de pe Hugging Face. Acesta este singurul lucru de care avem nevoie.
        // Folosim un model multilingv optimizat pentru Transformers.js (format ONNX)
        // Opțiuni compatibile:
        // - 'Xenova/paraphrase-multilingual-mpnet-base-v2' (implicit)
        // - 'Xenova/multilingual-e5-base' (mai nou, performanță îmbunătățită)
        // - 'Xenova/multilingual-e5-large' (cel mai performant, dar mai lent)
        this.modelName = 'Xenova/multilingual-e5-base';

        // `this.pipeline` va stoca funcția de nivel înalt care se ocupă de tot.
        // `this.model` și `this.tokenizer` nu mai sunt necesare.
        this.pipeline = null;
    }

    /**
     * Încarcă modelul și tokenizer-ul într-un singur pipeline funcțional.
     * La prima rulare, descarcă modelul; ulterior, îl încarcă din cache-ul local.
     */
    async initialize() {
        console.log(`🔄 Se inițializează serviciul de embedding pentru limba japoneză...`);
        
        try {
            console.log(`Se încarcă pipeline-ul pentru "${this.modelName}" (model + tokenizer)...`);

            // Acesta este singurul apel necesar. El pregătește totul.
            this.pipeline = await pipeline('feature-extraction', this.modelName, {
                progress_callback: (progress) => {
                    if (progress.status === 'downloading') {
                        console.log(`Se descarcă ${progress.file}: ${Math.round(progress.progress)}%`);
                    }
                }
            });

            console.log("✅ Serviciul de embedding pentru limba japoneză a fost inițializat cu succes!");

        } catch (error) {
            console.error('❌ A eșuat inițializarea serviciului de embedding:', error.message);
            throw error;
        }
        
    }

    /**
     * Generează embedding-uri pentru unul sau mai multe texte.
     * @param {string|string[]} texts - Un text sau un array de texte.
     * @returns {Promise<number[][]>} Un array de vectori de embedding.
     */
    async embed(texts) {
        if (!this.pipeline) {
            throw new Error("Serviciul nu este initializat. Apelează initialize() înainte de a genera embedding-uri.");
        }

        // Asigurăm că `texts` este un array pentru a gestiona uniform cazurile.
        const textsArray = Array.isArray(texts) ? texts : [texts];

        try {
            // Apelăm direct pipeline-ul cu textul brut.
            // El se ocupă intern de tokenizare, padding, trunchiere și predicție.
            const embeddingsTensor = await this.pipeline(textsArray, {
                pooling: 'mean',    // Creează un singur vector per text (media embedding-urilor token-urilor).
                normalize: true     // Normalizează vectorul, util pentru similaritate cosinus.
            });

            // Convertim tensorul rezultat într-un array JavaScript standard.
            return embeddingsTensor.tolist();

        } catch (error) {
            console.error('❌ A eșuat generarea embedding-urilor:', error.message);
            throw error;
        }
    }
}

module.exports = CustomJapaneseEmbedding;