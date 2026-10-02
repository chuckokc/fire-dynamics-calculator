class UnitConverter:
    """
    A utility class that handles all unit conversions needed for fire dynamics calculations.
    This ensures consistent and accurate conversions between different measurement systems.
    """
    
    @staticmethod
    def temperature_converter(value: float, from_unit: str, to_unit: str) -> float:
        """
        Converts temperatures between Celsius, Fahrenheit, and Kelvin.
        This is crucial for fire calculations as different equations may require different scales.
        
        Example:
            20°C -> 68°F
            100°C -> 373.15K
        """
        # First convert to Kelvin as our common reference point
        # Think of Kelvin as our "universal language" for temperature
        if from_unit == 'C':
            kelvin = value + 273.15
        elif from_unit == 'F':
            kelvin = (value - 32) * 5/9 + 273.15
        elif from_unit == 'K':
            kelvin = value
        else:
            raise ValueError("Input unit must be 'C', 'F', or 'K'")
            
        # Now convert from Kelvin to our target unit
        if to_unit == 'C':
            return kelvin - 273.15
        elif to_unit == 'F':
            return (kelvin - 273.15) * 9/5 + 32
        elif to_unit == 'K':
            return kelvin
        else:
            raise ValueError("Output unit must be 'C', 'F', or 'K'")

    @staticmethod
    def length_converter(value: float, from_unit: str, to_unit: str) -> float:
        """
        Converts lengths between meters and feet.
        Important for dimensions in fire calculations like room size and flame height.
        
        Example:
            1 meter -> 3.28084 feet
            10 feet -> 3.048 meters
        """
        # Define our conversion factors
        conversions = {
            'm_to_ft': 3.28084,  # 1 meter = 3.28084 feet
            'ft_to_m': 0.3048    # 1 foot = 0.3048 meters
        }
        
        # If units are the same, no conversion needed
        if from_unit == to_unit:
            return value
        # Convert from meters to feet
        elif from_unit == 'm' and to_unit == 'ft':
            return value * conversions['m_to_ft']
        # Convert from feet to meters
        elif from_unit == 'ft' and to_unit == 'm':
            return value * conversions['ft_to_m']
        else:
            raise ValueError("Units must be 'm' or 'ft'")
         # --- ADD THIS ENTIRE NEW METHOD ---
    @staticmethod
    def heat_release_converter(value: float, from_unit: str, to_unit: str) -> float:
        """
        Converts heat release rates between kilowatts (kW) and British Thermal Units per second (BTU/s).
        
        Example:
            1000 kW -> 947.817 BTU/s
        """
        conversions = {
            'kw_to_btu': 0.947817, # 1 kW = 0.947817 BTU/s
            'btu_to_kw': 1.055056  # 1 BTU/s = 1.055056 kW
        }

        from_unit = from_unit.lower()
        to_unit = to_unit.lower()
        
        if from_unit == to_unit:
            return value
        elif from_unit == 'kw' and to_unit == 'btu/s':
            return value * conversions['kw_to_btu']
        elif from_unit == 'btu/s' and to_unit == 'kw':
            return value * conversions['btu_to_kw']
        else:
            raise ValueError("Units must be 'kW' or 'BTU/s'")
        
        # Add this method inside the UnitConverter class in unit_converter.py

    # Add this entire method to your UnitConverter class

    @staticmethod
    def heat_flux_converter(value: float, from_unit: str, to_unit: str) -> float:
        """
        Converts heat flux between kW/m² and BTU/ft²/s.
        """
        conversions = {
            'kw/m2_to_btu/ft2/s': 0.08811,
            'btu/ft2/s_to_kw/m2': 11.349
        }
        
        from_unit = from_unit.lower()
        to_unit = to_unit.lower()

        if from_unit == to_unit:
            return value
        elif from_unit == 'kw/m2' and to_unit == 'btu/ft2/s':
            return value * conversions['kw/m2_to_btu/ft2/s']
        elif from_unit == 'btu/ft2/s' and to_unit == 'kw/m2':
            return value * conversions['btu/ft2/s_to_kw/m2']
        else:
            raise ValueError("Units must be 'kW/m2' or 'BTU/ft2/s'")
        
       # Add this entire method to your UnitConverter class in unit_converter.py

    @staticmethod
    def alpha_converter(value: float, from_unit: str, to_unit: str) -> float:
        """
        Converts the fire growth coefficient (alpha) between kW/s² and BTU/s³.
        """
        # This conversion factor is the same as for heat release (kW to BTU/s)
        # because the time component (s²) is the same in both systems.
        CONVERSION_FACTOR = 0.947817 

        from_unit = from_unit.lower()
        to_unit = to_unit.lower()

        if from_unit == to_unit:
            return value
        elif from_unit == 'kw/s2' and to_unit == 'btu/s3':
            return value * CONVERSION_FACTOR
        elif from_unit == 'btu/s3' and to_unit == 'kw/s2':
            return value / CONVERSION_FACTOR
        else:
            raise ValueError("Units must be 'kW/s2' or 'BTU/s3'")
        
      # Add this method inside the UnitConverter class in unit_converter.py

# Add this entire method to your UnitConverter class in unit_converter.py

    @staticmethod
    def area_converter(value: float, from_unit: str, to_unit: str) -> float:
        """
        Converts area between square meters (m²) and square feet (ft²).
        """
        CONVERSION_FACTOR = 10.7639  # 1 m² = 10.7639 ft²

        from_unit = from_unit.lower()
        to_unit = to_unit.lower()

        if from_unit == to_unit:
            return value
        elif from_unit == 'm2' and to_unit == 'ft2':
            return value * CONVERSION_FACTOR
        elif from_unit == 'ft2' and to_unit == 'm2':
            return value / CONVERSION_FACTOR
        else:
            raise ValueError("Units must be 'm2' or 'ft2'")
