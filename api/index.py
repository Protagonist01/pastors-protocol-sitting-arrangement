import sys
import os

# Add the project's backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app
