# pyright: reportAttributeAccessIssue=false
import tensorflow as tf
from transformers import TFAutoModel, AutoTokenizer
import numpy as np

tfk = tf.keras

class JapaneseSentenceEmbedder(tfk.Model):
     def __init__(self, base_model_name='cl-tohoku/bert-base-japanese-v3', 
                 embedding_dim=768, hidden_dim=512, dropout_rate=0.1):
        super().__init__()

        self.encoder = TFAutoModel.from_pretrained(base_model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(base_model_name)

        
        self.projection = tfk.Sequential([
            tfk.layers.Dense(hidden_dim, activation='relu'),
            tfk.layers.Dropout(dropout_rate),
            tfk.layers.Dense(embedding_dim),
            tfk.layers.LayerNormalization()
        ])

        #For fine tunning purposes
        self.encoder.trainable = False

     def mean_pooling(self, token_embbedings, attention_mask):
          input_mask_expanded = tf.cast(
                  tf.expand_dims(attention_mask, -1),
                  token_embbedings.dtype
              )   
          sum_embbedings = tf.reduce_sum(token_embbedings * input_mask_expanded,axis=1)
          sum_mask = tf.maximum(tf.reduce_sum(input_mask_expanded,axis=1),1e-9)

          return sum_embbedings / sum_mask
     

     def call(self, input_ids, attention_mask, training=False):

          outputs = self.encoder(input_ids=input_ids,
                                 attention_mask=attention_mask,
                                 training=training
                                 )

          # Mean Pooling
          token_embeddings = outputs.last_hidden_state
          sentence_embeddings = self.mean_pooling(token_embeddings, attention_mask)

          # Projection
          projected = self.projection(sentence_embeddings, training=training)

          # L2 normalization for cosine similarity
          normalized = tf.nn.l2_normalize(projected, axis=1)

          return normalized

     def encode(self, texts, batch_size=32):

          if isinstance(texts, str):
               texts = [texts]

          all_embeddings = []

          for i in range(0, len(texts), batch_size):
               batch_texts = texts[i:i+batch_size]

               # Tokenization
               encoded = self.tokenizer(
                    batch_texts,
                    padding=True,
                    truncation=True,
                    max_length=512,
                    return_tensors='tf'
               )

               embeddings = self(
                    input_ids=encoded['input_ids'],
                    attention_mask=encoded['attention_mask'],
                    training=False
               )

               all_embeddings.append(embeddings.numpy())

          return np.vstack(all_embeddings)

     def unfreeze_encoder(self, num_layers=4):
          self.encoder.trainable = True

          for layer in self.encoder.encoder.layer[:-num_layers]:
               layer.trainable = False

class ContrastiveLoss(tf.keras.losses.Loss):
    """Loss pentru contrastive learning (similar cu Sentence-BERT)"""
    def __init__(self, temperature=0.05):
        super().__init__()
        self.temperature = temperature
        self.cosine_sim = tfk.losses.CosineSimilarity(axis=1)
    
    def call(self, embeddings1, embeddings2, labels):
        # Cosine similarity
        similarity = 1 - self.cosine_sim(embeddings1, embeddings2)
        
        # Contrastive loss
        positive_loss = labels * tf.square(1 - similarity)
        negative_loss = (1 - labels) * tf.square(tf.maximum(similarity, 0))
        
        loss = positive_loss + negative_loss
        return tf.reduce_mean(loss)        


