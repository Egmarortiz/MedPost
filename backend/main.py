import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from backend.app.api.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)