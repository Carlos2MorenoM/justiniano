
import os
import pytest

# Set dummy environment variables BEFORE modules are imported
# This prevents Groq/Qdrant clients from failing during instantiation at module level
os.environ["GROQ_API_KEY"] = "gsk_dummy_key_for_testing_only"
os.environ["QDRANT_HOST"] = "localhost"
os.environ["QDRANT_API_KEY"] = "dummy_qdrant_key"
