from utils.unit_converter import UnitConverter
from calculations.material_properties import MaterialProperties

class FlashoverCalculator:
    """
    Calculates minimum heat release rate required for flashover using NUREG-1805
    methodologies. Implements three different correlations:
    1. McCaffrey, Quintiere and Harkleroad (MQH)
    2. Babrauskas
    3. Thomas
    """
    
    @staticmethod
    def validate_compartment_inputs(At: float, A0: float, H0: float, units: str = 'SI') -> bool:
        """
        Validates compartment dimensions according to NUREG-1805.
        
        Args:
            At: Total area of compartment surfaces
            A0: Area of ventilation opening
            H0: Height of ventilation opening
            
        Returns:
            bool: True if inputs are valid
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
        
        Args:
            At: Total area of compartment surfaces (m² if SI, ft² if imperial)
            A0: Area of opening (m² if SI, ft² if imperial)
            H0: Height of opening (m if SI, ft if imperial)
            wall_material: Material name from database
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Heat release rate required for flashover (kW)
            
        Formula: Q = 610(hk * At * A0 * √H0)^(1/2)
        """
        FlashoverCalculator.validate_compartment_inputs(At, A0, H0, units)
        
        # Convert dimensions to SI if needed
        working_At = At
        working_A0 = A0
        working_H0 = H0
        
        if units.lower() == 'imperial':
            working_At = UnitConverter.length_converter(At, 'ft', 'm')**2
            working_A0 = UnitConverter.length_converter(A0, 'ft', 'm')**2
            working_H0 = UnitConverter.length_converter(H0, 'ft', 'm')
            
        # Get material thermal properties
        hk = MaterialProperties.get_thermal_properties(wall_material)['conductivity']
        
        # Calculate minimum HRR for flashover
        Q = 610 * (hk * working_At * working_A0 * (working_H0**0.5))**0.5
        
        return Q

    @staticmethod
    def babrauskas_correlation(A0: float, H0: float, units: str = 'SI') -> float:
        """
        Calculates minimum HRR for flashover using Babrauskas method.
        
        Args:
            A0: Area of opening (m² if SI, ft² if imperial)
            H0: Height of opening (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Heat release rate required for flashover (kW)
            
        Formula: Q = 750 * A0 * √H0
        """
        if any(val <= 0 for val in [A0, H0]):
            raise ValueError("All dimensions must be positive")
            
        # Convert dimensions to SI if needed
        working_A0 = A0
        working_H0 = H0
        
        if units.lower() == 'imperial':
            working_A0 = UnitConverter.length_converter(A0, 'ft', 'm')**2
            working_H0 = UnitConverter.length_converter(H0, 'ft', 'm')
            
        # Calculate minimum HRR for flashover
        Q = 750 * working_A0 * (working_H0**0.5)
        
        return Q

    @staticmethod
    def thomas_correlation(At: float, A0: float, H0: float, units: str = 'SI') -> float:
        """
        Calculates minimum HRR for flashover using Thomas method.
        
        Args:
            At: Total area of compartment surfaces (m² if SI, ft² if imperial)
            A0: Area of opening (m² if SI, ft² if imperial)
            H0: Height of opening (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Heat release rate required for flashover (kW)
            
        Formula: Q = 7.8 * At + 378 * A0 * √H0
        """
        FlashoverCalculator.validate_compartment_inputs(At, A0, H0, units)
        
        # Convert dimensions to SI if needed
        working_At = At
        working_A0 = A0
        working_H0 = H0
        
        if units.lower() == 'imperial':
            working_At = UnitConverter.length_converter(At, 'ft', 'm')**2
            working_A0 = UnitConverter.length_converter(A0, 'ft', 'm')**2
            working_H0 = UnitConverter.length_converter(H0, 'ft', 'm')
            
        # Calculate minimum HRR for flashover
        Q = 7.8 * working_At + 378 * working_A0 * (working_H0**0.5)
        
        return Q