from utils.unit_converter import UnitConverter

class FlameHeightCalculator:
    """
    Implements methods for calculating flame heights in fire scenarios based on NUREG-1805.
    Primary calculation uses Heskestad's correlation, which is widely accepted in
    fire protection engineering for predicting flame heights.
    """
    @staticmethod
    def heskestad_flame_height(Q: float, D: float, units: str = 'SI') -> float:
        """
        Calculates flame height using Heskestad's correlation.
        
        Args:
            Q: Heat release rate (kW)
            D: Base diameter of the fire (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Flame height in meters (SI) or feet (imperial)
        
        Formula: L_f = 0.235Q^(2/5) - 1.02D
        where:
            L_f = flame height (m)
            Q = heat release rate (kW)
            D = base diameter of the fire (m)
        """
        # First, validate the inputs to ensure they're in acceptable ranges
        if Q <= 0:
            raise ValueError("Heat release rate must be positive")
            
        if units.lower() not in ['si', 'imperial']:
            raise ValueError("Units must be either 'SI' or 'imperial'")

        # If using imperial units, convert diameter to meters for calculation
        working_D = D
        if units.lower() == 'imperial':
            working_D = UnitConverter.length_converter(D, 'ft', 'm')
        
        # Calculate flame height using Heskestad's correlation
        L_f = 0.235 * (Q ** 0.4) - 1.02 * working_D
        
        # Convert result back to imperial if requested
        if units.lower() == 'imperial':
            L_f = UnitConverter.length_converter(L_f, 'm', 'ft')
            
        return L_f