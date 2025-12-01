import numpy as np
import os

# --- Configuration ---
# Define the directory containing the batched embedding files.
# Ensure this path is correct relative to where you execute the script.
OUTPUTS_DIR = "data/outputs"
EXPECTED_DIMENSION = 1024  # BGE-M3 model output dimension

def verify_embeddings():
    """
    Iterates through all .npy files in the output directory and validates
    that their vector dimensions match the expected configuration for Qdrant.
    """
    print(f"--- Starting Vector Verification in: {OUTPUTS_DIR} ---")

    # 1. Validate directory existence
    if not os.path.exists(OUTPUTS_DIR):
        print(f"Error: Directory '{OUTPUTS_DIR}' does not exist.")
        return

    # 2. List all numpy files
    files = [f for f in os.listdir(OUTPUTS_DIR) if f.endswith('.npy')]
    
    if not files:
        print("No .npy files found to check.")
        return

    corrupt_count = 0

    # 3. Process each file
    for filename in files:
        file_path = os.path.join(OUTPUTS_DIR, filename)
        
        try:
            # Load the numpy array from disk
            data = np.load(file_path)
            
            # 4. Dimension Check
            # The shape is typically (batch_size, vector_dimension).
            # We strictly need the second dimension to be 1024.
            if len(data.shape) > 1:
                actual_dim = data.shape[1]
                
                if actual_dim != EXPECTED_DIMENSION:
                    print(f"❌ INVALID DIMENSION: {filename}")
                    print(f"   -> Found: {actual_dim}, Expected: {EXPECTED_DIMENSION}")
                    corrupt_count += 1
                else:
                    # Optional: Uncomment for verbose output on success
                    # print(f"✅ {filename}: OK")
                    pass
            else:
                print(f"⚠️ WARNING: {filename} has unexpected shape format: {data.shape}")
                
        except Exception as e:
            print(f"❌ CRITICAL ERROR reading {filename}: {e}")
            corrupt_count += 1

    # 5. Final Summary
    print("\n" + "="*30)
    print("VERIFICATION SUMMARY")
    print("="*30)
    
    if corrupt_count == 0:
        print("✅ SUCCESS: All files have the correct dimension (1024).")
        print("You can safely proceed with the Qdrant upload.")
    else:
        print(f"🚨 FAILURE: Found {corrupt_count} corrupted or mismatched files.")
        print("ACTION REQUIRED: Delete the invalid files in 'data/outputs' before running the loader.")

if __name__ == "__main__":
    verify_embeddings()