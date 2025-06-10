from utils.unit_converter import UnitConverter
from calculations.material_properties import MaterialProperties

class FlashoverCalculator:
    """
    Calculates minimum heat release rate required for flashover using NUREG-1805
    methodologies. All calculations are performed in SI units.
    """
    
    @staticmethod
    def validate_compartment_inputs(At: float, A0: float, H0: float, units: str = 'SI') -> bool:
        """
        Validates compartment dimensions according to NUREG-1805.
        """
        if any(val <= 0 for val in [At, A0, H0]):
            raise ValueError("All dimensions must be positive")
        if A0 > At:
            raise ValueError("Vent area cannot exceed total surface area")
        return True

    @staticmethod
    def mccaffrey_correlation(At: float, A0: float, H0: float, wall_material: str = 'gypsum_board',
                             units: str = 'SI') -> float:
        """
        Calculates minimum HRR for flashover using MQH method.
        Assumes all inputs (At, A0, H0) are in SI units (m², m).
        """
        FlashoverCalculator.validate_compartment_inputs(At, A0, H0, units)
        
        # Get material thermal properties
        hk = MaterialProperties.get_thermal_properties(wall_material)['conductivity']
        
        # Calculate minimum HRR for flashover (result is in kW)
        Q = 610 * (hk * At * A0 * (H0**0.5))**0.5
        
        return Q

    @staticmethod
    def babrauskas_correlation(A0: float, H0: float, units: str = 'SI') -> float:
        """
        Calculates minimum HRR for flashover using Babrauskas method.
        Assumes all inputs (A0, H0) are in SI units (m², m).
        """
        if any(val <= 0 for val in [A0, H0]):
            raise ValueError("All dimensions must be positive")
            
        # Calculate minimum HRR for flashover (result is in kW)
        Q = 750 * A0 * (H0**0.5)
        
        return Q

    @staticmethod
    def thomas_correlation(At: float, A0: float, H0: float, units: str = 'SI') -> float:
        """
        Calculates minimum HRR for flashover using Thomas method.
        Assumes all inputs (At, A0, H0) are in SI units (m², m).
        """
        FlashoverCalculator.validate_compartment_inputs(At, A0, H0, units)
            
        # Calculate minimum HRR for flashover (result is in kW)
        Q = 7.8 * At + 378 * A0 * (H0**0.5)
        
        return Q