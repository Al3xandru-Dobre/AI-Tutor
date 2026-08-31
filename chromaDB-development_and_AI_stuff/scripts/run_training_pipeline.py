#!/usr/bin/env python3
"""
Complete Training Pipeline for Japanese Embeddings
This script handles:
1. Data preparation from conversations
2. Model training
3. Model export for JavaScript/Node.js
4. ChromaDB integration testing
"""

import sys
from pathlib import Path
import json

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from scripts.prepare_training_data import JapaneseEmbeddingDataPrep
from scripts.train_embedder import EmbeddingTrainer
from models.japanese_embedder import JapaneseSentenceEmbedder
import pandas as pd
import tensorflow as tf


def check_data_availability():
    """Check if conversation data exists"""
    project_root = Path(__file__).parent.parent.parent
    conversations_path = project_root / 'backend' / 'data' / 'history' / 'conversations.json'

    if not conversations_path.exists():
        print("⚠️  No conversations.json found. Creating sample data...")
        return False

    with open(conversations_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if len(data) == 0:
        print("⚠️  conversations.json is empty. Need to collect more data.")
        return False

    print(f"✅ Found {len(data)} conversations")
    return True


def step1_prepare_data():
    """Step 1: Prepare training data from conversations"""
    print("\n" + "="*60)
    print("STEP 1: Preparing Training Data")
    print("="*60)

    project_root = Path(__file__).parent.parent.parent
    output_dir = Path(__file__).parent.parent / 'data' / 'embeddings'
    output_dir.mkdir(parents=True, exist_ok=True)

    prep = JapaneseEmbeddingDataPrep(
        project_root / 'backend' / 'data' / 'history' / 'conversations.json',
        project_root / 'backend' / 'data' / 'grammar'
    )

    try:
        train_df, val_df, test_df = prep.prepare_dataset()

        train_df.to_csv(output_dir / 'train.csv', index=False)
        val_df.to_csv(output_dir / 'val.csv', index=False)
        test_df.to_csv(output_dir / 'test.csv', index=False)

        print(f"✅ Training samples: {len(train_df)}")
        print(f"✅ Validation samples: {len(val_df)}")
        print(f"✅ Test samples: {len(test_df)}")
        print(f"📁 Data saved to: {output_dir}")

        return True
    except Exception as e:
        print(f"❌ Error preparing data: {e}")
        return False


def step2_train_model():
    """Step 2: Train the embedding model"""
    print("\n" + "="*60)
    print("STEP 2: Training Japanese Embedding Model")
    print("="*60)

    data_dir = Path(__file__).parent.parent / 'data' / 'embeddings'
    model_dir = Path(__file__).parent.parent / 'models' / 'checkpoints'
    model_dir.mkdir(parents=True, exist_ok=True)

    # Load data
    try:
        train_df = pd.read_csv(data_dir / 'train.csv')
        val_df = pd.read_csv(data_dir / 'val.csv')

        print(f"📊 Loaded {len(train_df)} training samples")
        print(f"📊 Loaded {len(val_df)} validation samples")
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return False

    # Initialize model
    try:
        model = JapaneseSentenceEmbedder(
            base_model_name='cl-tohoku/bert-base-japanese-v3',
            embedding_dim=384,  # Compatible with ChromaDB
            hidden_dim=512
        )
        print("✅ Model initialized")
    except Exception as e:
        print(f"❌ Error initializing model: {e}")
        return False

    # Train
    try:
        trainer = EmbeddingTrainer(model, learning_rate=2e-5)
        trainer.train(train_df, val_df, epochs=10, batch_size=16)

        print("🎉 Training complete!")
        print(f"✅ Model saved to: {model_dir / 'best_embedder.h5'}")
        return True
    except Exception as e:
        print(f"❌ Error during training: {e}")
        return False


def step3_export_model():
    """Step 3: Export model for JavaScript"""
    print("\n" + "="*60)
    print("STEP 3: Exporting Model for JavaScript/Node.js")
    print("="*60)

    model_dir = Path(__file__).parent.parent / 'models'
    output_dir = model_dir / 'japanese_embedder'
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Load the trained model
        checkpoint_path = model_dir / 'checkpoints' / 'best_embedder.h5'

        if not checkpoint_path.exists():
            print(f"❌ Model checkpoint not found at {checkpoint_path}")
            return False

        model = JapaneseSentenceEmbedder(
            base_model_name='cl-tohoku/bert-base-japanese-v3',
            embedding_dim=384,
            hidden_dim=512
        )
        model.load_weights(str(checkpoint_path))

        # Save in TensorFlow.js format
        tf.saved_model.save(model, str(output_dir))

        print(f"✅ Model exported to: {output_dir}")

        # Create model.json for tfjs-node
        import tensorflowjs as tfjs
        tfjs.converters.save_keras_model(model, str(output_dir))

        print("✅ Model converted to TensorFlow.js format")
        return True
    except Exception as e:
        print(f"❌ Error exporting model: {e}")
        print("💡 You may need to install tensorflowjs: pip install tensorflowjs")
        return False


def step4_test_integration():
    """Step 4: Test ChromaDB integration"""
    print("\n" + "="*60)
    print("STEP 4: Testing ChromaDB Integration")
    print("="*60)

    print("📝 Integration test should be run from Node.js")
    print("💡 Run: node backend/scripts/test-chromadb.js")

    return True


def main():
    """Main training pipeline"""
    print("""
╔══════════════════════════════════════════════════════════╗
║   Japanese AI Tutor - Embedding Training Pipeline       ║
╚══════════════════════════════════════════════════════════╝
""")

    # Check if we have data
    if not check_data_availability():
        print("\n⚠️  Warning: Need conversation data to train effectively")
        print("💡 You can still proceed with sample data, but results will be limited")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            print("Exiting...")
            return

    # Run pipeline
    steps = [
        ("Prepare Data", step1_prepare_data),
        ("Train Model", step2_train_model),
        ("Export Model", step3_export_model),
        ("Test Integration", step4_test_integration),
    ]

    for step_name, step_func in steps:
        if not step_func():
            print(f"\n❌ Pipeline failed at: {step_name}")
            print("💡 Fix the errors above and try again")
            return

    print("\n" + "="*60)
    print("🎉 TRAINING PIPELINE COMPLETE!")
    print("="*60)
    print("\nNext steps:")
    print("1. Start ChromaDB: docker-compose up -d chromadb")
    print("2. Test integration: node backend/scripts/test-chromadb.js")
    print("3. Restart your backend to use the new embeddings")


if __name__ == "__main__":
    main()
