from calculations.ceiling_jet import CeilingJetCalculator

def test_ceiling_jet_calculations():
    """
    Test ceiling jet temperature and velocity calculations.
    """
    print("\nTesting Ceiling Jet Calculator:")
    print("-" * 40)
    
    # Test parameters
    Q = 1000    # Heat release rate (kW)
    H = 3.0     # Ceiling height (m)
    r = 2.0     # Radial distance (m)
    
    # Test temperature rise calculation
    temp_rise = CeilingJetCalculator.calculate_temperature_rise(Q, H, r, 'SI')
    print(f"\nTest Case 1 - Temperature Rise (SI Units):")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Ceiling Height: {H} m")
    print(f"Radial Distance: {r} m")
    print(f"Temperature Rise: {temp_rise:.1f}°C")
    
    # Test velocity calculation
    velocity = CeilingJetCalculator.calculate_velocity(Q, H, r, 'SI')
    print(f"\nTest Case 2 - Ceiling Jet Velocity (SI Units):")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Ceiling Height: {H} m")
    print(f"Radial Distance: {r} m")
    print(f"Maximum Velocity: {velocity:.2f} m/s")
    
    # Test with imperial units
    H_ft = 10.0    # feet
    r_ft = 6.5     # feet
    
    temp_rise_imp = CeilingJetCalculator.calculate_temperature_rise(Q, H_ft, r_ft, 'imperial')
    velocity_imp = CeilingJetCalculator.calculate_velocity(Q, H_ft, r_ft, 'imperial')
    
    print(f"\nTest Case 3 - Imperial Units:")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Ceiling Height: {H_ft} ft")
    print(f"Radial Distance: {r_ft} ft")
    print(f"Temperature Rise: {temp_rise_imp:.1f}°F")
    print(f"Maximum Velocity: {velocity_imp:.2f} ft/s")

if __name__ == "__main__":
    test_ceiling_jet_calculations()