import sqlite3
import json
import numpy as np
from app.config.settings import DATABASE_PATH


def create_faces_table():
    # Connect to the SQLite database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Create 'faces' table if it doesn't already exist
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS faces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_id INTEGER,
            embeddings TEXT,
            FOREIGN KEY (image_id) REFERENCES image_id_mapping(id) ON DELETE CASCADE
        )
    """
    )
    conn.commit()
    conn.close()


def insert_face_embeddings(image_path, embeddings):
    from app.database.images import get_id_from_path

    # Connect to database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Get image_id from the given image path
    image_id = get_id_from_path(image_path)
    if image_id is None:
        conn.close()
        raise ValueError(f"Image '{image_path}' not found in the database")

    # Convert NumPy embeddings to JSON string
    embeddings_json = json.dumps([emb.tolist() for emb in embeddings])

    # Insert or update embeddings for the image
    cursor.execute(
        """
        INSERT OR REPLACE INTO faces (image_id, embeddings)
        VALUES (?, ?)
    """,
        (image_id, embeddings_json),
    )

    conn.commit()
    conn.close()


def get_face_embeddings(image_path):
    from app.database.images import get_id_from_path

    # Connect to database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Get image_id from the path
    image_id = get_id_from_path(image_path)
    if image_id is None:
        conn.close()
        return None

    # Fetch embeddings from DB
    cursor.execute(
        """
        SELECT embeddings FROM faces
        WHERE image_id = ?
    """,
        (image_id,),
    )

    result = cursor.fetchone()
    conn.close()

    # Convert JSON back to NumPy array
    if result:
        embeddings_json = result[0]
        embeddings = np.array(json.loads(embeddings_json))
        return embeddings
    else:
        return None


def get_all_face_embeddings():
    from app.database.images import get_path_from_id

    # Connect to database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Fetch all embeddings and image_ids
    cursor.execute(
        """
        SELECT image_id, embeddings FROM faces
    """
    )

    results = cursor.fetchall()
    all_embeddings = []

    # Process each result and convert JSON back to NumPy
    for image_id, embeddings_json in results:
        image_path = get_path_from_id(image_id)
        embeddings = np.array(json.loads(embeddings_json))
        all_embeddings.append({"image_path": image_path, "embeddings": embeddings})

    print("returning")
    conn.close()
    return all_embeddings


def delete_face_embeddings(image_id):
    # Connect to database and delete embeddings for the given image_id
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM faces WHERE image_id = ?", (image_id,))

    conn.commit()
    conn.close()


def cleanup_face_embeddings():
    # Connect to database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Get all image_ids from 'faces' table
    cursor.execute("SELECT DISTINCT image_id FROM faces")
    face_image_ids = set(row[0] for row in cursor.fetchall())

    # Get valid image_ids from 'image_id_mapping'
    cursor.execute("SELECT id FROM image_id_mapping")
    valid_image_ids = set(row[0] for row in cursor.fetchall())

    # Find orphaned embeddings (not linked to any existing image)
    orphaned_ids = face_image_ids - valid_image_ids

    # Delete orphaned embeddings
    for orphaned_id in orphaned_ids:
        cursor.execute("DELETE FROM faces WHERE image_id = ?", (orphaned_id,))

    conn.commit()
    conn.close()
