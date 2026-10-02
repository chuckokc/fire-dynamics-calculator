from ..utils.unit_converter import UnitConverter

import math

class SmokeLayerCalculator:
    """
    Calculates smoke layer height and filling time in compartments
    based on NUREG-1805 methodologies.
    """
    
    @staticmethod
    def calculate_filling_time(Q: float, room_height: float, floor_area: float, 
                             target_height: float, units: str = 'SI') -> float:
        """
        Calculates time for smoke layer to descend to a target height.
        Uses an algebraic equation based on mass and energy conservation.
        
        Args:
            Q: Heat release rate (kW)
            room_height: Height of compartment (m if SI, ft if imperial)
            floor_area: Floor area of compartment (m² if SI, ft² if imperial)
            target_height: Target height of smoke layer (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Time to reach target height (seconds)
        """
        if Q <= 0:
            raise ValueError("Heat release rate must be positive")
        if any(val <= 0 for val in [room_height, floor_area, target_height]):
            raise ValueError("All dimensions must be positive")
        if target_height >= room_height:
            raise ValueError("Target height must be less than room height")
            
        if units.lower() == 'imperial':
            # Convert dimensions to SI
            room_height = UnitConverter.length_converter(room_height, 'ft', 'm')
            floor_area = UnitConverter.length_converter(floor_area, 'ft', 'm')**2
            target_height = UnitConverter.length_converter(target_height, 'ft', 'm')
            
        # Constants
        g = 9.81  # gravitational acceleration (m/s²)
        rho_amb = 1.2  # ambient air density (kg/m³)
        cp = 1.0  # specific heat of air (kJ/kg·K)
        T_amb = 293  # ambient temperature (K)
        
        # Calculate plume constant
        gamma = 0.21  # entrainment coefficient
        
        # Calculate filling time using smoke filling equation
        z = room_height - target_height  # depth of smoke layer
        time = (floor_area * rho_amb * cp * T_amb / (gamma * Q)) * (
            (room_height**(4/3) - (room_height - z)**(4/3)) / room_height**(1/3)
        )
        
        return time
    
    @staticmethod
    def calculate_layer_temperature(Q: float, room_height: float, layer_height: float,
                                  ambient_temp: float = 20, units: str = 'SI') -> float:
        """
        Calculates the average temperature of the smoke layer.
        
        Args:
            Q: Heat release rate (kW)
            room_height: Height of compartment (m if SI, ft if imperial)
            layer_height: Current height of smoke layer (m if SI, ft if imperial)
            ambient_temp: Ambient temperature (°C if SI, °F if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Smoke layer temperature (°C if SI, °F if imperial)
        """
        if units.lower() == 'imperial':
            room_height = UnitConverter.length_converter(room_height, 'ft', 'm')
            layer_height = UnitConverter.length_converter(layer_height, 'ft', 'm')
            ambient_temp = UnitConverter.temperature_converter(ambient_temp, 'F', 'C')
            
        # Constants
        g = 9.81  # gravitational acceleration (m/s²)
        cp = 1.0  # specific heat of air (kJ/kg·K)
        
        # Calculate temperature rise
        delta_T = (Q / (cp * math.pi)) * (
            (room_height - layer_height) / (room_height * layer_height**2)
        )**(1/3)
        
        temp = ambient_temp + delta_T
        
        if units.lower() == 'imperial':
            temp = UnitConverter.temperature_converter(temp, 'C', 'F')
            
        return temp