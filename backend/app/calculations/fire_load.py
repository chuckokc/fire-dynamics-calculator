from utils.unit_converter import UnitConverter

class FireLoadCalculator:
    """
    Calculates fire load density and total fire load based on compartment contents.
    Essential for determining potential fire severity and duration.
    """
    
    @staticmethod
    def calculate_fire_load_density(total_energy: float, floor_area: float, units: str = 'SI') -> float:
        """
        Calculates fire load density based on total energy content and floor area.
        
        Args:
            total_energy: Total energy content (MJ if SI, BTU if imperial)
            floor_area: Floor area of compartment (m² if SI, ft² if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Fire load density (MJ/m² if SI, BTU/ft² if imperial)
        """
        if total_energy <= 0:
            raise ValueError("Total energy must be positive")
        if floor_area <= 0:
            raise ValueError("Floor area must be positive")
            
        # Calculate density
        density = total_energy / floor_area
        
        return density
    
    @staticmethod
    def calculate_total_fire_load(masses: list, heats_of_combustion: list, units: str = 'SI') -> float:
        """
        Calculates total fire load from masses and heats of combustion of materials.
        
        Args:
            masses: List of material masses (kg if SI, lb if imperial)
            heats_of_combustion: List of heats of combustion (MJ/kg if SI, BTU/lb if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Total fire load (MJ if SI, BTU if imperial)
        """
        if len(masses) != len(heats_of_combustion):
            raise ValueError("Number of masses must match number of heat of combustion values")
            
        if any(m <= 0 for m in masses) or any(h <= 0 for h in heats_of_combustion):
            raise ValueError("All masses and heats of combustion must be positive")
            
        # Calculate total energy
        total_energy = sum(m * h for m, h in zip(masses, heats_of_combustion))
        
        return total_energy