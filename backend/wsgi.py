# backend/wsgi.py

import sys
from pathlib import Path

# Add the backend directory to the Python path
# This ensures that 'api' and the 'app' directory can be found
path_root = Path(__file__).parents[0]
sys.path.append(str(path_root))

# Import the Flask app instance from your api.py file
from api import app

# This block is for running the app locally if you ever need to
if __name__ == "__main__":
    app.run()