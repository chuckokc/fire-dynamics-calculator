from utils.unit_converter import UnitConverter
import math

class VentFlowCalculator:
    """
    Calculates mass flow rates through vents based on NUREG-1805 methodology.
    Handles both natural and forced ventilation scenarios.
    """
    
    @staticmethod
    def natural_vent_flow(vent_height: float, vent_width: float, 
                         neutral_plane: float, temp_hot: float, 
                         temp_ambient: float, units: str = 'SI') -> dict:
        """
        Calculates mass flow rates through a vertical vent due to natural convection.
        
        Args:
            vent_height: Height of the vent (m if SI, ft if imperial)
            vent_width: Width of the vent (m if SI, ft if imperial)
            neutral_plane: Height of neutral plane from bottom (m if SI, ft if imperial)
            temp_hot: Hot gas temperature (°C if SI, °F if imperial)
            temp_ambient: Ambient temperature (°C if SI, °F if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Dictionary containing:
                - mass_flow_in: Mass flow rate into compartment (kg/s if SI, lb/s if imperial)
                - mass_flow_out: Mass flow rate out of compartment (kg/s if SI, lb/s if imperial)
        """
        if units.lower() == 'imperial':
            # Convert dimensions to meters
            vent_height = UnitConverter.length_converter(vent_height, 'ft', 'm')
            vent_width = UnitConverter.length_converter(vent_width, 'ft', 'm')
            neutral_plane = UnitConverter.length_converter(neutral_plane, 'ft', 'm')
            
            # Convert temperatures to Celsius
            temp_hot = UnitConverter.temperature_converter(temp_hot, 'F', 'C')
            temp_ambient = UnitConverter.temperature_converter(temp_ambient, 'F', 'C')
        
        # Convert temperatures to Kelvin for density calculations
        T_hot = temp_hot + 273.15
        T_amb = temp_ambient + 273.15
        
        # Constants
        g = 9.81  # gravitational acceleration, m/s²
        rho_amb = 353/T_amb  # ambient density (kg/m³)
        rho_hot = 353/T_hot  # hot gas density (kg/m³)
        
        # Calculate mass flow rates
        mass_flow_in = (2/3) * vent_width * neutral_plane * math.sqrt(
            2 * g * rho_amb * (rho_amb - rho_hot) * neutral_plane / rho_hot
        )
        
        mass_flow_out = (2/3) * vent_width * (vent_height - neutral_plane) * math.sqrt(
            2 * g * (rho_amb - rho_hot) * (vent_height - neutral_plane)
        )
        
        if units.lower() == 'imperial':
            # Convert mass flow rates to lb/s
            mass_flow_in *= 2.205
            mass_flow_out *= 2.205
            
        return {
            'mass_flow_in': mass_flow_in,
            'mass_flow_out': mass_flow_out
        }