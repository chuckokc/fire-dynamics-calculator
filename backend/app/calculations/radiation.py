# backend/app/calculations/radiation.py
from ..utils.unit_converter import UnitConverter
from .material_properties import MaterialProperties
from .heat_release import HeatReleaseCalculator
import math


class RadiationCalculator:
    """
    Calculates radiative heat flux using the point source model.
    This calculator now assumes ALL inputs are in SI units.
    """

    @staticmethod
    def validate_inputs(Q: float, R: float, Xr: float) -> bool:
        """
        Validates inputs for the radiation calculation.
        """
        if any(val < 0 for val in [Q, R, Xr]):
            raise ValueError("Inputs cannot be negative.")
        if not 0 <= Xr <= 1:
            raise ValueError("Radiative fraction (Xr) must be between 0 and 1.")
        if R == 0:
            # Technically infinite, but we handle it as an error for practical purposes
            raise ValueError("Distance (R) cannot be zero.")
        return True

    @staticmethod
    def calculate_heat_flux(Q: float, R: float, Xr: float) -> float:
        """
        Calculates radiative heat flux (q") at a distance R from a fire.
        
        Args:
            Q (float): Total heat release rate of the fire in kW.
            R (float): Distance from the point source to the target in meters.
            Xr (float): Radiative fraction of the heat release (dimensionless).
            
        Returns:
            float: The radiative heat flux in kW/m².
            
        Formula: q" = (Q * Xr) / (4 * pi * R^2)
        """
        RadiationCalculator.validate_inputs(Q, R, Xr)
        
        heat_flux = (Q * Xr) / (4 * math.pi * (R**2))
        
        return heat_flux