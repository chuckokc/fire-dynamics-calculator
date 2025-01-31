class MaterialProperties:
    """
    Provides standardized material properties from NUREG-1805 for use in fire dynamics calculations.
    Supports core calculations by providing verified material data.
    """
    
   # Heat of combustion values (kJ/g or MJ/kg)
    HEAT_OF_COMBUSTION = {
        # Gases
        'methane': 50.0,
        'ethane': 47.5,
        'ethene': 50.4,
        'propane': 46.5,
        'carbon_monoxide': 10.1,
        # Liquids
        'n-butane': 45.7,
        'n-hexane': 43.8,
        'heptane': 44.6,
        'gasoline': 43.7,
        'kerosene': 43.2,
        'benzene': 40.0,
        'acetone': 30.8,
        'ethanol': 26.8,
        'methanol': 19.8,
        # Ordinary polymers
        'hdpe': 40.0,  # High-density polyethylene
        'polyethylene': 43.4,
        'polypropylene': 44.0,
        'polystyrene': 35.8,
        'nylon': 27.9,
        'nylon_6': 28.8,
        'pmma': 24.2,  # Polymethyl methacrylate
        'pbt': 20.9,   # Polybutylene terephthalate
        'abs': 30.0,   # Acrylonitrile-butadiene-styrene
        'abs_fr': 11.7,
        'polyurethane_foam': 22.3,  # Average value from range 18.4-26.3
        'pvc': 10.0,   # Average value from range 9-11
        # Woods
        'douglas_fir': 14.7,
        'hemlock': 13.3,
        'plywood': 11.9,
        'plywood_fr': 11.2
    }

    # Mass burning flux (g/m²-s)
    MASS_BURNING_FLUX = {
        'liquefied_propane': 115.0,  # Average of 100-130
        'liquefied_natural_gas': 90.0,  # Average of 80-100
        'benzene': 90.0,
        'butane': 80.0,
        'hexane': 75.0,  # Average of 70-80
        'xylene': 70.0,
        'jp-4': 60.0,  # Average of 50-70
        'heptane': 70.0,  # Average of 65-75
        'gasoline': 55.0,  # Average of 50-60
        'acetone': 40.0,
        'methanol': 22.0,
        'polystyrene_granular': 38.0,
        'pmma_granular': 28.0,
        'polyethylene_granular': 26.0,
        'polypropylene_granular': 24.0,
        'rigid_polyurethane_foam': 23.5,  # Average of 22-25
        'flexible_polyurethane_foam': 24.0,  # Average of 21-27
        'pvc_granular': 16.0,
        'corrugated_paper': 14.0,
        'wood_crib': 11.0
    }
    
    # Thermal properties for common wall/ceiling materials
    THERMAL_PROPERTIES = {
        'gypsum_board': {
            'conductivity': 0.0016,  # kW/m/K
            'density': 790,          # kg/m³
            'specific_heat': 1.09    # kJ/kg/K
        },
        'concrete': {
            'conductivity': 0.0016,  # kW/m/K
            'density': 2300,         # kg/m³
            'specific_heat': 0.92    # kJ/kg/K
        },
        'brick': {
            'conductivity': 0.0008,  # kW/m/K
            'density': 1600,         # kg/m³
            'specific_heat': 0.84    # kJ/kg/K
        }
    }
    
    # Ignition temperatures (°C)
    IGNITION_TEMPERATURE = {
        'wood': 350,
        'paper': 230,
        'polyethylene': 340,
        'polyurethane_foam': 310,
        'gasoline': 280,
        'kerosene': 210
    }
    
    @staticmethod
    def get_heat_of_combustion(material: str, units: str = 'SI') -> float:
        """
        Get heat of combustion for a material.
        
        Args:
            material: Name of material (lowercase)
            units: 'SI' for MJ/kg, 'imperial' for BTU/lb
            
        Returns:
            Heat of combustion in specified units
        """
        try:
            hoc = MaterialProperties.HEAT_OF_COMBUSTION[material.lower()]
            if units.lower() == 'imperial':
                return hoc * 430.0  # Convert MJ/kg to BTU/lb
            return hoc
        except KeyError:
            raise ValueError(f"Material '{material}' not found in database")
    
    @staticmethod
    def get_mass_burning_flux(material: str, units: str = 'SI') -> float:
        """
        Get mass burning flux for a material.
        
        Args:
            material: Name of material (lowercase)
            units: 'SI' for kg/m²-s, 'imperial' for lb/ft²-s
            
        Returns:
            Mass burning flux in specified units
        """
        try:
            flux = MaterialProperties.MASS_BURNING_FLUX[material.lower()]
            if units.lower() == 'imperial':
                return flux * 0.204816  # Convert kg/m²-s to lb/ft²-s
            return flux
        except KeyError:
            raise ValueError(f"Material '{material}' not found in database")
    
    @staticmethod
    def get_thermal_properties(material: str) -> dict:
        """
        Get thermal properties for a material.
        
        Args:
            material: Name of material (lowercase)
            
        Returns:
            Dictionary of thermal properties
        """
        try:
            return MaterialProperties.THERMAL_PROPERTIES[material.lower()]
        except KeyError:
            raise ValueError(f"Material '{material}' not found in database")
    
    @staticmethod
    def get_ignition_temperature(material: str, units: str = 'SI') -> float:
        """
        Get ignition temperature for a material.
        
        Args:
            material: Name of material (lowercase)
            units: 'SI' for °C, 'imperial' for °F
            
        Returns:
            Ignition temperature in specified units
        """
        try:
            temp = MaterialProperties.IGNITION_TEMPERATURE[material.lower()]
            if units.lower() == 'imperial':
                return (temp * 9/5) + 32  # Convert °C to °F
            return temp
        except KeyError:
            raise ValueError(f"Material '{material}' not found in database")