from fastapi import FastAPI

app = FastAPI(title= "Backend ML Service")

@app.get("/status", tags=["Health Check"])
def get_status():
    """Confirms that the service is working"""
    return {"status": "OK", "service": "backend-ml"}