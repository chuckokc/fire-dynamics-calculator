from calculations.temperature_rise import TemperatureRiseCalculator

def test_temperature_rise_calculations():
    """
    Test compartment temperature rise calculations.
    """
    print("\nTesting Temperature Rise Calculator:")
    print("-" * 40)
    
    # Test parameters (based on a small room)
    Q = 1000    # Heat release rate (kW)
    A0 = 2.0    # Vent area (m²)
    H0 = 2.0    # Vent height (m)
    AT = 100    # Total surface area (m²)
    hk = 0.0016 # Heat transfer coefficient (kW/m²/K) - typical for gypsum board
    
    # Test steady-state temperature rise
    delta_T = TemperatureRiseCalculator.calculate_mqh_temperature(
        Q, A0, H0, AT, hk, 'SI'
    )
    
    print(f"\nTest Case 1 - Steady State Temperature Rise (SI Units):")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Vent Area: {A0} m²")
    print(f"Vent Height: {H0} m")
    print(f"Total Surface Area: {AT} m²")
    print(f"Temperature Rise: {delta_T:.1f}°C")
    
    # Test time to reach target temperature
    target_temp = 100  # °C
    ambient_temp = 20  # °C
    
    time = TemperatureRiseCalculator.calculate_time_to_temperature(
        Q, A0, H0, AT, hk, target_temp, ambient_temp, 'SI'
    )
    
    print(f"\nTest Case 2 - Time to Target Temperature:")
    print(f"Target Temperature: {target_temp}°C")
    print(f"Ambient Temperature: {ambient_temp}°C")
    print(f"Time to Reach Target: {time:.1f} seconds")

if __name__ == "__main__":
    test_temperature_rise_calculations()