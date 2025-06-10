# backend/api.py

import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# This is a crucial step to ensure the script can find your calculation modules.
# It adds the 'backend/app' directory to Python's path.
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Now you can import your calculator
from calculations.area_volume import AreaVolumeCalculator
from calculations.flashover import FlashoverCalculator # <-- ADD THIS LINE
from utils.unit_converter import UnitConverter

# --- Flask App Setup ---
app = Flask(__name__)
# Allow requests from your frontend (we'll specify the real URL later)
CORS(app) 

# --- API Endpoints ---

# Create an endpoint for the rectangular compartment calculation
# This function will be triggered by visiting http://127.0.0.1:5000/api/rectangular_area_volume
@app.route('/api/rectangular_area_volume', methods=['POST'])
def rectangular_area_volume():
    # Get the data (length, width, height) sent from the frontend
    data = request.json
    try:
        # Call your existing calculator class
        result = AreaVolumeCalculator.rectangular_compartment(
            length=float(data['length']),
            width=float(data['width']),
            height=float(data['height']),
            units=data.get('units', 'SI') # Use 'SI' as a default
        )
        # Send the successful result back to the frontend in JSON format
        return jsonify(result)
    except (ValueError, KeyError) as e:
        # If something goes wrong (e.g., missing data), send an error message
        return jsonify({"error": str(e)}), 400
    
    # --- ADD THIS ENTIRE NEW ENDPOINT ---
# backend/api.py

@app.route('/api/flashover', methods=['POST'])
def flashover():
    data = request.json
    try:
        # --- Get all data from the frontend ---
        room_length_in = float(data['roomLength'])
        room_width_in = float(data['roomWidth'])
        room_height_in = float(data['roomHeight'])
        opening_width_in = float(data['openingWidth'])
        opening_height_in = float(data['openingHeight'])
        surface_material = data['surfaceMaterial']
        units = data.get('units', 'SI')

        # --- THIS IS THE NEW, CRUCIAL PART ---
        # Convert all incoming dimensions to SI (meters) before any calculations
        if units.lower() == 'imperial':
            room_length = UnitConverter.length_converter(room_length_in, 'ft', 'm')
            room_width = UnitConverter.length_converter(room_width_in, 'ft', 'm')
            room_height = UnitConverter.length_converter(room_height_in, 'ft', 'm')
            opening_width = UnitConverter.length_converter(opening_width_in, 'ft', 'm')
            opening_height = UnitConverter.length_converter(opening_height_in, 'ft', 'm')
        else:
            room_length = room_length_in
            room_width = room_width_in
            room_height = room_height_in
            opening_width = opening_width_in
            opening_height = opening_height_in
        
        # --- Now calculate areas using ONLY SI units ---
        At = 2 * (room_length * room_width + room_length * room_height + room_width * room_height)
        A0 = opening_width * opening_height
        H0 = opening_height

        # --- Call the simplified calculation methods (they only speak SI) ---
        q_mqh = FlashoverCalculator.mccaffrey_correlation(At, A0, H0, surface_material)
        q_babrauskas = FlashoverCalculator.babrauskas_correlation(A0, H0)
        q_thomas = FlashoverCalculator.thomas_correlation(At, A0, H0)

        results_si = { "mqh": q_mqh, "thomas": q_thomas, "babrauskas": q_babrauskas }

        # --- Convert the FINAL result back to imperial if needed ---
        if units.lower() == 'imperial':
            final_results = {
                "mqh": UnitConverter.heat_release_converter(results_si["mqh"], 'kW', 'BTU/s'),
                "thomas": UnitConverter.heat_release_converter(results_si["thomas"], 'kW', 'BTU/s'),
                "babrauskas": UnitConverter.heat_release_converter(results_si["babrauskas"], 'kW', 'BTU/s')
            }
            return jsonify(final_results)
        
        return jsonify(results_si)

    except Exception as e:
        # A general exception handler is good practice
        return jsonify({"error": str(e)}), 400

# --- Main entry point to run the server ---
if __name__ == '__main__':
    # Runs the Flask app on a local development server
    # The debug=True flag allows the server to auto-reload when you save changes
    app.run(debug=True, port=5000)