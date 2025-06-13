# backend/app/calculations/heat_release.py

from .material_properties import MaterialProperties

class HeatReleaseCalculator:
    """
    Calculates the heat release rate of a fire based on material properties.
    This calculator assumes ALL inputs are in SI units.
    """

    @staticmethod
    def calculate_hrr(material_key: str, burning_area: float, manual_mass_flux: float = None) -> float:
        """
        Calculates the Heat Release Rate (HRR) in kW.
        """
        if burning_area < 0:
            raise ValueError("Burning area cannot be negative.")

        # --- THIS IS THE CORRECTED LOGIC ---
        # Get the specific properties needed for this calculation
        heat_of_combustion = MaterialProperties.get_heat_of_combustion(material_key, 'SI') # In MJ/kg

        # Use the provided manual mass flux if it exists, otherwise get it from the database
        if manual_mass_flux is not None:
            mass_flux = manual_mass_flux # In g/m²-s
        else:
            mass_flux = MaterialProperties.get_mass_burning_flux(material_key, 'SI') # In g/m²-s

        # Convert mass flux from g/m²-s to kg/m²-s for the formula
        mass_loss_rate_per_area = mass_flux / 1000.0
        
        # Q (kW) = ṁ" (kg/m²-s) * A (m²) * ΔHc (kJ/kg)
        # Note: heat_of_combustion from our database is in MJ/kg, so we multiply by 1000 to get kJ/kg.
        heat_release_rate = mass_loss_rate_per_area * burning_area * (heat_of_combustion * 1000)

        return heat_release_rate