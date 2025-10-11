# chromaDB-development_and_AI_stuff/scripts/prepare_training_data.py
import json
import pandas as pd
from pathlib import Path

class JapaneseEmbeddingDataPrep:
    def __init__(self, conversations_path, grammar_path):
        self.conversations_path = Path(conversations_path)
        self.grammar_path = Path(grammar_path)
        
    def load_conversations(self):
        """Încarcă conversațiile și extrage perechi Q&A"""
        with open(self.conversations_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        pairs = []
        for conv_id, conv in data.items():
            messages = conv.get('messages', [])
            for i in range(0, len(messages)-1, 2):
                if messages[i]['role'] == 'user' and messages[i+1]['role'] == 'assistant':
                    pairs.append({
                        'query': messages[i]['content'],
                        'response': messages[i+1]['content'],
                        'label': 1  # positive pair
                    })
        return pairs
    
    def create_contrastive_pairs(self, pairs):
        """Creează perechi pozitive și negative pentru contrastive learning"""
        import random
        
        training_data = []
        
        # Positive pairs (query + correct response)
        for pair in pairs:
            training_data.append({
                'text1': pair['query'],
                'text2': pair['response'],
                'label': 1
            })
        
        # Negative pairs (query + random incorrect response)
        for pair in pairs:
            random_pair = random.choice(pairs)
            while random_pair == pair:
                random_pair = random.choice(pairs)
            
            training_data.append({
                'text1': pair['query'],
                'text2': random_pair['response'],
                'label': 0
            })
        
        return pd.DataFrame(training_data)
    
    def prepare_dataset(self):
        """Pipeline complet de pregătire"""
        pairs = self.load_conversations()
        df = self.create_contrastive_pairs(pairs)
        
        # Split train/validation/test
        from sklearn.model_selection import train_test_split
        
        train_df, temp_df = train_test_split(df, test_size=0.3, random_state=42)
        val_df, test_df = train_test_split(temp_df, test_size=0.5, random_state=42)
        
        return train_df, val_df, test_df

# Usage
if __name__ == "__main__":
    import os
    from pathlib import Path

    # Get project root
    project_root = Path(__file__).parent.parent.parent

    # Create output directory
    output_dir = Path(__file__).parent.parent / 'data' / 'embeddings'
    output_dir.mkdir(parents=True, exist_ok=True)

    prep = JapaneseEmbeddingDataPrep(
        project_root / 'backend' / 'data' / 'history' / 'conversations.json',
        project_root / 'backend' / 'data' / 'grammar'
    )
    train_df, val_df, test_df = prep.prepare_dataset()

    train_df.to_csv(output_dir / 'train.csv', index=False)
    val_df.to_csv(output_dir / 'val.csv', index=False)
    test_df.to_csv(output_dir / 'test.csv', index=False)

    print(f"✅ Training samples: {len(train_df)}")
    print(f"✅ Validation samples: {len(val_df)}")
    print(f"✅ Test samples: {len(test_df)}")
    print(f"📁 Data saved to: {output_dir}")