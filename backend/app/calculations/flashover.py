from utils.unit_converter import UnitConverter

class FlashoverCalculator:
    """
    Implements flashover calculations based on NUREG-1805 methodology.
    Provides three different methods for estimating heat release rate required
    for flashover in a compartment.
    """
    
    @staticmethod
    def mccaffrey_correlation(At: float, A0: float, H0: float, hk: float, units: str = 'SI') -> float:
        """
        Calculates minimum HRR for flashover using McCaffrey, Quintiere and Harkleroad method.
        
        Args:
            At: Total area of compartment surfaces (m² if SI, ft² if imperial)
            A0: Area of opening (m² if SI, ft² if imperial)
            H0: Height of opening (m if SI, ft if imperial)
            hk: Effective heat transfer coefficient (kW/m²/K)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Heat release rate required for flashover (kW)
        
        Formula: Q = 610(hk * At * A0 * √H0)^(1/2)
        """
        if units.lower() == 'imperial':
            At = UnitConverter.length_converter(At, 'ft', 'm')**2
            A0 = UnitConverter.length_converter(A0, 'ft', 'm')**2
            H0 = UnitConverter.length_converter(H0, 'ft', 'm')
            
        Q = 610 * (hk * At * A0 * (H0**0.5))**0.5
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
        if units.lower() == 'imperial':
            A0 = UnitConverter.length_converter(A0, 'ft', 'm')**2
            H0 = UnitConverter.length_converter(H0, 'ft', 'm')
            
        Q = 750 * A0 * (H0**0.5)
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
        if units.lower() == 'imperial':
            At = UnitConverter.length_converter(At, 'ft', 'm')**2
            A0 = UnitConverter.length_converter(A0, 'ft', 'm')**2
            H0 = UnitConverter.length_converter(H0, 'ft', 'm')
            
        Q = 7.8 * At + 378 * A0 * (H0**0.5)
        return Q