from calculations.heat_release import HeatReleaseCalculator

def test_heat_release_calculations():
    """
    Test heat release rate calculations using values from NUREG-1805 examples.
    """
    print("\nTesting Heat Release Rate Calculator:")
    print("-" * 40)
    
    # Test case: Gasoline pool fire
    material = "gasoline"
    area = 4.0  # m²
    
    hrr = HeatReleaseCalculator.calculate_hrr_from_burning_area(material, area, 'SI')
    
    print(f"\nTest Case 1 - Gasoline Pool Fire:")
    print(f"Material: {material}")
    print(f"Burning Area: {area} m²")
    print(f"Heat Release Rate: {hrr:.1f} kW")
    
    # Test case: Same scenario in imperial units
    area_ft = 43.0  # ft²
    hrr_imperial = HeatReleaseCalculator.calculate_hrr_from_burning_area(
        material, area_ft, 'imperial'
    )
    
    print(f"\nTest Case 2 - Same Fire (Imperial Units):")
    print(f"Material: {material}")
    print(f"Burning Area: {area_ft} ft²")
    print(f"Heat Release Rate: {hrr_imperial:.1f} kW")

if __name__ == "__main__":
    test_heat_release_calculations()