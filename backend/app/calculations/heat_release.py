from utils.unit_converter import UnitConverter

class HeatReleaseCalculator:
    """
    Implements heat release rate calculations based on NUREG-1805 methodology.
    Calculates the heat release rate (Q) based on mass loss rate and heat of combustion,
    or based on burning rate per unit area and fire area.
    """
    
    @staticmethod
    def calculate_mass_loss_rate(Q: float, H_c: float, units: str = 'SI') -> float:
        """
        Calculates mass loss rate based on heat release rate and heat of combustion.
        
        Args:
            Q: Heat release rate (kW)
            H_c: Heat of combustion (kJ/kg if SI, BTU/lb if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Mass loss rate (kg/s if SI, lb/s if imperial)
            
        Formula: m = Q/H_c
        where:
            m = mass loss rate
            Q = heat release rate
            H_c = heat of combustion
        """
        if Q <= 0:
            raise ValueError("Heat release rate must be positive")
        if H_c <= 0:
            raise ValueError("Heat of combustion must be positive")
            
        # Convert H_c to SI if in imperial
        working_H_c = H_c
        if units.lower() == 'imperial':
            working_H_c = H_c * 2.326  # Convert BTU/lb to kJ/kg
            
        # Calculate mass loss rate
        m = Q / working_H_c
        
        # Convert result to imperial if requested
        if units.lower() == 'imperial':
            m = m * 2.205  # Convert kg/s to lb/s
            
        return m
    
    @staticmethod
    def calculate_heat_release_rate(mass_rate: float, H_c: float, units: str = 'SI') -> float:
        """
        Calculates heat release rate based on mass loss rate and heat of combustion.
        
        Args:
            mass_rate: Mass loss rate (kg/s if SI, lb/s if imperial)
            H_c: Heat of combustion (kJ/kg if SI, BTU/lb if imperial)
            units: 'SI' for metric or 'imperial' for US units
            
        Returns:
            Heat release rate (kW)
            
        Formula: Q = m * H_c
        where:
            Q = heat release rate
            m = mass loss rate
            H_c = heat of combustion
        """
        if mass_rate <= 0:
            raise ValueError("Mass loss rate must be positive")
        if H_c <= 0:
            raise ValueError("Heat of combustion must be positive")
            
        # Convert from imperial if needed
        if units.lower() == 'imperial':
            mass_rate = mass_rate / 2.205  # Convert lb/s to kg/s
            H_c = H_c * 2.326  # Convert BTU/lb to kJ/kg
            
        # Calculate heat release rate
        Q = mass_rate * H_c
        
        return Q