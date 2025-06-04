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