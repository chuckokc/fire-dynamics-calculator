from calculations.flame_height import FlameHeightCalculator

def test_flame_height_calculations():
    """
    Test flame height calculations using NUREG-1805 examples and material properties.
    """
    print("\nTesting Flame Height Calculator:")
    print("-" * 40)
    
    # Test Case 1: Direct calculation with known HRR
    Q = 1000  # 1MW fire
    D = 2     # 2m diameter
    
    height_si = FlameHeightCalculator.calculate_flame_height(Q, D, 'SI')
    print(f"\nTest Case 1 - Known HRR (SI Units):")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Fire Diameter: {D} m")
    print(f"Calculated Flame Height: {height_si:.2f} m")
    
    # Test Case 2: Using material properties
    material = "gasoline"
    diameter = 1.5  # meters
    
    results = FlameHeightCalculator.calculate_flame_height_from_material(
        material, diameter, 'SI'
    )
    
    print(f"\nTest Case 2 - Material Based Calculation:")
    print(f"Material: {material}")
    print(f"Fire Diameter: {diameter} m")
    print(f"Heat Release Rate: {results['heat_release_rate']:.1f} kW")
    print(f"Flame Height: {results['flame_height']:.2f} {results['units']}")
    
    # Test Case 3: Validation checks
    print("\nTest Case 3 - Input Validation:")
    try:
        FlameHeightCalculator.calculate_flame_height(1000, 0.1, 'SI')
        print("Failed: Should have caught invalid diameter")
    except ValueError as e:
        print(f"Successfully caught error: {e}")

if __name__ == "__main__":
    test_flame_height_calculations()