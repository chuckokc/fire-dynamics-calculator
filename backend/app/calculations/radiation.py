from utils.unit_converter import UnitConverter

class PointSourceRadiationCalculator:
    """
    Implements the point source radiation model from NUREG-1805.
    This model calculates thermal radiation heat flux at a target location
    from a fire, treating the flame as a point source of radiation.
    """
    
    @staticmethod
    def calculate_heat_flux(Q: float, R: float, X: float, units: str = 'SI') -> float:
        """
        Calculates the radiant heat flux using the point source model.
        
        Args:
            Q: Total heat release rate of the fire (kW)
            R: Radiative fraction of heat release rate (typically 0.15-0.35)
            X: Distance from the point source to the target (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US customary units
            
        Returns:
            Heat flux at the target (kW/m² if SI, BTU/ft²/s if imperial)
        
        Formula: q" = (Q * R)/(4 * π * X²)
        where:
            q" = heat flux at target
            Q = heat release rate
            R = radiative fraction
            X = distance to target
        """
        if Q <= 0:
            raise ValueError("Heat release rate must be positive")
        if R <= 0 or R >= 1:
            raise ValueError("Radiative fraction must be between 0 and 1")
        if X <= 0:
            raise ValueError("Distance must be positive")
            
        # Convert distance to meters if in imperial units
        working_X = X
        if units.lower() == 'imperial':
            working_X = UnitConverter.length_converter(X, 'ft', 'm')
            
        # Calculate heat flux using point source model
        import math
        q = (Q * R) / (4 * math.pi * working_X**2)
        
        # Convert result to imperial units if requested
        if units.lower() == 'imperial':
            q = q * 0.088055  # Convert kW/m² to BTU/ft²/s
            
        return q