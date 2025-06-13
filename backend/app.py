import sys
import os

# This line adds the 'app' directory to Python's path
# so it can find all your calculation and utility files.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

# Now, import the Flask app instance from our main application file
from main import app

# This block is for running the app locally
if __name__ == '__main__':
    app.run(debug=True)