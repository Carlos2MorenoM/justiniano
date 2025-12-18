import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models
from tqdm import tqdm

# --- CONFIGURACIÓN DE RUTAS ---
current_script_path = Path(__file__).resolve()
root_dir = current_script_path.parent.parent.parent
env_path = root_dir / '.env'

print(f"📂 Loading environment from: {env_path}")
load_dotenv(dotenv_path=env_path)

# Configure logger
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# --- CONFIGURACIÓN ---
LOCAL_QDRANT_URL = "http://localhost:6333"
CLOUD_QDRANT_URL = os.getenv("QDRANT_HOST")
CLOUD_QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "boe_legal_docs"


def migrate_vectors():
    print("🚀 Starting Vector Migration: Local -> Cloud")

    # 1. Credentials Check
    if not CLOUD_QDRANT_URL or not CLOUD_QDRANT_API_KEY:
        logger.error("Missing Cloud credentials. Check your .env file.")
        return

    # 2. Connect Clients
    client_local = QdrantClient(url=LOCAL_QDRANT_URL)
    client_cloud = QdrantClient(url=CLOUD_QDRANT_URL, api_key=CLOUD_QDRANT_API_KEY)

    # 3. Validation & Schema Replication
    try:
        collection_info = client_local.get_collection(COLLECTION_NAME)
        local_count = collection_info.points_count
        vector_params = collection_info.config.params.vectors
        
        print(f"✅ Connected to Local. Found {local_count} vectors.")

        if not client_cloud.collection_exists(COLLECTION_NAME):
            print(f"☁️  Creating collection '{COLLECTION_NAME}' in Cloud...")
            client_cloud.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=vector_params.size,
                    distance=vector_params.distance
                )
            )
            print("✅ Collection created.")
        else:
            print(f"ℹ️  Collection '{COLLECTION_NAME}' already exists. Appending data...")

    except Exception as e:
        logger.error(f"Initialization error: {e}")
        return

    # 4. Migration Loop
    print("📦 Migrating data...")
    
    scroll_offset = None
    total_migrated = 0
    batch_size = 100 
    
    pbar = tqdm(total=local_count, unit="vectors")

    while True:
        try:
            # A. Fetch 'Record' objects from Local
            records, next_offset = client_local.scroll(
                collection_name=COLLECTION_NAME,
                offset=scroll_offset,
                limit=batch_size,
                with_payload=True,
                with_vectors=True
            )

            if not records:
                break

            # Transform 'Record' objects to 'PointStruct'
            points_to_upsert = [
                models.PointStruct(
                    id=point.id,
                    vector=point.vector,
                    payload=point.payload
                ) for point in records
            ]

            # B. Upload 'PointStruct' objects to Cloud
            client_cloud.upsert(
                collection_name=COLLECTION_NAME,
                points=points_to_upsert
            )

            # Update progress
            batch_len = len(records)
            total_migrated += batch_len
            pbar.update(batch_len)

            # Advance the cursor
            scroll_offset = next_offset
            
            # Si next_offset es None, hemos terminado
            if next_offset is None:
                break

        except Exception as e:
            logger.error(f"Error migrating batch: {e}")
            break

    pbar.close()
    print(f"\n✨ Migration Complete! Transferred {total_migrated}/{local_count} vectors.")


if __name__ == "__main__":
    migrate_vectors()