class MaterialProperties:
    """
    Provides standardized material properties from NUREG-1805 for use in fire dynamics calculations.
    Supports core calculations by providing verified material data.
    """
    
    # Heat of combustion values (MJ/kg)
    HEAT_OF_COMBUSTION = {
        'wood': 17.5,
        'polyethylene': 43.3,
        'polystyrene': 39.8,
        'gasoline': 43.7,
        'kerosene': 43.2,
        'paper': 16.8,
        'cotton': 16.5,
        'polyurethane_foam': 23.2,
        'pvc': 16.4,
        'methanol': 19.8
    }
    
    # Mass burning flux (kg/m²-s)
    MASS_BURNING_FLUX = {
        'wood_cribs': 0.08,
        'wood_panels': 0.062,
        'gasoline': 0.055,
        'kerosene': 0.039,
        'heptane': 0.101,
        'methanol': 0.017,
        'crude_oil': 0.035,
        'diesel_oil': 0.045,
        'transformer_oil': 0.039,
        'benzene': 0.085
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