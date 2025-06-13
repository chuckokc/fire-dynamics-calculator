# backend/api.py

from flask import Flask, request, jsonify
from flask_cors import CORS

# This is a crucial step to ensure the script can find your calculation modules.
# It adds the 'backend/app' directory to Python's path.


# Now you can import your calculator
from calculations.area_volume import AreaVolumeCalculator
from calculations.flashover import FlashoverCalculator # <-- ADD THIS LINE
from utils.unit_converter import UnitConverter
# backend/api.py
from calculations.flashover import FlashoverCalculator
from calculations.flame_height import FlameHeightCalculator # <-- ADD THIS LINE
from utils.unit_converter import UnitConverter

# backend/api.py
from calculations.flame_height import FlameHeightCalculator
from calculations.radiation import RadiationCalculator # <-- ADD THIS LINE
from utils.unit_converter import UnitConverter

# backend/api.py
from calculations.radiation import RadiationCalculator
from calculations.t_squared import TSquaredCalculator # <-- ADD THIS LINE
from utils.unit_converter import UnitConverter

# backend/api.py
from calculations.t_squared import TSquaredCalculator
from calculations.heat_release import HeatReleaseCalculator # <-- ADD THIS LINE
from utils.unit_converter import UnitConverter

# backend/api.py
from calculations.heat_release import HeatReleaseCalculator
from calculations.material_properties import MaterialProperties # <-- ADD OR VERIFY THIS IMPORT
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
            print(f"--- ERROR in point_source_radiation_endpoint: {e} ---") # <-- ADD THIS LINE
            return jsonify({"error": str(e)}), 400
    # --- ADD THIS ENTIRE NEW ENDPOINT ---

# Paste this entire function into api.py

# Replace the old flame_height_endpoint with this one in api.py

@app.route('/api/flame_height', methods=['POST'])
def flame_height_endpoint():
    try:
        data = request.json
        mode = data.get('calculateMode')
        units = data.get('units', 'SI')
        
        hrr_in = float(data.get('heatRelease') or 0)
        diameter_in = float(data.get('diameter') or 0)
        flame_height_in = float(data.get('flameHeight') or 0)

        # 1. Convert all inputs to SI units first
        if units.lower() == 'imperial':
            hrr_si = UnitConverter.heat_release_converter(hrr_in, 'btu/s', 'kw')
            diameter_si = UnitConverter.length_converter(diameter_in, 'ft', 'm')
            flame_height_si = UnitConverter.length_converter(flame_height_in, 'ft', 'm')
        else:
            hrr_si = hrr_in
            diameter_si = diameter_in
            flame_height_si = flame_height_in

        # 2. Perform the calculation in SI units
        result_si = 0
        if mode == 'flameHeight':
            result_si = FlameHeightCalculator.calculate_flame_height(Q=hrr_si, D=diameter_si)
        elif mode == 'heatRelease':
            if flame_height_si <= 0 or diameter_si <= 0:
                raise ValueError("Flame Height and Diameter must be positive.")
            numerator = flame_height_si + (1.02 * diameter_si)
            result_si = (numerator / 0.235)**2.5
        elif mode == 'diameter':
            if flame_height_si <= 0 or hrr_si <= 0:
                raise ValueError("Flame Height and Heat Release Rate must be positive.")
            numerator = (0.235 * (hrr_si**0.4)) - flame_height_si
            if numerator <= 0:
                raise ValueError("Flame height is too large for the given Heat Release Rate.")
            result_si = numerator / 1.02
        else:
            raise ValueError(f"Invalid calculation mode: {mode}")

        # 3. Prepare the final value, converting the output if necessary
        final_value = 0
        if units.lower() == 'imperial':
            # We need to convert the SI result to Imperial units
            if mode == 'heatRelease':
                final_value = UnitConverter.heat_release_converter(result_si, 'kw', 'btu/s')
            else:  # This handles 'flameHeight' and 'diameter'
                final_value = UnitConverter.length_converter(result_si, 'm', 'ft')
        else:
            # If SI, the result is already in the correct units
            final_value = result_si

        return jsonify({"value": final_value})

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
 # --- ADD THIS ENTIRE NEW ENDPOINT ---
