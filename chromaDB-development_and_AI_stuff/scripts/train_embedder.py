# scripts/train_embedder.py
# pyright: reportAttributeAccessIssue=false
import tensorflow as tf
from models.japanese_embedder import JapaneseSentenceEmbedder, ContrastiveLoss
import pandas as pd
from tqdm import tqdm
#import wandb  # optional: pentru tracking

class EmbeddingTrainer:
    def __init__(self, model, learning_rate=2e-5):
        self.model = model
        self.loss_fn = ContrastiveLoss(temperature=0.05)
        self.optimizer = tf.keras.optimizers.Adam(learning_rate) 
        
        # Metrics
        self.train_loss_tracker = tf.keras.metrics.Mean()
        self.val_loss_tracker = tf.keras.metrics.Mean()
        
    def create_dataset(self, df, batch_size=16):
        """Creează TensorFlow dataset din DataFrame"""
        def generator():
            for _, row in df.iterrows():
                yield (row['text1'], row['text2'], row['label'])
        
        dataset = tf.data.Dataset.from_generator(
            generator,
            output_signature=(
                tf.TensorSpec(shape=(), dtype=tf.string), #type: ignore
                tf.TensorSpec(shape=(), dtype=tf.string), #type: ignore
                tf.TensorSpec(shape=(), dtype=tf.float32) #type: ignore
            )
        )
        
        return dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)
    
    @tf.function
    def train_step(self, text1_batch, text2_batch, labels):
        """Training step cu gradient tape"""
        # Tokenize
        tokens1 = self.model.tokenizer(
            text1_batch.numpy().decode('utf-8') if isinstance(text1_batch, bytes) else list(text1_batch.numpy()),
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors='tf'
        )
        
        tokens2 = self.model.tokenizer(
            text2_batch.numpy().decode('utf-8') if isinstance(text2_batch, bytes) else list(text2_batch.numpy()),
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors='tf'
        )
        
        with tf.GradientTape() as tape:
            # Forward pass
            embeddings1 = self.model(
                input_ids=tokens1['input_ids'],
                attention_mask=tokens1['attention_mask'],
                training=True
            )
            
            embeddings2 = self.model(
                input_ids=tokens2['input_ids'],
                attention_mask=tokens2['attention_mask'],
                training=True
            )
            
            # Compute loss
            loss = self.loss_fn(embeddings1, embeddings2, labels)
        
        # Backward pass
        gradients = tape.gradient(loss, self.model.trainable_variables)
        if gradients is not None:
            self.optimizer.apply_gradients(zip(gradients, self.model.trainable_variables))
        
        self.train_loss_tracker.update_state(loss)
        return loss
    
    def train(self, train_df, val_df, epochs=10, batch_size=16):
        """Training loop complet"""
        train_dataset = self.create_dataset(train_df, batch_size)
        val_dataset = self.create_dataset(val_df, batch_size)
        
        best_val_loss = float('inf')
        
        for epoch in range(epochs):
            print(f"\nEpoch {epoch+1}/{epochs}")
            
            # Training
            self.train_loss_tracker.reset_states()
            for batch in tqdm(train_dataset, desc="Training"):
                text1, text2, labels = batch
                self.train_step(text1, text2, labels)
            
            train_loss = self.train_loss_tracker.result()
            
            # Validation
            self.val_loss_tracker.reset_states()
            for batch in tqdm(val_dataset, desc="Validation"):
                text1, text2, labels = batch
                # Similar la train_step dar fără gradient tape
                # ... implementare validare
            
            val_loss = self.val_loss_tracker.result()
            
            print(f"Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")
            
            # Save best model
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                self.model.save_weights('models/checkpoints/best_embedder.h5')
                print("✅ Saved best model!")
            
            # Unfreeze encoder după primele 3 epoci
            if epoch == 2:
                print("🔓 Unfreezing encoder layers...")
                self.model.unfreeze_encoder(num_layers=4)

# Usage
if __name__ == "__main__":
    import sys
    from pathlib import Path

    # Add parent directory to path
    sys.path.append(str(Path(__file__).parent.parent))

    # Data paths
    data_dir = Path(__file__).parent.parent / 'data' / 'embeddings'
    model_dir = Path(__file__).parent.parent / 'models' / 'checkpoints'
    model_dir.mkdir(parents=True, exist_ok=True)

    # Load data
    train_df = pd.read_csv(data_dir / 'train.csv')
    val_df = pd.read_csv(data_dir / 'val.csv')

    print(f"📊 Loaded {len(train_df)} training samples")
    print(f"📊 Loaded {len(val_df)} validation samples")

    # Initialize model
    model = JapaneseSentenceEmbedder(
        base_model_name='cl-tohoku/bert-base-japanese-v3',
        embedding_dim=384,  # compatible with ChromaDB
        hidden_dim=512
    )

    # Train
    trainer = EmbeddingTrainer(model, learning_rate=2e-5)
    trainer.train(train_df, val_df, epochs=10, batch_size=16)

    print("🎉 Training complete!")
    print(f"✅ Model saved to: {model_dir / 'best_embedder.h5'}")