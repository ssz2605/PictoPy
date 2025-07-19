import os
from app.config.settings import DATABASE_PATH
from app.database.faces import get_all_face_embeddings
from app.facecluster.facecluster import FaceCluster

# Global instance to store the face cluster model
face_cluster = None


def init_face_cluster(db_path=DATABASE_PATH):
    """
    Initializes the FaceCluster instance.
    Loads from DB if already saved, otherwise creates a new one and fits embeddings.
    """
    global face_cluster
    if face_cluster is not None:
        # Return existing instance if already initialized
        return face_cluster

    if os.path.exists(db_path):
        # Load existing clustering model from database
        print("Loading existing face clusters from database...", flush=True)
        face_cluster = FaceCluster.load_from_db(db_path)
    else:
        # If DB doesn't exist, create a new cluster
        print("Creating new face clusters database...")
        face_cluster = FaceCluster(db_path=db_path)

        # Fetch all face embeddings from the database
        all_embeddings = get_all_face_embeddings()
        if all_embeddings:
            # Extract embeddings and their corresponding image paths
            embeddings = [e["embeddings"][0] for e in all_embeddings]
            image_paths = [e["image_path"] for e in all_embeddings]
            face_cluster.fit(embeddings, image_paths)
        else:
            print("No face embeddings found. Creating empty clusters.", flush=True)
            face_cluster.fit([], [])

        # Save the initialized model to DB
        face_cluster.save_to_db()

    return face_cluster


def get_face_cluster():
    """
    Returns the initialized FaceCluster instance.
    If not already initialized, calls `init_face_cluster()`.
    """
    global face_cluster
    if face_cluster is None:
        face_cluster = init_face_cluster()
    return face_cluster