@app.route('/api/point_source_radiation', methods=['POST'])
def point_source_radiation_endpoint():
    try:
        data = request.json
        units = data.get('units', 'SI')

        hrr_in = float(data.get('heatRelease') or 0)
        distance_in = float(data.get('distance') or 0)
        rad_fraction = float(data.get('radiativeFraction') or 0)

        # 1. Convert inputs to SI
        if units.lower() == 'imperial':
            hrr_si = UnitConverter.heat_release_converter(hrr_in, 'btu/s', 'kw')
            distance_si = UnitConverter.length_converter(distance_in, 'ft', 'm')
        else:
            hrr_si = hrr_in
            distance_si = distance_in

        # 2. Perform calculation in SI
        result_si = RadiationCalculator.calculate_heat_flux(Q=hrr_si, R=distance_si, Xr=rad_fraction)

        # 3. Convert output if necessary
        final_value = result_si
        if units.lower() == 'imperial':
            # The point source formula gives heat flux (kW/m^2), which needs a specific converter
            final_value = UnitConverter.heat_flux_converter(result_si, 'kw/m2', 'btu/ft2/s')

        return jsonify({"value": final_value})

    except Exception as e:
        return jsonify({"error": str(e)}), 400   
    
    # --- ADD THIS ENTIRE NEW ENDPOINT ---
@app.route('/api/t_squared_growth', methods=['POST'])
def t_squared_growth_endpoint():
    try:
        data = request.json
        mode = data.get('calculateMode')
        units = data.get('units', 'SI')
        growth_rate = data.get('growthRate', 'medium')

        time_in = float(data.get('time') or 0)
        hrr_in = float(data.get('heatRelease') or 0)
        custom_alpha_in = float(data.get('customAlpha') or 0)

        # Determine alpha in SI units
        if growth_rate == 'custom':
            if units.lower() == 'imperial':
                alpha_si = UnitConverter.alpha_converter(custom_alpha_in, 'btu/s3', 'kw/s2')
            else:
                alpha_si = custom_alpha_in
        else:
            alpha_si = TSquaredCalculator.GROWTH_COEFFICIENTS.get(growth_rate)

        if alpha_si is None:
            raise ValueError(f"Invalid growth rate: {growth_rate}")

        # Convert other inputs to SI
        if units.lower() == 'imperial':
            hrr_si = UnitConverter.heat_release_converter(hrr_in, 'btu/s', 'kw')
        else:
            hrr_si = hrr_in

        # Perform calculation
        result_si = 0
        if mode == 'heatRelease':
            result_si = TSquaredCalculator.calculate_hrr(alpha=alpha_si, time=time_in)
        elif mode == 'time':
            result_si = TSquaredCalculator.calculate_time(alpha=alpha_si, hrr=hrr_si)

        # Convert final result back to imperial if needed
        final_value = result_si
        if units.lower() == 'imperial':
            if mode == 'heatRelease':
                final_value = UnitConverter.heat_release_converter(result_si, 'kw', 'btu/s')
            # Time is already in seconds, no conversion needed for 'time' mode

        return jsonify({"value": final_value})

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
    # --- ADD THIS ENTIRE NEW ENDPOINT ---
@app.route('/api/heat_release', methods=['POST'])
def heat_release_endpoint():
    try:
        data = request.json
        units = data.get('units', 'SI')
        material_key = data.get('material')
        area_in = float(data.get('burningArea') or 0)
        manual_mass_flux = data.get('manualMassFlux') # Can be None

        # Convert area input to SI
        if units.lower() == 'imperial':
            area_si = UnitConverter.area_converter(area_in, 'ft2', 'm2')
        else:
            area_si = area_in

        # Mass flux is always provided in g/m²-s from the frontend
        manual_mass_flux_si = float(manual_mass_flux) if manual_mass_flux else None

        # Perform calculation in SI
        result_si = HeatReleaseCalculator.calculate_hrr(
            material_key=material_key,
            burning_area=area_si,
            manual_mass_flux=manual_mass_flux_si
        )

        # Convert output if necessary
        final_value = result_si
        if units.lower() == 'imperial':
            final_value = UnitConverter.heat_release_converter(result_si, 'kw', 'btu/s')

        return jsonify({"value": final_value})

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
    # --- ADD THIS ENTIRE NEW ENDPOINT ---
@app.route('/api/materials', methods=['GET'])
def get_materials():
    try:
        # Use the new helper method to get all fuel data
        all_fuels = MaterialProperties.get_all_fuels()
        return jsonify(all_fuels)
    except Exception as e:
        # Return an error if something goes wrong
        return jsonify({"error": str(e)}), 500
    
# --- Main entry point to run the server ---
# This file no longer needs a __main__ block to run the server.
# The new top-level app.py handles that.