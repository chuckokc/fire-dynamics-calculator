# backend/app/calculations/material_properties.py

import math

class MaterialProperties:
    """
    Provides thermal and fuel properties for materials used in fire dynamics calculations.
    """

    # --- NEW: Centralized dictionary for all fuel properties ---
    FUELS = {
        'liquefied_propane': {'name': 'Liquefied Propane', 'heat_of_combustion': 46.5, 'mass_flux': 115.0},
        'liquefied_natural_gas': {'name': 'Liquefied Natural Gas (LNG)', 'heat_of_combustion': 50.0, 'mass_flux': 90.0},
        'benzene': {'name': 'Benzene', 'heat_of_combustion': 40.0, 'mass_flux': 90.0},
        'butane': {'name': 'Butane', 'heat_of_combustion': 45.7, 'mass_flux': 80.0},
        'n-butane': {'name': 'n-Butane', 'heat_of_combustion': 45.7, 'mass_flux': None},
        'hexane': {'name': 'Hexane', 'heat_of_combustion': 43.8, 'mass_flux': 75.0},
        'n-hexane': {'name': 'n-Hexane', 'heat_of_combustion': 43.8, 'mass_flux': None},
        'xylene': {'name': 'Xylene', 'heat_of_combustion': 40.0, 'mass_flux': 70.0},
        'jp-4': {'name': 'JP-4', 'heat_of_combustion': 43.2, 'mass_flux': 60.0},
        'heptane': {'name': 'Heptane', 'heat_of_combustion': 44.6, 'mass_flux': 70.0},
        'gasoline': {'name': 'Gasoline', 'heat_of_combustion': 43.7, 'mass_flux': 55.0},
        'acetone': {'name': 'Acetone', 'heat_of_combustion': 30.8, 'mass_flux': 40.0},
        'methanol': {'name': 'Methanol', 'heat_of_combustion': 19.8, 'mass_flux': 22.0},
        'kerosene': {'name': 'Kerosene', 'heat_of_combustion': 43.2, 'mass_flux': None},
        'ethanol': {'name': 'Ethanol', 'heat_of_combustion': 26.8, 'mass_flux': None},
        
        'hdpe': {'name': 'HDPE', 'heat_of_combustion': 40.0, 'mass_flux': None},
        'polyethylene': {'name': 'Polyethylene', 'heat_of_combustion': 43.4, 'mass_flux': None},
        'polypropylene': {'name': 'Polypropylene', 'heat_of_combustion': 44.0, 'mass_flux': None},
        'polystyrene': {'name': 'Polystyrene', 'heat_of_combustion': 35.8, 'mass_flux': None},
        'polystyrene_granular': {'name': 'Polystyrene (Granular)', 'heat_of_combustion': 35.8, 'mass_flux': 38.0},
        'pmma': {'name': 'PMMA', 'heat_of_combustion': 24.2, 'mass_flux': None},
        'pmma_granular': {'name': 'PMMA (Granular)', 'heat_of_combustion': 24.2, 'mass_flux': 28.0},
        'polyethylene_granular': {'name': 'Polyethylene (Granular)', 'heat_of_combustion': 43.4, 'mass_flux': 26.0},
        'polypropylene_granular': {'name': 'Polypropylene (Granular)', 'heat_of_combustion': 44.0, 'mass_flux': 24.0},
        'nylon': {'name': 'Nylon', 'heat_of_combustion': 27.9, 'mass_flux': None},
        'nylon_6': {'name': 'Nylon 6', 'heat_of_combustion': 28.8, 'mass_flux': None},
        'pbt': {'name': 'PBT', 'heat_of_combustion': 20.9, 'mass_flux': None},
        'abs': {'name': 'ABS', 'heat_of_combustion': 30.0, 'mass_flux': None},
        'abs_fr': {'name': 'ABS-FR', 'heat_of_combustion': 11.7, 'mass_flux': None},
        'rigid_polyurethane_foam': {'name': 'Rigid Polyurethane Foam', 'heat_of_combustion': 22.3, 'mass_flux': 23.5},
        'flexible_polyurethane_foam': {'name': 'Flexible Polyurethane Foam', 'heat_of_combustion': 22.3, 'mass_flux': 24.0},
        'pvc': {'name': 'PVC', 'heat_of_combustion': 10.0, 'mass_flux': None},
        'pvc_granular': {'name': 'PVC (Granular)', 'heat_of_combustion': 10.0, 'mass_flux': 16.0},
        
        'corrugated_paper': {'name': 'Corrugated Paper', 'heat_of_combustion': 13.2, 'mass_flux': 14.0},
        'wood_crib': {'name': 'Wood Crib', 'heat_of_combustion': 14.7, 'mass_flux': 11.0},
        'douglas_fir': {'name': 'Douglas Fir', 'heat_of_combustion': 14.7, 'mass_flux': None},
        'hemlock': {'name': 'Hemlock', 'heat_of_combustion': 13.3, 'mass_flux': None},
        'plywood': {'name': 'Plywood', 'heat_of_combustion': 11.9, 'mass_flux': None},
        'plywood_fr': {'name': 'Plywood FR', 'heat_of_combustion': 11.2, 'mass_flux': None},
    }

    # This dictionary is for construction materials, not fuels
    THERMAL_PROPERTIES = {
        'gypsum_board': {
            'name': 'Gypsum Board',
            'conductivity': 0.16, # W/m-K
            'density': 790,      # kg/m³
            'specific_heat': 1.09 # kJ/kg-K
        },
        'concrete': {
            'name': 'Concrete',
            'conductivity': 1.6,
            'density': 2300,
            'specific_heat': 0.92
        },
        'brick': {
            'name': 'Brick',
            'conductivity': 0.8,
            'density': 1600,
            'specific_heat': 0.84
        }
    }

    # --- UPDATED Helper Methods to use the new FUELS dictionary ---

    @staticmethod
    def get_heat_of_combustion(material_key: str, units: str = 'SI') -> float:
        if material_key not in MaterialProperties.FUELS:
            raise ValueError(f"Material '{material_key}' not found in database")
        return MaterialProperties.FUELS[material_key]['heat_of_combustion']

    @staticmethod
    def get_mass_burning_flux(material_key: str, units: str = 'SI') -> float:
        if material_key not in MaterialProperties.FUELS:
            raise ValueError(f"Material '{material_key}' not found in database")
        
        mass_flux = MaterialProperties.FUELS[material_key].get('mass_flux')
        if mass_flux is None:
            raise ValueError(f"Mass flux not available for material: {material_key}")
        return mass_flux

    @staticmethod
    def get_thermal_properties(material_key: str) -> dict:
        if material_key not in MaterialProperties.THERMAL_PROPERTIES:
            raise ValueError(f"Material '{material_key}' not found in database")
        return MaterialProperties.THERMAL_PROPERTIES[material_key]
    
    @staticmethod
    def get_all_fuels() -> dict:
        return MaterialProperties.FUELS