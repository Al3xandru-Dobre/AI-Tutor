const tf = require('@tensorflow/tfjs-node');
const { AutoTokenizer } = require('@xenova/transformers');

class CustomJapaneseEmbedding {
    constructor(modelPath) {
        this.modelPath = modelPath;
        this.model = null;
        this.tokenizer = null;
    }

    async initialize() {
        this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
        this.tokenizer = await AutoTokenizer.from_pretrained('cl-tohoku/bert-base-japanese-v3');

        if (this.model === null || this.tokenizer === null) {
            throw new Error("Failed to load model or tokenizer");
        }
        console.log("✅ Model and tokenizer loaded successfully");
    }

    async embed(texts) {
        if (!Array.isArray(texts)) texts = [texts];

        const encoded = await this.tokenizer(texts, {
            padding: true,
            truncation: true,
            max_length: 512,
            return_tensors: 'tf'
        });

        const embeddings = this.model.predict([
            encoded.input_ids,
            encoded.attention_mask
        ]);

        return embeddings.arraySync();
    }
}

module.exports = CustomJapaneseEmbedding;