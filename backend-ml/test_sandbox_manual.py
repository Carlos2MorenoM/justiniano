import uuid
from rag_agent.sandbox import DockerSandbox

def test_infrastructure():
    print(">>> Initializing Sandbox...")
    try:
        # NOTE: volume_name must match what's in your docker-compose
        sandbox = DockerSandbox(volume_name="justiniano_shared_data")
        
        # Simple Python code to test logic and file writing
        code_to_run = """
import sys

print('Hello from inside the isolated container!')
print('I am going to calculate something...')
result = 20 + 22
print(f'The result is {result}')

# Verify I can write files
with open('output.txt', 'w') as f:
    f.write('Filesystem write confirmed.')
"""
        
        run_id = str(uuid.uuid4())[:8]
        print(f">>> Running code with ID: {run_id}")
        
        stdout, stderr, success = sandbox.run_code(code_to_run, run_id)
        
        print("-" * 30)
        print(f"Success: {success}")
        print("STDOUT output from container:")
        print(stdout)
        if stderr:
            print("STDERR:")
            print(stderr)
        print("-" * 30)

        # Check if the file was actually written to our shared volume
        expected_file = f"/app/shared_data/{run_id}/output.txt"
        import os
        if os.path.exists(expected_file):
            print(f"✅ File persistence verified: {expected_file} exists.")
            with open(expected_file, 'r') as f:
                print(f"   Content: {f.read()}")
        else:
            print(f"❌ File persistence failed: {expected_file} not found.")

    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")

if __name__ == "__main__":
    test_infrastructure()