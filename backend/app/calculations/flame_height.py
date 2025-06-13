# backend/app/calculations/flame_height.py

class FlameHeightCalculator:
    """
    Calculates flame height based on Heskestad's correlation.
    This calculator now assumes ALL inputs are in SI units (kW, m).
    """
    
    @staticmethod
    def calculate_flame_height(Q: float, D: float) -> float:
        """
        Calculates flame height (L) in meters.
        
        Args:
            Q: Heat release rate in kW.
            D: Fire diameter in meters.
            
        Returns:
            Flame height (L) in meters.
            
        Formula: L = 0.235 * Q^(2/5) - 1.02 * D
        """
        if Q <= 0 or D <= 0:
            raise ValueError("Heat Release Rate and Diameter must be positive.")
            
        flame_height = 0.235 * (Q**0.4) - 1.02 * D
        
        # The result is negative or zero, it means no visible flame, return 0.
        if flame_height < 0:
            return 0
            
        return flame_height