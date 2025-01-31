from calculations.radiation import PointSourceRadiationCalculator

def test_radiation_calculations():
    """
    Test point source radiation calculations using NUREG-1805 examples.
    """
    print("\nTesting Point Source Radiation Calculator:")
    print("-" * 40)
    
    # Test Case 1: Direct calculation with known HRR
    Q = 1000    # 1MW fire
    R = 0.3     # 30% radiative fraction
    distance = 5 # 5m distance
    
    flux = PointSourceRadiationCalculator.calculate_point_source_radiation(
        Q, R, distance, 'SI'
    )
    
    print(f"\nTest Case 1 - Known HRR (SI Units):")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Radiative Fraction: {R}")
    print(f"Distance: {distance} m")
    print(f"Heat Flux: {flux:.2f} kW/m²")
    
    # Test Case 2: Material-based calculation
    material = "gasoline"
    area = 2.0      # m²
    R = 0.3
    distance = 5    # m
    
    results = PointSourceRadiationCalculator.calculate_from_material(
        material, area, R, distance, 'SI'
    )
    
    print(f"\nTest Case 2 - Material Based Calculation:")
    print(f"Material: {material}")
    print(f"Burning Area: {area} m²")
    print(f"Distance: {distance} m")
    print(f"Heat Release Rate: {results['heat_release_rate']:.1f} kW")
    print(f"Heat Flux: {results['heat_flux']:.2f} {results['units']}")
    
    # Test Case 3: Validation checks
    print("\nTest Case 3 - Input Validation:")
    try:
        PointSourceRadiationCalculator.calculate_point_source_radiation(
            1000, 1.5, 5, 'SI'
        )
        print("Failed: Should have caught invalid radiative fraction")
    except ValueError as e:
        print(f"Successfully caught error: {e}")

if __name__ == "__main__":
    test_radiation_calculations()