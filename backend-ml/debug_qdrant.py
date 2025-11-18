# backend-ml/debug_qdrant.py
import qdrant_client
from qdrant_client import QdrantClient
import sys

print("--- DIAGNÓSTICO DE QDRANT v2 ---")
print(f"1. Librería cargada desde: {qdrant_client.__file__}")

try:
    # Inicializamos en memoria
    client = QdrantClient(":memory:")
    print(f"2. Objeto cliente creado: {type(client)}")
    
    # Inspección profunda
    atributos = dir(client)
    
    # Verificaciones clave
    tiene_search = "search" in atributos
    tiene_query = "query" in atributos
    
    print(f"3. ¿Tiene método 'search'? -> {tiene_search}")
    print(f"4. ¿Tiene método 'query'?  -> {tiene_query}")
    
    if not tiene_search:
        print("\n--- LISTA DE MÉTODOS DISPONIBLES (filtrada) ---")
        # Imprimimos métodos que no empiecen por _
        public_methods = [m for m in atributos if not m.startswith("_")]
        print(public_methods)
    else:
        print("   ¡CONFIRMADO! El método 'search' existe en el cliente en memoria.")

except Exception as e:
    print(f"ERROR FATAL: {e}")