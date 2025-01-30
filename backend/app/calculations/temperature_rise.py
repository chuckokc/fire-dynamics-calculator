from utils.unit_converter import UnitConverter
import math

class TemperatureRiseCalculator:
    """
    Calculates compartment temperature rise during fires based on NUREG-1805.
    Uses McCaffrey, Quintiere and Harkleroad (MQH) correlation for
    temperature rise in naturally ventilated compartments.
    """
    
    @staticmethod
    def calculate_mqh_temperature(Q: float, A0: float, H0: float, AT: float, 
                                hk: float, units: str = 'SI') -> float:
        """
        Calculates steady-state temperature rise using MQH correlation.
        
        Args:
            Q: Heat release rate (kW)
            A0: Vent opening area (m² if SI, ft² if imperial)
            H0: Vent height (m if SI, ft if imperial)
            AT: Total area of compartment surfaces (m² if SI, ft² if imperial)
            hk: Effective heat transfer coefficient (kW/m²/K)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Temperature rise above ambient (°C if SI, °F if imperial)
            
        Formula: ΔT = 6.85(Q²/(A0*√H0*AT*hk))^(1/3)
        """
        if any(val <= 0 for val in [Q, A0, H0, AT, hk]):
            raise ValueError("All input values must be positive")
            
        if units.lower() == 'imperial':
            # Convert areas and heights to SI
            A0 = UnitConverter.length_converter(A0, 'ft', 'm')**2
            H0 = UnitConverter.length_converter(H0, 'ft', 'm')
            AT = UnitConverter.length_converter(AT, 'ft', 'm')**2
            
        # Calculate temperature rise
        delta_T = 6.85 * (Q**2 / (A0 * math.sqrt(H0) * AT * hk))**(1/3)
        
        if units.lower() == 'imperial':
            # Convert temperature rise to Fahrenheit
            delta_T = delta_T * 1.8
            
        return delta_T
    
    @staticmethod
    def calculate_time_to_temperature(Q: float, A0: float, H0: float, AT: float, 
                                    hk: float, target_temp: float, 
                                    ambient_temp: float = 20, 
                                    units: str = 'SI') -> float:
        """
        Estimates time to reach a target temperature.
        
        Args:
            Q: Heat release rate (kW)
            A0: Vent opening area (m² if SI, ft² if imperial)
            H0: Vent height (m if SI, ft if imperial)
            AT: Total area of compartment surfaces (m² if SI, ft² if imperial)
            hk: Effective heat transfer coefficient (kW/m²/K)
            target_temp: Target temperature (°C if SI, °F if imperial)
            ambient_temp: Starting ambient temperature (°C if SI, °F if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Time to reach target temperature (seconds)
        """
        if units.lower() == 'imperial':
            # Convert temperatures to Celsius
            target_temp = UnitConverter.temperature_converter(target_temp, 'F', 'C')
            ambient_temp = UnitConverter.temperature_converter(ambient_temp, 'F', 'C')
            
        delta_T = target_temp - ambient_temp
        steady_state_delta_T = TemperatureRiseCalculator.calculate_mqh_temperature(
            Q, A0, H0, AT, hk, 'SI'
        )
        
        if delta_T > steady_state_delta_T:
            raise ValueError("Target temperature exceeds steady-state temperature")
            
        # Estimate time using thermal penetration time relationship
        time = (delta_T / steady_state_delta_T)**3 * (AT * hk)**2 / (Q * A0 * math.sqrt(H0))
        
        return time