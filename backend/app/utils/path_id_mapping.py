import sqlite3
import os
from app.config.settings import DATABASE_PATH


def get_path_from_id(image_id):
    """
    Retrieve the image path from the image_id_mapping table using image ID.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT path FROM image_id_mapping WHERE id = ?", (image_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None


def get_id_from_path(path):
    """
    Retrieve the image ID from the image_id_mapping table using absolute image path.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    abs_path = os.path.abspath(path)  # Ensure path matches stored format
    cursor.execute("SELECT id FROM image_id_mapping WHERE path = ?", (abs_path,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None
