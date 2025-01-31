from utils.unit_converter import UnitConverter
from calculations.material_properties import MaterialProperties
from calculations.heat_release import HeatReleaseCalculator

class FlameHeightCalculator:
    """
    Calculates flame heights based on NUREG-1805 methodology.
    Uses Heskestad's correlation, which relates flame height to heat release rate
    and fire diameter.
    """
    
    @staticmethod
    def validate_inputs(Q: float, D: float, units: str = 'SI') -> bool:
        """
        Validates inputs are within NUREG-1805's acceptable ranges.
        
        Args:
            Q: Heat release rate (kW)
            D: Base diameter of the fire (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            bool: True if inputs are valid
            
        Ranges from NUREG-1805:
            - Fire diameter: 0.2 to 50 meters
            - L/D ratio: 0.7 to 15
        """
        if Q <= 0:
            raise ValueError("Heat release rate must be positive")
            
        working_D = D
        if units.lower() == 'imperial':
            working_D = UnitConverter.length_converter(D, 'ft', 'm')
            
        if working_D < 0.2 or working_D > 50:
            raise ValueError("Fire diameter must be between 0.2 and 50 meters")
            
        return True

    @staticmethod
    def calculate_flame_height(Q: float, D: float, units: str = 'SI') -> float:
        """
        Calculates flame height using Heskestad's correlation from NUREG-1805.
        
        Args:
            Q: Heat release rate (kW)
            D: Base diameter of the fire (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Flame height (m if SI, ft if imperial)
            
        Formula: L = 0.235Q^(2/5) - 1.02D
        where:
            L = flame height (m)
            Q = heat release rate (kW)
            D = base diameter of fire (m)
        """
        # Validate inputs
        FlameHeightCalculator.validate_inputs(Q, D, units)
        
        # Convert diameter to SI if needed
        working_D = D
        if units.lower() == 'imperial':
            working_D = UnitConverter.length_converter(D, 'ft', 'm')
            
        # Calculate flame height using Heskestad's correlation
        L = 0.235 * (Q ** 0.4) - 1.02 * working_D
        
        # Convert result to imperial if requested
        if units.lower() == 'imperial':
            L = UnitConverter.length_converter(L, 'm', 'ft')
            
        return L

    @staticmethod
    def calculate_flame_height_from_material(material: str, diameter: float, 
                                           units: str = 'SI') -> dict:
        """
        Calculates flame height using material properties from database.
        
        Args:
            material: Material name from database
            diameter: Fire diameter (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Dictionary containing:
                - flame_height: Calculated flame height
                - heat_release_rate: Calculated HRR used
                - units: Units used for output
        """
        # Calculate area from diameter
        working_D = diameter
        if units.lower() == 'imperial':
            working_D = UnitConverter.length_converter(diameter, 'ft', 'm')
            
        area = 3.14159 * (working_D/2)**2
        
        # Calculate HRR using material properties
        Q = HeatReleaseCalculator.calculate_hrr_from_burning_area(material, area, 'SI')
        
        # Calculate flame height
        L = FlameHeightCalculator.calculate_flame_height(Q, working_D, units)
        
        return {
            'flame_height': L,
            'heat_release_rate': Q,
            'units': 'ft' if units.lower() == 'imperial' else 'm'
        }