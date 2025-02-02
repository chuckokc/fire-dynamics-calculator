from calculations.vent_flow import VentFlowCalculator

def test_vent_flow_calculations():
    """
    Test vent flow calculations for both SI and imperial units.
    """
    print("\nTesting Vent Flow Calculator:")
    print("-" * 40)
    
    # Test case with SI units
    vent_height = 2.0    # meters
    vent_width = 1.0     # meters
    neutral_plane = 1.0  # meters
    temp_hot = 500      # °C
    temp_ambient = 20   # °C
    
    results_si = VentFlowCalculator.natural_vent_flow(
        vent_height, vent_width, neutral_plane, 
        temp_hot, temp_ambient, 'SI'
    )
    
    print(f"\nTest Case (SI Units):")
    print(f"Vent dimensions: {vent_width}m x {vent_height}m")
    print(f"Neutral plane height: {neutral_plane}m")
    print(f"Hot gas temperature: {temp_hot}°C")
    print(f"Ambient temperature: {temp_ambient}°C")
    print(f"Mass flow in: {results_si['mass_flow_in']:.2f} kg/s")
    print(f"Mass flow out: {results_si['mass_flow_out']:.2f} kg/s")
    
    # Test case with Imperial units
    vent_height = 6.56     # feet (2m)
    vent_width = 3.28      # feet (1m)
    neutral_plane = 3.28   # feet (1m)
    temp_hot = 932        # °F (500°C)
    temp_ambient = 68     # °F (20°C)
    
    results_imperial = VentFlowCalculator.natural_vent_flow(
        vent_height, vent_width, neutral_plane,
        temp_hot, temp_ambient, 'imperial'
    )
    
    print(f"\nTest Case (Imperial Units):")
    print(f"Vent dimensions: {vent_width}ft x {vent_height}ft")
    print(f"Neutral plane height: {neutral_plane}ft")
    print(f"Hot gas temperature: {temp_hot}°F")
    print(f"Ambient temperature: {temp_ambient}°F")
    print(f"Mass flow in: {results_imperial['mass_flow_in']:.2f} lb/s")
    print(f"Mass flow out: {results_imperial['mass_flow_out']:.2f} lb/s")

if __name__ == "__main__":
    test_vent_flow_calculations()