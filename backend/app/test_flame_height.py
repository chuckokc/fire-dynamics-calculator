from app.calculations.flame_height import FlameHeightCalculator

def test_flame_height_calculations():
    """
    Test flame height calculations with known values from NUREG-1805 examples.
    """
    print("\nTesting Flame Height Calculator:")
    print("-" * 30)
    
    # Test Case 1: A typical pool fire scenario
    Q = 1000  # 1MW fire
    D = 2     # 2m diameter
    
    # Test with SI units
    height_si = FlameHeightCalculator.heskestad_flame_height(Q, D, 'SI')
    print(f"\nTest Case 1 (SI Units):")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Fire Diameter: {D} m")
    print(f"Calculated Flame Height: {height_si:.2f} m")
    
    # Test with Imperial units
    height_imperial = FlameHeightCalculator.heskestad_flame_height(Q, D * 3.28084, 'imperial')
    print(f"\nTest Case 1 (Imperial Units):")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Fire Diameter: {D * 3.28084:.2f} ft")
    print(f"Calculated Flame Height: {height_imperial:.2f} ft")

if __name__ == "__main__":
    test_flame_height_calculations()