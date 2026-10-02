from ..utils.unit_converter import UnitConverter
import math

class CeilingJetCalculator:
    """
    Calculates ceiling jet temperature and velocity based on NUREG-1805 methodology.
    Used for determining thermal conditions beneath the ceiling during fires.
    """
    
    @staticmethod
    def calculate_temperature_rise(Q: float, H: float, r: float, units: str = 'SI') -> float:
        """
        Calculates temperature rise in the ceiling jet.
        
        Args:
            Q: Heat release rate (kW)
            H: Ceiling height above fire source (m if SI, ft if imperial)
            r: Radial distance from fire axis (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Temperature rise above ambient (°C if SI, °F if imperial)
            
        Formula based on Alpert's ceiling jet correlation
        """
        if Q <= 0:
            raise ValueError("Heat release rate must be positive")
        if H <= 0:
            raise ValueError("Ceiling height must be positive")
        if r <= 0:
            raise ValueError("Radial distance must be positive")
            
        if units.lower() == 'imperial':
            H = UnitConverter.length_converter(H, 'ft', 'm')
            r = UnitConverter.length_converter(r, 'ft', 'm')
            
        # Calculate temperature rise for r/H <= 0.18
        if r/H <= 0.18:
            delta_T = (16.9 * Q**(2/3)) / H**(5/3)
        # Calculate temperature rise for r/H > 0.18
        else:
            delta_T = (5.38 * (Q/r)**(2/3)) / H
            
        if units.lower() == 'imperial':
            # Convert temperature rise from °C to °F
            delta_T = delta_T * 1.8
            
        return delta_T
    
    @staticmethod
    def calculate_velocity(Q: float, H: float, r: float, units: str = 'SI') -> float:
        """
        Calculates maximum ceiling jet velocity.
        
        Args:
            Q: Heat release rate (kW)
            H: Ceiling height above fire source (m if SI, ft if imperial)
            r: Radial distance from fire axis (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Maximum ceiling jet velocity (m/s if SI, ft/s if imperial)
        """
        if Q <= 0:
            raise ValueError("Heat release rate must be positive")
        if H <= 0:
            raise ValueError("Ceiling height must be positive")
        if r <= 0:
            raise ValueError("Radial distance must be positive")
            
        if units.lower() == 'imperial':
            H = UnitConverter.length_converter(H, 'ft', 'm')
            r = UnitConverter.length_converter(r, 'ft', 'm')
            
        # Calculate velocity for r/H <= 0.15
        if r/H <= 0.15:
            velocity = 0.96 * (Q/H)**(1/3)
        # Calculate velocity for r/H > 0.15
        else:
            velocity = 0.195 * Q**(1/3) * H**(1/2) / r**(5/6)
            
        if units.lower() == 'imperial':
            velocity = velocity * 3.28084  # Convert m/s to ft/s
            
        return velocity