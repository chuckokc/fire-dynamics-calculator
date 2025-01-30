from utils.unit_converter import UnitConverter

class AreaVolumeCalculator:
    """
    Calculates surface areas and volumes for various compartment shapes
    commonly encountered in fire investigations. Handles both rectangular
    and cylindrical spaces with appropriate unit conversions.
    """
    
    @staticmethod
    def rectangular_compartment(length: float, width: float, height: float, units: str = 'SI') -> dict:
        """
        Calculates surface area and volume for a rectangular compartment.
        
        Args:
            length: Compartment length (m if SI, ft if imperial)
            width: Compartment width (m if SI, ft if imperial)
            height: Compartment height (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Dictionary containing:
                - total_surface_area (m² if SI, ft² if imperial)
                - floor_area (m² if SI, ft² if imperial)
                - wall_area (m² if SI, ft² if imperial)
                - volume (m³ if SI, ft³ if imperial)
        """
        # Input validation
        if any(dim <= 0 for dim in [length, width, height]):
            raise ValueError("All dimensions must be positive")
            
        # Calculate areas and volume
        floor_area = length * width
        wall_area = 2 * (length + width) * height
        total_surface_area = 2 * floor_area + wall_area
        volume = length * width * height
        
        # No conversion needed - calculations work the same in both unit systems
        return {
            'total_surface_area': total_surface_area,
            'floor_area': floor_area,
            'wall_area': wall_area,
            'volume': volume
        }
    
    @staticmethod
    def cylindrical_compartment(diameter: float, height: float, units: str = 'SI') -> dict:
        """
        Calculates surface area and volume for a cylindrical compartment.
        
        Args:
            diameter: Compartment diameter (m if SI, ft if imperial)
            height: Compartment height (m if SI, ft if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Dictionary containing:
                - total_surface_area (m² if SI, ft² if imperial)
                - floor_area (m² if SI, ft² if imperial)
                - wall_area (m² if SI, ft² if imperial)
                - volume (m³ if SI, ft³ if imperial)
        """
        import math
        
        # Input validation
        if any(dim <= 0 for dim in [diameter, height]):
            raise ValueError("All dimensions must be positive")
            
        radius = diameter / 2
        
        # Calculate areas and volume
        floor_area = math.pi * radius**2
        wall_area = math.pi * diameter * height
        total_surface_area = 2 * floor_area + wall_area
        volume = floor_area * height
        
        return {
            'total_surface_area': total_surface_area,
            'floor_area': floor_area,
            'wall_area': wall_area,
            'volume': volume
        }