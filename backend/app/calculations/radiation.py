from utils.unit_converter import UnitConverter
from calculations.material_properties import MaterialProperties
from calculations.heat_release import HeatReleaseCalculator
import math

class PointSourceRadiationCalculator:
    """
    Implements point source radiation model from NUREG-1805.
    Calculates radiative heat flux to a target at a specified distance.
    """
    
    @staticmethod
    def validate_inputs(Q: float, R: float, distance: float) -> bool:
        """
        Validates inputs according to NUREG-1805 constraints.
        
        Args:
            Q: Heat release rate (kW)
            R: Radiative fraction (typical range 0.15-0.35)
            distance: Distance to target
            
        Returns:
            bool: True if inputs are valid
        """
        if Q <= 0:
            raise ValueError("Heat release rate must be positive")
        if R <= 0 or R > 1:
            raise ValueError("Radiative fraction must be between 0 and 1")
        if distance <= 0:
            raise ValueError("Distance must be positive")
        return True

    @staticmethod
    def calculate_point_source_radiation(Q: float, R: float, distance: float, 
                                       units: str = 'SI') -> float:
        """
        Calculates radiative heat flux using point source model.
        
        Args:
            Q: Heat release rate (kW)
            R: Radiative fraction (typical range 0.15-0.35)
            distance: Distance from fire to target (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Heat flux at target (kW/m² if SI, BTU/ft²/s if imperial)
            
        Formula: q" = (Q * R)/(4 * π * x²)
        where:
            q" = radiative heat flux
            Q = heat release rate
            R = radiative fraction
            x = distance to target
        """
        # Validate inputs
        PointSourceRadiationCalculator.validate_inputs(Q, R, distance)
        
        # Convert distance to SI if needed
        working_distance = distance
        if units.lower() == 'imperial':
            working_distance = UnitConverter.length_converter(distance, 'ft', 'm')
            
        # Calculate heat flux
        heat_flux = (Q * R) / (4 * math.pi * working_distance**2)
        
        # Convert to imperial units if requested
        if units.lower() == 'imperial':
            heat_flux = heat_flux * 0.088055  # Convert kW/m² to BTU/ft²/s
            
        return heat_flux

    @staticmethod
    def calculate_from_material(material: str, area: float, R: float, distance: float, 
                              units: str = 'SI') -> dict:
        """
        Calculates radiative heat flux using material properties.
        
        Args:
            material: Material name from database
            area: Burning area (m² if SI, ft² if imperial)
            R: Radiative fraction
            distance: Distance to target (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Dictionary containing:
                - heat_flux: Calculated radiative heat flux
                - heat_release_rate: HRR used in calculation
                - units: Units used for output
        """
        # Calculate heat release rate using material properties
        Q = HeatReleaseCalculator.calculate_hrr_from_burning_area(material, area, units)
        
        # Calculate heat flux
        flux = PointSourceRadiationCalculator.calculate_point_source_radiation(
            Q, R, distance, units
        )
        
        return {
            'heat_flux': flux,
            'heat_release_rate': Q,
            'units': 'BTU/ft²/s' if units.lower() == 'imperial' else 'kW/m²'
        }