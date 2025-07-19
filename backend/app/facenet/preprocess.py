import cv2
import numpy as np


def preprocess_image(image):
    """
    Resize, normalize, and format the image for embedding extraction.
    - Resize to 160x160
    - Convert BGR to RGB
    - Change shape to (1, 3, 160, 160)
    - Normalize pixel values to [-1, 1]
    """
    image = cv2.resize(image, (160, 160))
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = image.transpose((2, 0, 1))  # Channel first
    image = np.expand_dims(image, axis=0)  # Add batch dimension
    image = image.astype(np.float32)
    image = (image - 127.5) / 128.0  # Normalize
    return image


def normalize_embedding(embedding):
    """
    Normalize the embedding vector to unit length.
    """
    return embedding / np.linalg.norm(embedding)


def cosine_similarity(embedding1, embedding2):
    """
    Compute cosine similarity between two embedding vectors.
    """
    return np.dot(embedding1, embedding2) / (
        np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
    )
